import logging
import os
import sys
import re

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

NAMES_TO_DESCRIPTION = lambda: {
    device.name: device.description for device in serial.tools.list_ports.comports()
}


tempreport_exp = re.compile(r"([TB]\d*):([-+]?\d*\.?\d*)(?: ?\/)?([-+]?\d*\.?\d*)")
def parse_temperature_report(report):
    matches = tempreport_exp.findall(report)
    return dict((m[0], (m[1], m[2])) for m in matches)