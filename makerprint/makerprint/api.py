import os
import fastapi
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from fastapi import UploadFile, Form, File, Body

from . import utils, models
from .utils import logger
from .printer_manager import printer_manager

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


# @app.middleware("http")
# async def log_requests(request: fastapi.Request, call_next):
#     logger.info(f"Request: {request.method} {request.url}")
#     response = await call_next(request)
#     logger.info(f"Response: {response.status_code}, {response}")
#     return response


@app.get("/")
async def index():
    return {"status": "ok"}


# @app.get("/printers/", response_model=list[models.PrinterStatus])
@app.get("/printers/", response_model=dict[str, models.PrinterStatus])
async def list_printers():
    printers = {}
    statuses = printer_manager.get_all_printer_statuses()
    
    for name, status_dict in statuses.items():
        printers[name] = models.PrinterStatus(**status_dict)
    
    return printers


@app.get("/printers/{name}/", response_model=models.PrinterStatus)
async def printer_status(name: str):
    status_dict = printer_manager.get_printer_status(name)
    return models.PrinterStatus(**status_dict)


@app.post("/printers/{name}/connect/", response_model=models.PrinterStatus)
async def connect_printer(
    name: str,
    baud: int = None,
):
    response = printer_manager.connect_printer(name, baud)
    
    if not response or not response.success:
        error_msg = response.error if response else "Failed to communicate with printer worker"
        raise HTTPException(status_code=400, detail=error_msg)
    
    return models.PrinterStatus(**response.data)


@app.post("/printers/{name}/disconnect/", response_model=models.PrinterStatus)
async def disconnect_printer(name: str):
    response = printer_manager.disconnect_printer(name)
    
    if not response or not response.success:
        logger.warning(f"Failed to disconnect printer {name}: {response.error if response else 'No response'}")
    
    status_dict = printer_manager.get_printer_status(name)
    return models.PrinterStatus(**status_dict)


@app.post("/printers/{name}/command/", response_model=models.PrinterStatus)
async def printer_command(name: str, data: dict = Body(...)):
    command = data.get("command", "")
    if not command:
        raise HTTPException(status_code=400, detail="Command cannot be empty")

    response = printer_manager.send_printer_command(name, command)
    
    if not response or not response.success:
        error_msg = response.error if response else "Failed to communicate with printer worker"
        raise HTTPException(status_code=400, detail=error_msg)
    
    return models.PrinterStatus(**response.data)


@app.post("/printers/{name}/start/", response_model=models.PrinterStatus)
async def printer_start(name: str, data: dict = Body(...)):
    filename = data.get("filename")
    if not filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty")

    response = printer_manager.start_print(name, filename)
    
    if not response or not response.success:
        error_msg = response.error if response else "Failed to communicate with printer worker"
        raise HTTPException(status_code=400, detail=error_msg)
    
    return models.PrinterStatus(**response.data)


@app.post("/printers/{name}/pause/", response_model=models.PrinterStatus)
async def printer_pause(name: str):
    response = printer_manager.pause_print(name)
    
    if not response or not response.success:
        error_msg = response.error if response else "Failed to communicate with printer worker"
        raise HTTPException(status_code=400, detail=error_msg)
    
    return models.PrinterStatus(**response.data)


@app.post("/printers/{name}/resume/", response_model=models.PrinterStatus)
async def printer_resume(name: str):
    response = printer_manager.resume_print(name)
    
    if not response or not response.success:
        error_msg = response.error if response else "Failed to communicate with printer worker"
        raise HTTPException(status_code=400, detail=error_msg)
    
    return models.PrinterStatus(**response.data)


@app.post("/printers/{name}/stop/", response_model=models.PrinterStatus)
async def printer_stop(name: str):
    response = printer_manager.stop_print(name)
    
    if not response or not response.success:
        error_msg = response.error if response else "Failed to communicate with printer worker"
        raise HTTPException(status_code=400, detail=error_msg)
    
    return models.PrinterStatus(**response.data)


@app.post("/printers/{name}/clear_bed/", response_model=models.PrinterStatus)
async def printer_clear_bed(name: str):
    response = printer_manager.clear_bed(name)
    
    if not response or not response.success:
        error_msg = response.error if response else "Failed to communicate with printer worker"
        raise HTTPException(status_code=400, detail=error_msg)
    
    return models.PrinterStatus(**response.data)


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
