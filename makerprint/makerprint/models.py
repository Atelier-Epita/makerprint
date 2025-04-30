import pydantic

class PrinterStatus(pydantic.BaseModel):
    connected: bool
    port: str
    baud: int
    printing: bool
    paused: bool
    progress: int
    # optional
    bed_temp: int | None = None
    bed_temp_target: int | None = None
    extruder_temp: int | None = None
    extruder_temp_target: int | None = None