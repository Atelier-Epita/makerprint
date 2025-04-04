import logging

import serial
import serial.tools.list_ports


def list_ports():
    return [device.device for device in serial.tools.list_ports.comports()]
