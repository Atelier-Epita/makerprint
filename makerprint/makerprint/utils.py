import asyncio
import logging
import os
import re
import sys

import serial
import serial.tools.list_ports
from printrun.printcore import printcore

from . import models

LOGPATH = os.environ.get("LOGPATH", "log.txt")
LOGLEVEL = os.environ.get("LOGLEVEL", "DEBUG").upper()
LOGPATH = os.environ.get("LOGPATH", "log.txt")
GCODEFOLDER = os.environ.get("GCODEFOLDER", "data")
BAUDRATES = [
    250000,
    115200,
    57600,
    38400,
    19200,
    9600,
]


logging.basicConfig(
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOGPATH, mode="w"),
    ],
    level=LOGLEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


NAMES_TO_PORTS = lambda: {
    device.name: device.device for device in serial.tools.list_ports.comports()
}

PORTS_TO_NAMES = lambda: {
    device.device: device.name for device in serial.tools.list_ports.comports()
}

NAMES_TO_DESCRIPTION = lambda: {
    device.name: device.description for device in serial.tools.list_ports.comports()
}


tempreport_exp = re.compile(r"([TB]\d*):([-+]?\d*\.?\d*)(?: ?\/)?([-+]?\d*\.?\d*)")


def parse_temperature_report(report):
    matches = tempreport_exp.findall(report)
    return dict((m[0], (m[1], m[2])) for m in matches)


def create_mock_printer(i):
    from .mock_printer import MockPrinter

    device = MockPrinter()
    device.open()  # start the mock printer thread

    logger.info(f"Mock serial port: {device.port}")

    # Mock the serial port list
    # This is a workaround to avoid modifying the original list_ports function
    original_comports = serial.tools.list_ports.comports
    serial.tools.list_ports.comports = lambda: original_comports() + [
        type(
            "FakePort",
            (),
            {
                "device": device.port,
                "name": f"MockPrinter{i}",
                "description": f"Mock Printer Device {i}",
            },
        )()
    ]


async def auto_detect_baud(port, ser_timeout=1, timeout=5) -> int | bool:
    """Small utility to auto-detect the baud rate for a 3d printer."""

    for baud in BAUDRATES:
        ser = None
        try:
            logger.debug(f"Trying baud rate {baud} for {port}")
            ser = serial.Serial(
                port=port,
                baudrate=baud,
                timeout=ser_timeout,
                write_timeout=ser_timeout,
            )

            start_time = asyncio.get_event_loop().time()
            timeout_time = start_time + timeout

            ser.write(b"\n")
            ser.reset_input_buffer()
            ser.reset_output_buffer()
            ser.flush()

            ser.write(b"M105\n")  # temperature report command, should output something like "T:200.0 /200.0 B:60.0 /60.0"

            while asyncio.get_event_loop().time() < timeout_time:
                line = ser.readline(100)
                if b"ok" in line or b"T:" in line or b"echo:" in line or b"error:" in line:
                    logger.debug(f"Detected baud rate {baud} for {port}")
                    ser.close() # close the serial port for later use
                    return baud
                elif line:
                    logger.debug(f"Received line: {line.decode('utf-8', errors='ignore').strip()}")
            
            ser.close()
            logger.debug(f"No response from {port} at {baud} baud")

        except (serial.SerialException, ValueError) as e:
            logger.warning(f"Failed to connect to {port} at {baud} baud: {e}")

        finally:
            if ser and ser.is_open:
                ser.close()

    logger.error(f"Failed to auto-detect baud rate for {port}")
    return False

