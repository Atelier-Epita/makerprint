import logging
import os
import sys

import flask
from flask_cors import CORS
from environs import Env

from . import printer_serial
from .const import *

connected_printers = {}
app = flask.Flask("makerprint")
CORS(app)

@app.route("/printer/list")
def list_printers():
    ports = printer_serial.list_ports()
    return ports


@app.route("/printer/connect", methods=["POST"])
def connect_printer():
    port = flask.request.json["port"]
    baudrate = flask.request.json.get("baudrate", None)

    if port in connected_printers:
        return flask.jsonify({"success": True})

    try:
        connected_printers[port] = printer_serial.PrinterSerial(port, baudrate)
    except ValueError as e:
        flask.abort(400, str(e))

    return flask.jsonify({"success": True})


@app.route("/printer/command", methods=["POST"])
def printer_command():
    port = flask.request.json["port"]
    command = flask.request.json["command"]

    if port not in connected_printers:
        try:
            connected_printers[port] = printer_serial.PrinterSerial(port)
        except ValueError as e:
            flask.abort(400, str(e))

    printer = connected_printers[port]
    printer.send(command)
    return flask.jsonify({"success": True})


@app.route("/file/list")
def list_files():
    folder = app.config["GCODEFOLDER"]
    if not os.path.exists(folder):
        os.mkdir(folder)

    # list all files ending with .gcode
    return [f for f in os.listdir(folder) if f.endswith(".gcode")]


@app.route("/file/upload", methods=["POST"])
def upload_file():
    if "file" not in flask.request.files:
        flask.abort(400, "No file provided")

    file = flask.request.files["file"]
    if file.filename == "":
        flask.abort(400, "No file provided")

    folder = app.config["GCODEFOLDER"]
    if not os.path.exists(folder):
        os.mkdir(folder)

    file.save(os.path.join(folder, file.filename))
    return flask.jsonify({"success": True})


@app.route("/printer/start", methods=["POST"])
def printer_start():
    port = flask.request.json["port"]
    filename = flask.request.json["file"]

    folder = app.config["GCODEFOLDER"]
    filepath = os.path.join(folder, filename)

    if not os.path.exists(filepath):
        flask.abort(400, "File doesn't exists")

    if port not in connected_printers:
        try:
            connected_printers[port] = printer_serial.PrinterSerial(port)
        except ValueError as e:
            flask.abort(400, str(e))

    printer = connected_printers[port]
    printer.init_sd_card()
    printer.upload_file(filepath, filename)
    printer.select_sd_file(filename)
    printer.start_print()
    return flask.jsonify({"success": True})

def run(config_file="makerprint.env", debug=False):
    env = Env()
    env.read_env(config_file, verbose=True)

    GCODEFOLDER = env("GCODEFOLDER", "3dprinter/")
    LOGPATH = env("LOGPATH", "makerprint.log")
    LOGLEVEL = env("LOGLEVEL", "INFO")
    HOST = env("HOST", "127.0.0.1")
    PORT = env.int("PORT", 5000)

    # create gcode folder if it does not exist
    if not os.path.exists(GCODEFOLDER):
        os.mkdir(GCODEFOLDER)

    # log to file and stdout
    logging.basicConfig(
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(LOGPATH, mode="w"),
        ],
        level=LOGLEVEL,
    )

    if debug:
        from mock_serial import MockSerial
        device = MockSerial()
        device.open()

        # wrap list_ports to include mock serial port
        old_list_ports = printer_serial.list_ports
        printer_serial.list_ports = lambda: old_list_ports() + [device.port]

    app.config["GCODEFOLDER"] = GCODEFOLDER
    app.run(host=HOST, port=PORT, debug=debug)
