from . import utils
from .api import app
from .config import printer_config

import os
import asyncio

from hypercorn.asyncio import serve
from hypercorn.config import Config

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", 5000))
DEV = os.environ.get("DEV", "false").lower() == "true"
MOCK = os.environ.get("MOCK", "false").lower() == "true"

if MOCK:
    utils.logger.info("mock mode enabled, creating mock printers")
    for i in range(3):
        utils.create_mock_printer(i)

    utils.logger.info(f"Available printers: {printer_config.get_available_printers()}")

def main():
    config = Config()
    config.bind = f"{HOST}:{PORT}"
    config.use_reloader = DEV

    utils.logger.info(f"Starting server on {HOST}:{PORT}")
    utils.logger.info("Press Ctrl+C to quit.")

    asyncio.run(serve(app, config))

if __name__ == "__main__":
    main()