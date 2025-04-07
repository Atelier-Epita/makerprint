import os
import fastapi
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from fastapi import UploadFile, Form, File, Body

import logging
import asyncio

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

# logs in fastapi
@app.middleware("http")
async def log_requests(request: fastapi.Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}, {response}")
    return response


@app.get("/")
async def index():
    return {"status": "ok"}


@app.get("/printer/list/", response_model=list[str])
async def list_printers():
    logger.info("Listing printers")
    return utils.list_ports()


@app.post("/printer/connect/", response_model=dict[str, bool])
async def connect_printer(port: str, baudrate: int = None):
    if port in connected_printers:
        logger.info(f"Printer on {port} already connected")
        return {"success": True}

    try:
        p = printcore(port, baud=baudrate or 115200)
        logger.info(f"Connecting to printer on {port}")

        while not p.online:
            logger.info("Waiting for printer to connect...")
            await asyncio.sleep(0.1)

        connected_printers[port] = p
    except ValueError as e:
        logger.error(f"Failed to connect to printer: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    logger.info(f"Connected to printer on {port}")
    return {"success": True}

@app.post("/printer/disconnect/", response_model=dict[str, bool])
async def disconnect_printer(port: str):
    if port not in connected_printers:
        return {"success": True}

    printer = connected_printers[port]
    printer.disconnect()
    del connected_printers[port]

    return {"success": True}


@app.post("/printer/command/", response_model=dict[str, bool])
async def printer_command(data: dict = Body(...)):
    port = data.get("port")
    command = data.get("command")

    if port not in connected_printers:
        raise HTTPException(status_code=400, detail="Printer not connected")
    if not command:
        raise HTTPException(status_code=400, detail="Command cannot be empty")

    printer = connected_printers[port]
    printer.send_now(command)
    return {"success": True}


@app.get("/file/list/", response_model=list[str])
async def list_files():
    folder = utils.GCODEFOLDER
    if not os.path.exists(folder):
        os.mkdir(folder)

    # list all files ending with .gcode
    return [f for f in os.listdir(folder) if f.endswith(".gcode")]


@app.post("/file/upload/", response_model=dict[str, bool])
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".gcode"):
        raise HTTPException(status_code=400, detail="File must be a .gcode file")

    folder = utils.GCODEFOLDER
    if not os.path.exists(folder):
        os.mkdir(folder)

    with open(os.path.join(folder, file.filename), "wb") as f:
        f.write(file.file.read())

    return {"success": True}


@app.post("/printer/start/")
async def printer_start(data: dict = Body(...)):
    port = data.get("port")
    filename = data.get("filename")

    folder = utils.GCODEFOLDER
    filepath = os.path.join(folder, filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=400, detail="File doesn't exists")

    if port not in connected_printers:
        await connect_printer(port)

    gcode = [i.strip() for i in open(filepath).readlines() if i.strip()]
    gcode = gcoder.LightGCode(gcode)

    printer = connected_printers[port]
    printer.startprint(gcode)
    return {"success": True}
