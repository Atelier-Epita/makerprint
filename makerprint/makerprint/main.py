from . import api, utils

import os
import asyncio

from hypercorn.asyncio import serve
from hypercorn.config import Config

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", 5000))
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"

if DEBUG:
    utils.logger.info("Debug mode enabled")
    from .mock_printer import MockPrinter

    device = MockPrinter()
    device.open() # start the mock printer thread

    utils.logger.info(f"Mock serial port: {device.port}")

    # Mock the serial port list
    # This is a workaround to avoid modifying the original list_ports function
    original_comports = utils.serial.tools.list_ports.comports
    utils.serial.tools.list_ports.comports = lambda: original_comports() + [
        type('FakePort', (), {
            'device': device.port,
            'name': 'Mock Printer',
            'description': 'Mock Printer Device'
        })()
    ]

    utils.logger.info(f"Mock list_ports: {utils.NAMES_TO_PORTS().items()}")

def main():
    config = Config()
    config.bind = f"{HOST}:{PORT}"
    config.use_reloader = DEBUG

    utils.logger.info(f"Starting server on {HOST}:{PORT}")
    utils.logger.info("Press Ctrl+C to quit.")

    asyncio.run(serve(api.app, config))