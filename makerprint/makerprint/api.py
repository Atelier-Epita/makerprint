import os
import fastapi
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from fastapi import UploadFile, Form, File, Body

import logging
import asyncio

from printrun.printcore import printcore
from printrun import gcoder

from . import utils, models
from .utils import logger

connected_printers = {}  # ugly

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


@app.get("/printers/", response_model=list[str])
async def list_printers_name():
    return utils.NAMES_TO_PORTS().keys()


@app.get("/printers/{name}/", response_model=models.PrinterStatus)
async def printer_status(name: str):
    if name in connected_printers:
        printer = connected_printers[name]
        return utils.printer_status(printer)
    else:
        raise HTTPException(status_code=404, detail="Printer not connected")


@app.post("/printers/{name}/connect/", response_model=models.PrinterStatus)
async def connect_printer(
    name: str,
    baud: int = None,
):
    if name in connected_printers:
        logger.info(f"Printer {name} already connected")
        return utils.printer_status(connected_printers[name])

    port = utils.NAMES_TO_PORTS().get(name)
    if not port:
        raise HTTPException(status_code=404, detail="Printer not found")

    try:
        timeout = 5
        start_time = asyncio.get_event_loop().time()

        for baudrate in utils.BAUDRATES:
            p = printcore(port, baud=baudrate)
            logger.info(
                f"Trying to connect to printer {name} on {port} with baudrate {baudrate}"
            )

            while not p.online:
                if (asyncio.get_event_loop().time() - start_time) > timeout:
                    continue

            # successfully connected
            if p.online:
                connected_printers[name] = p
                logger.info(f"Connected to printer {name} on {port}")
                return utils.printer_status(connected_printers[name])

        else:
            raise ValueError("Failed to connect to printer with any baudrate")

    except ValueError as e:
        logger.error(f"Failed to connect to printer {name} on {port}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/printers/{name}/disconnect/", response_model=dict[str, bool])
async def disconnect_printer(name: str):
    if name not in connected_printers:
        return {"success": True}

    printer: printcore = connected_printers[name]
    printer.disconnect()
    del connected_printers[name]

    return {"success": True}


@app.post("/printers/{name}/command/", response_model=models.PrinterStatus)
async def printer_command(name: str, data: dict = Body(...)):
    command = data.get("command", "")
    if not command:
        raise HTTPException(status_code=400, detail="Command cannot be empty")

    if name not in connected_printers:
        raise HTTPException(status_code=400, detail="Printer not connected")
    if not command:
        raise HTTPException(status_code=400, detail="Command cannot be empty")

    printer: printcore = connected_printers[name]
    printer.send_now(command)
    return utils.printer_status(printer)


@app.post("/printers/{name}/start/", response_model=models.PrinterStatus)
async def printer_start(name: str, data: dict = Body(...)):
    filename = data.get("filename")

    folder = utils.GCODEFOLDER
    filepath = os.path.join(folder, filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=400, detail="File doesn't exists")

    if name not in connected_printers:
        await connect_printer(name)

    gcode = [i.strip() for i in open(filepath).readlines() if i.strip()]
    gcode = gcoder.LightGCode(gcode)

    printer: printcore = connected_printers[name]
    printer.startprint(gcode)
    return utils.printer_status(printer)


@app.post("/printers/{name}/pause/", response_model=models.PrinterStatus)
async def printer_pause(name: str):
    if name not in connected_printers:
        raise HTTPException(status_code=400, detail="Printer not connected")

    printer: printcore = connected_printers[name]
    printer.pause()
    return utils.printer_status(printer)


@app.post("/printers/{name}/resume/", response_model=models.PrinterStatus)
async def printer_resume(name: str):
    if name not in connected_printers:
        raise HTTPException(status_code=400, detail="Printer not connected")

    printer: printcore = connected_printers[name]
    printer.resume()
    return utils.printer_status(printer)


@app.post("/printers/{name}/stop/", response_model=models.PrinterStatus)
async def printer_stop(name: str):
    if name not in connected_printers:
        raise HTTPException(status_code=400, detail="Printer not connected")

    printer: printcore = connected_printers[name]
    printer.cancelprint()
    return utils.printer_status(printer)


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
