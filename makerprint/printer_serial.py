import logging
import time

import serial

from . import commands

logging.basicConfig(filename="makerprint.log")

baudrates = [115200, 57600, 38400, 19200, 9600]


def connect(port="/dev/ttyUSB0", timeout=1, baudrate=None):

    if baudrate is not None:
        logging.info("Connecting to printer on port %s at %d baud", port, baudrate)
        return serial.Serial(port, baudrate, timeout=timeout)

    for baudrate in baudrates:
        try:
            ser = serial.Serial(port, baudrate, timeout=timeout)
            logging.info("Connected to printer on port %s at %d baud", port, baudrate)
            return ser
        except serial.SerialException:
            pass

    logging.error("Could not connect to printer on port %s", port)
    return None


def list_ports():
    import serial.tools.list_ports
    ports = [device.device for device in serial.tools.list_ports.comports()]
    logging.debug(f"Found ports: {ports}")
    return ports


class PrinterSerial():

    def __init__(self, port="/dev/ttyUSB0", baudrate=None):
        self.ser = connect(port, baudrate=baudrate)
        if self.ser is None:
            raise ValueError("Could not connect to printer")
    
    def send_raw(self, content: bytes):
        self.ser.write(content)
        return self.ser.readlines()

    def recv_raw(self):
        return self.ser.readlines()

    def recv(self):
        response = self.ser.readlines()
        response = [line.decode('utf-8').strip() for line in response]
        return response

    def send(self, content):
        if not content.endswith("\n"):
            content += "\n"

        logging.debug(f"Sending command: {content}")
        print(f"Sending command: {content}")
        self.ser.write(content.encode('utf-8'))


    def init_sd_card(self):
        self.send(commands.INIT_SD_CARD)
        return self.recv()

    def list_sd_card(self):
        self.send(commands.LIST_SD_CARD)
        return self.recv()

    def select_sd_card(self, filename):
        self.send(commands.SELECT_SD_CARD + " " + filename)
        return self.recv()

    def start_print(self):
        self.send(commands.START_PRINT)
        return self.recv()

    def write_file(self, filename: str, file_content: bytes):
        self.send(commands.BEGIN_WRITE + " " + filename)
        ret = self.recv()
        print(ret)

        self.send_raw(file_content)

        self.send(commands.END_WRITE + " " + filename)
        return self.recv()
