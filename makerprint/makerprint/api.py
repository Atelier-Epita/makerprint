import os
import fastapi
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException, File as FastAPIFile, UploadFile, Form, Body
from typing import List, Optional

from . import utils, models
from .utils import logger
from .printer_manager import printer_manager
from .file_manager import file_manager, queue_manager

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


@app.get("/files/tree/", response_model=models.FileNode)
async def get_file_tree():
    """Get the complete file tree structure"""
    return file_manager.get_file_tree()


@app.get("/files/list/", response_model=List[models.File])
async def get_files_flat():
    """Get a flat list of all .gcode files"""
    return file_manager.get_files_flat()


@app.post("/files/upload/")
async def upload_files(
    files: List[UploadFile] = FastAPIFile(...),
    folder_path: str = Form("")
):
    """Upload one or more files to the specified folder"""
    results = []
    
    for file in files:
        if not file.filename.endswith(".gcode"):
            results.append({
                "filename": file.filename,
                "success": False,
                "error": "File must be a .gcode file"
            })
            continue
        
        try:
            content = await file.read()
            success = file_manager.save_uploaded_file(content, file.filename, folder_path)
            results.append({
                "filename": file.filename,
                "success": success,
                "error": None if success else "Failed to save file"
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })
    
    return {"results": results}


@app.post("/files/folder/")
async def create_folder(folder_path: str = Body(..., embed=True)):
    """Create a new folder"""
    success = file_manager.create_folder(folder_path)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to create folder")
    return {"success": True}


@app.delete("/files/{file_path:path}")
async def delete_file_or_folder(file_path: str):
    """Delete a file or folder"""
    success = file_manager.delete_item(file_path)
    if not success:
        raise HTTPException(status_code=404, detail="File or folder not found")
    return {"success": True}


@app.put("/files/{file_path:path}/rename/")
async def rename_file_or_folder(file_path: str, new_name: str = Body(..., embed=True)):
    """Rename a file or folder"""
    success = file_manager.rename_item(file_path, new_name)
    if not success:
        raise HTTPException(status_code=404, detail="File or folder not found")
    return {"success": True}


# ========== PRINT QUEUE ENDPOINTS ==========

@app.get("/printers/{printer_name}/queue/", response_model=List[models.QueueItem])
async def get_printer_queue(printer_name: str):
    """Get the print queue for a specific printer"""
    return queue_manager.get_queue(printer_name)


@app.post("/printers/{printer_name}/queue/")
async def add_to_queue(
    printer_name: str, 
    file_path: str = Body(..., embed=True)
):
    """Add a file to the printer's queue"""
    if not file_manager.file_exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    file_name = os.path.basename(file_path)
    queue_item_id = queue_manager.add_to_queue(printer_name, file_path, file_name)
    
    return {
        "success": True,
        "queue_item_id": queue_item_id
    }


@app.delete("/printers/{printer_name}/queue/{queue_item_id}")
async def remove_from_queue(printer_name: str, queue_item_id: str):
    """Remove an item from the printer's queue"""
    success = queue_manager.remove_from_queue(printer_name, queue_item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Queue item not found")
    return {"success": True}


@app.put("/printers/{printer_name}/queue/reorder/")
async def reorder_queue(
    printer_name: str,
    item_ids: List[str] = Body(..., embed=True)
):
    """Reorder items in the printer's queue"""
    success = queue_manager.reorder_queue(printer_name, item_ids)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to reorder queue")
    return {"success": True}


@app.delete("/printers/{printer_name}/queue/")
async def clear_queue(printer_name: str):
    """Clear all items from the printer's queue"""
    queue_manager.clear_queue(printer_name)
    return {"success": True}


# ========== LEGACY FILE ENDPOINTS (for backward compatibility) ==========

@app.get("/file/list/", response_model=list[str])
async def list_files():
    """legacy"""
    files = file_manager.get_files_flat()
    return [file.name for file in files]


@app.post("/file/upload/", response_model=dict[str, bool])
async def upload_file(file: UploadFile = FastAPIFile(...)):
    """legacy"""
    if not file.filename.endswith(".gcode"):
        raise HTTPException(status_code=400, detail="File must be a .gcode file")

    folder = utils.GCODEFOLDER
    if not os.path.exists(folder):
        os.mkdir(folder)

    with open(os.path.join(folder, file.filename), "wb") as f:
        f.write(file.file.read())

    return {"success": True}
