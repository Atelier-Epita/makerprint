from . import utils
from .api import app

import os
import asyncio

from hypercorn.asyncio import serve
from hypercorn.config import Config

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", 5000))
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"

if DEBUG:
    utils.logger.info("Debug mode enabled")
    for i in range(5):
        utils.create_mock_printer(i)

    utils.logger.info(f"Mock list_ports: {utils.NAMES_TO_PORTS()}")

def main():
    config = Config()
    config.bind = f"{HOST}:{PORT}"
    config.use_reloader = DEBUG

    utils.logger.info(f"Starting server on {HOST}:{PORT}")
    utils.logger.info("Press Ctrl+C to quit.")

    asyncio.run(serve(app, config))

if __name__ == "__main__":
    main()