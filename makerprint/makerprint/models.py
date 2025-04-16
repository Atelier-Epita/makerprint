import pydantic

class PrinterStatus(pydantic.BaseModel):
    connected: bool
    port: str
    baud: int
    printing: bool
    paused: bool
    progress: int