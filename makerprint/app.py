import logging
import os
import sys

import flask
from environs import Env
from markupsafe import Markup

from . import printer_serial
from .commands import *
from .components import *

env = Env()
env.read_env("makerprint.env")

LOGPATH = env("LOGPATH", "makerprint.log")
GCODEFOLDER = env("GCODEFOLDER", "/home/pi/3dprinter/")

# log to file and stdout
logging.basicConfig(
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOGPATH, mode="w"),
    ],
    level=logging.DEBUG,
)

list_ports = printer_serial.list_ports()
list_files = []


def update_list_ports():
    global list_ports
    list_ports = printer_serial.list_ports()


def update_list_files():
    global list_files

    if not os.path.exists(GCODEFOLDER):
        os.mkdir(GCODEFOLDER)

    # list all files ending with .gcode
    list_files = [f for f in os.listdir(GCODEFOLDER) if f.endswith(".gcode")]
    logging.debug(f"Found files: {list_files}")


app = flask.Flask("makerprint")

"""
/

The main page of the web interface.
"""


@app.route("/")
def index():
    global list_ports
    global list_files
    update_list_ports()
    update_list_files()

    # just some dummy data
    list_ports = ["/dev/ttyUSB0", "/dev/ttyUSB1", "/dev/ttyUSB2"]

    # create a button for each port that redirects to /printer/<port_index>
    printers = [
        PRINTER_BUTTON.format(i=i, port=port) for i, port in enumerate(list_ports)
    ]
    printers = "\n".join(printers)
    logging.debug(printers)
    printers = Markup(printers)

    files = []
    # create a button for each file that redirects to /file/<file_name>
    for filename in list_files:
        files.append(FILE_BUTTON.format(name=filename))

    files = "\n".join(files)
    files = Markup(files)

    return flask.render_template(
        "index.html",
        printers=printers,
        files=files,
        printer_count=len(list_ports),
        file_count=len(list_files),
    )


"""
/printer/<port_index>

The page for a specific printer.
"""


@app.route("/printer/<int:port_index>")
def printer(port_index):
    global list_ports
    update_list_ports()

    if port_index >= len(list_ports):
        return flask.redirect("/")

    port = list_ports[port_index]

    # TODO connect serial if not already connected

    # TODO render template and so on
    return flask.jsonify(
        {
            "port": port,
            "status": "connected",
        }
    )


"""
/file/<file_name>

The page for a specific file.
maybe a preview of the gcode file + some stats ?
"""


@app.route("/file/<string:file_name>")
def file_content(file_name):
    global list_files
    update_list_files()

    if file_name not in list_files:
        return flask.redirect("/")

    # TODO render template and so on
    return flask.jsonify(
        {
            "file_name": file_name,
            "status": "ok",
        }
    )


"""
/printer/command

Send a command to the printer.
sent as a submit form with the following parameters:
- command: the command to send
"""

@app.route("/printer/command", methods=["POST"])
def printer_command():
    command = flask.request.form.get("command")
    logging.debug(f"Received command: {command}")

    # TODO send command to printer
    return flask.jsonify(
        {
            "command": command,
            "status": "ok",
        }
    )

# basic operations on the printer
# ser = printer_serial.PrinterSerial()
# ser.send(INIT_SD_CARD)
# ser.send(LIST_SD_CARD)
# print(ser.recv())

# while True:
#     a = input("Enter command: ")
#     ser.send(a)
#     print(ser.recv())
