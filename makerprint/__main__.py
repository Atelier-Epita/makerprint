from . import printer_serial
from .commands import *
import logging
import sys

import flask

# log to file and stdout
logging.basicConfig(
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("makerprint.log", mode="w")
    ],
    level=logging.DEBUG,
)

# TODO make this a proper user interface using flask

app = flask.Flask("makerprint")

@app.route("/")
def index():
    return flask.render_template("index.html")


# basic operations on the printer
ser = printer_serial.PrinterSerial()
ser.send(INIT_SD_CARD)
ser.send(LIST_SD_CARD)
print(ser.recv())

while True:
    a = input("Enter command: ")
    ser.send(a)
    print(ser.recv())
