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
consoles = {}


def get_serial(port):
    if port not in consoles:
        #ser = printer_serial.PrinterSerial(port)
        ser = None
        consoles[port] = {
            "ser": ser,
            "input": "",
            "output": "",
        }
    return consoles[port]["ser"]


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
app.config["SECRET_KEY"] = os.urandom(32)
app.config["PERMANENT_SESSION_LIFETIME"] = 3600 * 24 * 7  # 1 week


@app.route("/")
def index():
    """
    /

    The main page of the web interface.
    """

    global list_ports
    global list_files

    # create a button for each port that redirects to /printer/<port_index>
    printers = [
        PRINTER_BUTTON.format(i=i, port=port) for i, port in enumerate(list_ports)
    ]
    printers = "\n".join(printers)
    printers = Markup(printers)

    files = []
    # create a button for each file that redirects to /file/<file_name>
    for filename in list_files:
        files.append(FILE_BUTTON.format(name=filename))

    files = "\n".join(files)
    files = Markup(files)

    port = flask.session.get("port", None)

    return flask.render_template(
        "index.html",
        printers=printers,
        files=files,
        printer_count=len(list_ports),
        file_count=len(list_files),
        printer_port=port,
        console_input=consoles.get(port, {}).get("input", ""),
        console_output=consoles.get(port, {}).get("output", ""),
    )


@app.route("/printer/refresh")
def printer_refresh():
    """
    /printer/refresh
    """
    update_list_ports()
    update_list_files()
    return flask.redirect("/")


@app.route("/printer/clear")
def printer_clear():
    """
    /printer/clear
    """
    global consoles
    port = flask.session.get("port", None)
    if port is not None:
        if port in consoles:
            consoles[port]["input"] = ""
            consoles[port]["output"] = ""
    return flask.redirect("/")	

@app.route("/printer/<string:port>")
def printer(port):
    """
    /printer/<port>

    The page for a specific printer.
    """

    if port not in list_ports:
        return flask.redirect("/")

    flask.session["port"] = port
    ser = get_serial(port)
    return flask.redirect("/")


@app.route("/file/<string:file_name>")
def file_content(file_name):
    """
    /file/<file_name>

    The page for a specific file.
    maybe a preview of the gcode file + some stats ?
    """
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


@app.route("/printer/command", methods=["POST"])
def printer_command():
    """
    /printer/command

    Send a command to the printer.
    sent as a submit form with the following parameters:
    - command: the command to send
    """
    command = flask.request.form.get("command")
    port = flask.session.get("port", None)
    if port is not None:
        ser = get_serial(port)
        #ser.send(command)
        line = Markup(CONSOLE_TEXT.format(line=command))
        consoles[port]["input"] += line 
    else:
        flask.flash("Please select a printer first")

    return flask.redirect("/")
