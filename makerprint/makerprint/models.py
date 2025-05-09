import pydantic

class PrinterStatus(pydantic.BaseModel):
    connected: bool
    port: str
    name: str
    baud: int
    printing: bool
    paused: bool
    progress: int | float
    # optional
    bed_temp: float | None = None
    bed_temp_target: float | None = None
    extruder_temp: float | None = None
    extruder_temp_target: float | None = None