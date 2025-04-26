"""
Mock Printer for simulating a 3D printer's serial communication.
based on https://pypi.org/project/mock-serial/
"""

import logging
import os
import pty
import time
from threading import Thread

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class MockPrinter:
    QUIT_SIGNAL = b'mockserialquit'

    def __init__(self):
        self.__master, self._slave = pty.openpty()
        self.__thread = Thread(target=self.__listen, daemon=True)

    @property
    def port(self):
        """Return the fake serial port name (like /dev/pts/3)."""
        return os.ttyname(self._slave)

    def open(self):
        """Start listening for incoming commands."""
        self.__thread.start()
        logger.debug(f"MockPrinter started on {self.port}")

    def close(self):
        """Send quit signal and close the virtual printer."""
        logger.debug("Closing MockPrinter...")
        os.write(self._slave, self.QUIT_SIGNAL)
        self.__thread.join(timeout=1)
        os.close(self.__master)
        os.close(self._slave)
        logger.debug("MockPrinter closed.")

    def __listen(self):
        buffer = bytes()

        while self.QUIT_SIGNAL not in buffer:
            try:
                buffer += os.read(self.__master, 64)
                if buffer:
                    logger.debug(f"Received buffer: {buffer}")
                    lines = buffer.split(b'\n')
                    for line in lines[:-1]:
                        self.__handle_command(line.strip())
                    buffer = lines[-1]
            except OSError:
                break

    def __handle_command(self, command):
        """Process a single G-code line."""
        if not command:
            return
        
        response = self.__generate_response(command)
        logger.debug(f"Sending response: {response}")
        os.write(self.__master, response.encode('utf-8') + b'\n')

    def __generate_response(self, command: bytes) -> str:
        """Return a fake response based on the G-code command."""
        command = command.decode('utf-8').strip().upper()

        if command.startswith('M105'):  # Get Temperature
            return "ok T:200 /200 B:60 /60"
        elif command.startswith('G28'):  # Home axes
            return "ok Homing done"
        elif command.startswith('M115'):  # Get firmware version
            return "FIRMWARE_NAME:MockPrinter VERSION:1.0"
        elif command.startswith('M114'):  # Get current position
            return "X:0.00 Y:0.00 Z:0.00 E:0.00 Count X:0 Y:0 Z:0"
        else:
            # sleep for a bit to simulate movement or processing time
            time.sleep(0.1)
            return "ok"  # Default reply


if __name__ == "__main__":
    printer = MockPrinter()
    printer.open()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        printer.close()
