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
    port: str
    name: str
    baud: Optional[int] = None
    progress: NUMBER = 0
    timeElapsed: NUMBER = 0  # in seconds
    timeRemaining: NUMBER = 0 # in seconds
    currentFile: Optional[str] = None
    bedClear: bool = False
    bedTemp: Optional[BedTemp] = BedTemp(current=0, target=0)
    nozzleTemp: Optional[NozzleTemp] = NozzleTemp(current=0, target=0)

class File(pydantic.BaseModel):
    name: str
    tags: list[str] = [] # printer type, filament type, ? order# ? 
