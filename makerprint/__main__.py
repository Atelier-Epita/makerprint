from . import api, utils

import os
import sys
import argparse
import logging

parser = argparse.ArgumentParser()
parser.add_argument("--debug", action="store_true")
args = parser.parse_args()
debug = args.debug

LOGPATH = os.environ.get("LOGPATH", "log.txt")
GCODEFOLDER = os.environ.get("GCODEFOLDER", "data")
LOGPATH = os.environ.get("LOGPATH", "log.txt")
LOGLEVEL = os.environ.get("LOGLEVEL", "INFO").upper()
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", 5000))

# create gcode folder if it does not exist
if not os.path.exists(GCODEFOLDER):
    os.mkdir(GCODEFOLDER)

logging.basicConfig(
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOGPATH, mode="w"),
    ],
    level=LOGLEVEL,
)

logger = logging.getLogger(__name__)

if debug:
    from mock_serial import MockSerial
    device = MockSerial()
    device.open()

    old_list_ports = utils.list_ports
    utils.list_ports = lambda: old_list_ports() + [device.port]

def main():
    """Main function to run the Flask application."""
    logging.info("Starting Flask application...")
    api.app.config["GCODEFOLDER"] = GCODEFOLDER
    api.app.run(host=HOST, port=PORT, debug=debug)
    api.run(args.config, args.debug)
