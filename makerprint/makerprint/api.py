import os
import fastapi
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException, File as FastAPIFile, UploadFile, Form, Body, Query
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
    response = await printer_manager.connect_printer(name, baud)
    
    if not response or not response.success:
        error_msg = response.error if response else "Failed to communicate with printer worker"
        raise HTTPException(status_code=400, detail=error_msg)
    
    return models.PrinterStatus(**response.data)


@app.post("/printers/{name}/disconnect/", response_model=models.PrinterStatus)
async def disconnect_printer(name: str):
    response = await printer_manager.disconnect_printer(name)
    
    if not response or not response.success:
        logger.warning(f"Failed to disconnect printer {name}: {response.error if response else 'No response'}")
    
    status_dict = printer_manager.get_printer_status(name)
    return models.PrinterStatus(**status_dict)


@app.post("/printers/{name}/command/", response_model=models.PrinterStatus)
async def printer_command(name: str, data: dict = Body(...)):
    command = data.get("command", "")
    if not command:
        raise HTTPException(status_code=400, detail="Command cannot be empty")

    response = await printer_manager.send_printer_command(name, command)
    
    if not response or not response.success:
        error_msg = response.error if response else "Failed to communicate with printer worker"
        raise HTTPException(status_code=400, detail=error_msg)
    
    return models.PrinterStatus(**response.data)


@app.post("/printers/{name}/start/", response_model=models.PrinterStatus)
async def printer_start(name: str, data: dict = Body(...)):
    """Start printing from queue item"""
    queue_item_id = data.get("queue_item_id")
    
    if not queue_item_id:
        raise HTTPException(status_code=400, detail="queue_item_id is required")

    response = await printer_manager.start_print_from_queue(name, queue_item_id)
    
    if not response or not response.success:
        error_msg = response.error if response else "Failed to communicate with printer worker"
        raise HTTPException(status_code=400, detail=error_msg)
    
    return models.PrinterStatus(**response.data)


@app.post("/printers/{name}/pause/", response_model=models.PrinterStatus)
async def printer_pause(name: str):
    response = await printer_manager.pause_print(name)
    
    if not response or not response.success:
        error_msg = response.error if response else "Failed to communicate with printer worker"
        raise HTTPException(status_code=400, detail=error_msg)
    
    return models.PrinterStatus(**response.data)


@app.post("/printers/{name}/resume/", response_model=models.PrinterStatus)
async def printer_resume(name: str):
    response = await printer_manager.resume_print(name)
    
    if not response or not response.success:
        error_msg = response.error if response else "Failed to communicate with printer worker"
        raise HTTPException(status_code=400, detail=error_msg)
    
    return models.PrinterStatus(**response.data)


@app.post("/printers/{name}/stop/", response_model=models.PrinterStatus)
async def printer_stop(name: str):
    response = await printer_manager.stop_print(name)
    
    if not response or not response.success:
        error_msg = response.error if response else "Failed to communicate with printer worker"
        raise HTTPException(status_code=400, detail=error_msg)
    
    return models.PrinterStatus(**response.data)


@app.post("/printers/{name}/clear_bed/", response_model=models.PrinterStatus)
async def printer_clear_bed(name: str):
    response = await printer_manager.clear_bed(name)
    
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


@app.put("/files/{file_path:path}/move/")
async def move_file_or_folder(file_path: str, new_folder_path: str = Body(..., embed=True)):
    """Move a file or folder to a new location"""
    success = file_manager.move_item(file_path, new_folder_path)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to move file or folder")
    return {"success": True}


# queue endpoints

@app.get("/queue/", response_model=List[models.QueueItem])
async def get_queue(tags: str = Query(None)):
    """Get the print queue, optionally filtered by tags"""
    tag_filter = tags.split(',') if tags else None
    return queue_manager.get_queue(tag_filter)

@app.get("/queue/tags/", response_model=List[str])
async def get_all_queue_tags():
    """Get all available tags in the queue"""
    return queue_manager.get_all_tags()

@app.post("/queue/")
async def add_to_queue(
    file_path: str = Body(..., embed=True),
    tags: List[str] = Body(default=[], embed=True)
):
    """Add a file to the queue"""
    if not file_manager.file_exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    file_name = os.path.basename(file_path)
    folder = os.path.dirname(file_path)

    # cleanup tags and add the last folder as a tag
    # probably will be a bit different in the future ?
    # with the choice of tags for users and so on ?
    tags = [tag.strip() for tag in tags if tag.strip()]
    if folder and folder not in tags:
        tags.append(folder)

    queue_item_id = queue_manager.add_to_queue(file_path, file_name, tags)
    
    return {
        "success": True,
        "queue_item_id": queue_item_id
    }

@app.delete("/queue/{queue_item_id}")
async def remove_from_queue(queue_item_id: str):
    """Remove an item from the queue"""
    success = queue_manager.remove_from_queue(queue_item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Queue item not found")
    return {"success": True}

@app.put("/queue/reorder/")
async def reorder_queue(
    item_ids: List[str] = Body(..., embed=True)
):
    """Reorder items in the queue"""
    success = queue_manager.reorder_queue(item_ids)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to reorder queue")
    return {"success": True}

@app.delete("/queue/")
async def clear_queue(tags: str = Query(None)):
    """Clear the queue, optionally filtered by tags"""
    tag_filter = tags.split(',') if tags else None
    queue_manager.clear_queue(tag_filter)
    return {"success": True}


@app.post("/queue/{queue_item_id}/retry/")
async def retry_queue_item(queue_item_id: str):
    """Reset a queue item back to 'todo' status for retry"""
    success = queue_manager.retry_queue_item(queue_item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Queue item not found")
    return {"success": True}


@app.post("/queue/{queue_item_id}/mark_failed/")
async def mark_queue_item_failed(queue_item_id: str, data: dict = Body(default={})):
    """Mark a queue item as failed"""
    error_message = data.get("error_message", "Print failed")
    success = queue_manager.mark_print_failed(queue_item_id, error_message)
    if not success:
        raise HTTPException(status_code=404, detail="Queue item not found")
    return {"success": True}


@app.post("/queue/{queue_item_id}/mark_successful/")
async def mark_queue_item_successful(queue_item_id: str):
    """Mark a queue item as successful and remove it from the queue"""
    # First mark as finished if not already
    queue_item = queue_manager.get_queue_item_by_id(queue_item_id)
    if not queue_item:
        raise HTTPException(status_code=404, detail="Queue item not found")

    queue_manager.mark_print_successful(queue_item_id)
    return {"success": True}


@app.get("/queue/{queue_item_id}/", response_model=models.QueueItem)
async def get_queue_item(queue_item_id: str):
    """Get details of a specific queue item"""
    queue_item = queue_manager.get_queue_item_by_id(queue_item_id)
    if not queue_item:
        raise HTTPException(status_code=404, detail="Queue item not found")
    return queue_item
