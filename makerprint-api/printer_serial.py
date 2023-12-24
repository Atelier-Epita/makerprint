import logging
import time
import threading

try:  # pyserial
    import serial
    import serial.tools.list_ports
except ImportError:
    logging.error("pyserial is not installed. Please install it with pip.")
    exit()

from .const import *


def connect(port="/dev/ttyUSB0", timeout=1, baudrate=None):
    if baudrate is not None:
        logging.info("Connecting to printer on port %s at %d baud", port, baudrate)
        return serial.Serial(port, baudrate, timeout=timeout)

    for baudrate in BAUDRATES:
        try:
            ser = serial.Serial(port, baudrate, timeout=timeout)
            logging.info("Connected to printer on port %s at %d baud", port, baudrate)
            return ser
        except serial.SerialException:
            pass

    logging.error("Could not connect to printer on port %s", port)
    return None


def list_ports():
    return [device.device for device in serial.tools.list_ports.comports()]


class PrinterSerial:
    def __init__(self, port="/dev/ttyUSB0", baudrate=None):
        self.ser = connect(port, baudrate=baudrate)
        if self.ser is None:
            raise ValueError("Could not connect to printer")

        self.recv_thread = None
        self.recv_buffer = []
        self.recv_thread_running = False
        self.blocking_recv = False
        self.start_recv_thread()

    def send_raw(self, content: bytes):
        """
        Write the raw content (bytes) to the serial port.
        """
        self.ser.write(content)
        logging.debug(f"b>>> {content}")

    def send(self, content):
        """
        Sends properly a string to the serial port.
        """
        if not content.endswith("\n"):
            content += "\n"

        logging.debug(f">>> {content}")
        self.ser.write(content.encode("utf-8"))

    def recv_raw(self):
        """
        Read multiples lines (bytes) from the serial port.
        """
        content = self.ser.readlines()
        logging.debug(f"b<<< {content}")

    def recv(self):
        """
        Read and decode multiple lines from the serial port.
        """
        response = self.ser.readlines()
        response = [line.decode("utf-8").strip() for line in response]
        logging.debug(f"<<< {response}")
        return response

    def recv_until(self, until, raw=False):
        """
        Read and decode multiple lines from the serial port until the given string is found.
        """
        response = []
        while True:
            line = self.ser.readline()

            if not raw:
                line = line.decode("utf-8").strip()

            logging.debug(f"<<< {line}")
            response.append(line)
            if line == until:
                break
        return response

    def __recv_thread(self):
        """
        Read and decode multiple lines from the serial port in a thread.
        """
        logging.info("Recv thread started")
        while self.recv_thread_running:
            while self.blocking_recv:
                time.sleep(0.01)

            lines = self.ser.readlines()
            lines = [line.decode("utf-8").strip() for line in lines]
            for line in lines:
                logging.debug(f"<<< {line}")
            self.recv_buffer.extend(lines)

        logging.info("Recv thread stopped")

    def start_recv_thread(self):
        self.recv_thread_running = True
        self.recv_thread = threading.Thread(target=self.__recv_thread)
        self.recv_thread.start()

    def init_sd_card(self):
        """
        Initialize the SD card of the printer.
        """
        self.send(INIT_SD_CARD)

    def list_sd_card(self):
        """
        List the files on the SD card of the printer.
        """
        self.send(LIST_SD_CARD)

    def select_sd_file(self, filename):
        self.send(SELECT_SD_FILE + " " + filename)

    def start_print(self):
        self.send(START_PRINT)

    def upload_file(self, filepath: str):
        self.send(BEGIN_WRITE + " " + filepath)
        with open(filepath, "rb") as f:
            for line in f.readlines():
                self.send_raw(line)
        self.send(END_WRITE + " " + filepath)

    def create_file(self, filename: str, file_content: bytes):
        self.send(BEGIN_WRITE + " " + filename)
        self.send_raw(file_content)
        self.send(END_WRITE + " " + filename)

    def __del__(self):
        self.recv_thread_running = False
        self.recv_thread.join()
        self.ser.close()