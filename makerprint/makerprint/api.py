import os
import fastapi
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from fastapi import UploadFile, Form, File

import logging

from printrun.printcore import printcore
from printrun import gcoder

from . import utils
from .utils import logger

connected_printers = {} # ugly

app = fastapi.FastAPI(
    title="MakerPrint API",
    description="API for MakerPrint",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def index():
    return {"status": "ok"}


@app.get("/printer/list/", response_model=list[str])
def list_printers():
    logger.info("Listing printers")
    return utils.list_ports()


@app.post("/printer/connect/", response_model=dict[str, bool])
def connect_printer(port: str, baudrate: int = None):
    if port in connected_printers:
        return {"success": True}

    try:
        connected_printers[port] = utils.PrinterSerial(port, baudrate)
    except ValueError as e:
        logger.error(f"Failed to connect to printer: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    return {"success": True}


@app.post("/printer/command/", response_model=dict[str, bool])
def printer_command(port: str, command: str):
    if port not in connected_printers:
        try:
            connected_printers[port] = utils.PrinterSerial(port)
        except ValueError as e:
            logger.error(f"Failed to connect to printer: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    printer = connected_printers[port]
    printer.send(command)
    return {"success": True}


@app.get("/file/list/", response_model=list[str])
def list_files():
    folder = utils.GCODEFOLDER
    if not os.path.exists(folder):
        os.mkdir(folder)

    # list all files ending with .gcode
    return [f for f in os.listdir(folder) if f.endswith(".gcode")]


@app.post("/file/upload/", response_model=dict[str, bool])
def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".gcode"):
        raise HTTPException(status_code=400, detail="File must be a .gcode file")

    folder = utils.GCODEFOLDER
    if not os.path.exists(folder):
        os.mkdir(folder)

    with open(os.path.join(folder, file.filename), "wb") as f:
        f.write(file.file.read())

    return {"success": True}


@app.post("/printer/start/")
def printer_start(port: str, filename: str):
    folder = utils.GCODEFOLDER
    filepath = os.path.join(folder, filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=400, detail="File doesn't exists")

    if port not in connected_printers:
        try:
            connected_printers[port] = utils.PrinterSerial(port)
        except ValueError as e:
            logger.error(f"Failed to connect to printer: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    printer = connected_printers[port]
    printer.init_sd_card()
    printer.upload_file(filepath, filename)
    printer.select_sd_file(filename)
    printer.start_print()
    return {"success": True}
