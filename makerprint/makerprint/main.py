from . import api, utils

import os
import argparse
import asyncio

from hypercorn.asyncio import serve
from hypercorn.config import Config

parser = argparse.ArgumentParser()
parser.add_argument("--debug", action="store_true")
args = parser.parse_args()
debug = args.debug

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", 5000))

if debug:
    utils.logger.info("Debug mode enabled")
    from mock_serial import MockSerial

    device = MockSerial()
    device.open()

    utils.logger.info(f"Mocking serial port: {device.port}")

    old_list_ports = utils.list_ports
    utils.list_ports = lambda: old_list_ports() + [device.port]

def main():
    config = Config()
    config.bind = f"{HOST}:{PORT}"
    config.use_reloader = debug
    config.use_uvloop = True

    utils.logger.info(f"Starting server on {HOST}:{PORT}")
    utils.logger.info("Press Ctrl+C to quit.")

    asyncio.run(serve(api.app, config))