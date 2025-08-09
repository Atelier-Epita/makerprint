import pydantic
from typing import Optional

NUMBER = Optional[float | int]


class NozzleTemp(pydantic.BaseModel):
    current: NUMBER = 0
    target: NUMBER = 0

class BedTemp(pydantic.BaseModel):
    current: NUMBER = 0
    target: NUMBER = 0


class PrinterStatus(pydantic.BaseModel):
    status: str = "disconnected"  # idle, printing, paused, disconnected
    port: Optional[str] = None # might not be needed in the end...
    name: str
    display_name: Optional[str] = None
    baud: Optional[int] = None
    preferred_baud: Optional[int] = None
    progress: NUMBER = 0
    timeElapsed: NUMBER = 0  # in seconds
    timeRemaining: NUMBER = 0 # in seconds
    currentQueueItem: Optional[str] = None  # Queue item ID currently being printed
    currentQueueItemName: Optional[str] = None  # Queue item file name currently being printed
    bedClear: bool = False
    bedTemp: Optional[BedTemp] = BedTemp(current=0, target=0)
    nozzleTemp: Optional[NozzleTemp] = NozzleTemp(current=0, target=0)

class File(pydantic.BaseModel):
    name: str
    path: str  # Full path from root
    type: str = "file"  # "file" or "folder" 
    size: Optional[int] = None  # File size in bytes (None for folders)
    modified: Optional[str] = None  # ISO datetime string
    tags: list[str] = []  # printer type, filament type, order#, etc.
    
class FileNode(pydantic.BaseModel):
    """Represents a file/folder in the hierarchical structure"""
    name: str
    path: str
    type: str = "file"  # "file" or "folder"
    size: Optional[int] = None
    modified: Optional[str] = None
    children: Optional[list['FileNode']] = None  # Only for folders
    tags: list[str] = []

class QueueItem(pydantic.BaseModel):
    """Represents an item in the print queue"""
    id: str  # Unique identifier for this queue item
    file_path: str
    file_name: str
    added_at: str  # ISO datetime string
    tags: list[str] = []  # tags for filtering
    status: str = "todo"  # todo, printing, finished, success, failed
    printer_name: Optional[str] = None  # Which printer is handling this item
    started_at: Optional[str] = None  # When printing started
    finished_at: Optional[str] = None  # When printing finished
    error_message: Optional[str] = None  # Error message if failed

    def __init__(self, **data):
        super().__init__(**data)
        if not self.tags:
            self.tags.append("any")

# Update forward references
FileNode.model_rebuild() 
