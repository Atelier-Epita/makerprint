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

    # some commands that should be enough to simulate the handshake and so on
    device.stub(receive_bytes=b'M105\n', send_bytes=b'ok T:200 /200 B:60 /60\n')
    device.stub(receive_bytes=b'M114\n', send_bytes=b'X:0.00 Y:0.00 Z:0.00 E:0.00 Count X:0 Y:0 Z:0\nok\n')
    device.stub(receive_bytes=b'M115\n', send_bytes=b'FIRMWARE_NAME:MockPrinter VERSION:1.0\nok\n')

    device.stub(receive_bytes=b'G28\n', send_bytes=b'ok\n')
    device.stub(receive_bytes=b'N-1 M110 N-1*125\n', send_bytes=b'ok\n')
    device.stub(receive_bytes=b'G1 X10 Y10 Z10 E10\n', send_bytes=b'ok\n')

    utils.logger.info(f"Mock serial port: {device.port}")

    # Mock the serial port list
    # This is a workaround to avoid modifying the original list_ports function
    original_comports = utils.serial.tools.list_ports.comports
    utils.serial.tools.list_ports.comports = lambda: original_comports() + [
        type('FakePort', (), {
            'device': device.port,
            'name': 'MockSerial',
            'description': 'Mock Printer Device'
        })()
    ]

    utils.logger.info(f"Mock list_ports: {utils.list_ports()}")

def main():
    config = Config()
    config.bind = f"{HOST}:{PORT}"
    config.use_reloader = debug
    config.use_uvloop = True

    utils.logger.info(f"Starting server on {HOST}:{PORT}")
    utils.logger.info("Press Ctrl+C to quit.")

    asyncio.run(serve(api.app, config))