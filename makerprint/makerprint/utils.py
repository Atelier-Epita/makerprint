import logging
import os
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


def list_ports():
    return [device.device for device in serial.tools.list_ports.comports()]


def list_names():
    return [device.name for device in serial.tools.list_ports.comports()]


NAMES_TO_PORTS = lambda: {
    device.name: device.device for device in serial.tools.list_ports.comports()
}


def printer_status(p: printcore):
    return models.PrinterStatus(
        connected=p.online,
        port=p.port,
        baud=p.baud,
        printing=p.printing,
        paused=p.paused,
        progress=(
            int(p.lineno * 100 / p.queueindex)
            if p.queueindex > 0 and (p.printing or p.paused)
            else 0
        ),
    )
