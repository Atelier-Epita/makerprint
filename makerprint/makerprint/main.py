from . import api, utils

import os
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--debug", action="store_true")
args = parser.parse_args()
debug = args.debug

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", 5000))

if debug:
    from mock_serial import MockSerial
    device = MockSerial()
    device.open()

    old_list_ports = utils.list_ports
    utils.list_ports = lambda: old_list_ports() + [device.port]

def main():
    """Main function to run the Flask application."""
    utils.logger.info("Starting Flask application...")
    api.app.run(host=HOST, port=PORT, debug=debug)
