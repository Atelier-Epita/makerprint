import os
import threading
import time

from printrun.printcore import printcore
from printrun import gcoder
from fastapi import HTTPException

from . import utils, models
from .utils import logger


class Printer(printcore):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.tempcb = self._tempcb
        self.startcb = self._startcb
        self.endcb = self._endcb

        # status stuff
        self.extruder_temp = 0 
        self.extruder_temp_target = 0 
        self.bed_temp = 0 
        self.bed_temp_target = 0 

        self.name = utils.PORTS_TO_NAMES().get(self.port, self.port)
        self.current_file = None
        self.start_time = None

        self.statuscheck = True
        self.status_thread = threading.Thread(
            target=self.status_thread,
            name=f"PrinterStatusThread-{self.port}",
            args=(),
            daemon=True,
        )
        self.status_thread.start()

    def prepare_gcode(self, filename):
        folder = utils.GCODEFOLDER
        filepath = os.path.join(folder, filename)
        if not os.path.exists(filepath):
            raise HTTPException(
                status_code=404,
                detail=f"File {filename} not found in {folder}",
            )

        self.current_file = filename
        gcode = [i.strip() for i in open(filepath).readlines() if i.strip()]
        gcode = gcoder.LightGCode(gcode)
        return gcode
    
    def _startcb(self, resuming = False):
        if not resuming:
            self.start_time = time.time()

    def _endcb(self):
        time_string = time.strftime("%H:%M:%S", time.gmtime(time.time() - self.start_time))
        logger.info(f"Print finished on {self.name} in {time_string}")
        self.start_time = None

    def _tempcb(self, tempstr):
        temps = utils.parse_temperature_report(tempstr)
        if "T0" in temps and temps["T0"][0]:
            hotend_temp = float(temps["T0"][0])
        elif "T" in temps and temps["T"][0]:
            hotend_temp = float(temps["T"][0])
        else:
            hotend_temp = None
        if "T0" in temps and temps["T0"][1]:
            hotend_setpoint = float(temps["T0"][1])
        elif "T" in temps and temps["T"][1]:
            hotend_setpoint = float(temps["T"][1])
        else:
            hotend_setpoint = None
        if hotend_temp is not None:
            self.extruder_temp = hotend_temp
            if hotend_setpoint is not None:
                self.extruder_temp_target = hotend_setpoint
        bed_temp = float(temps["B"][0]) if "B" in temps and temps["B"][0] else None
        if bed_temp is not None:
            self.bed_temp = bed_temp
            setpoint = temps["B"][1]
            if setpoint:
                self.bed_temp_target = float(setpoint)

    def get_status(self):
        percentage = 0
        time_remaining = None
        elapsed_time = None
        
        if self.mainqueue:
            fraction = self.queueindex / len(self.mainqueue)
            percentage = round(fraction * 100, 1)

            if self.start_time:
                elapsed_time = time.time() - self.start_time
                total_time = elapsed_time / max(fraction, 0.01)
                time_remaining = (total_time - elapsed_time)

        status = 'printing' if self.printing else 'paused' if self.paused else 'idle'

        return models.PrinterStatus(
            status=status,
            port=self.port,
            name=self.name,
            baud=self.baud,
            paused=self.paused,
            progress=percentage,
            timeElapsed=elapsed_time,
            timeRemaining=time_remaining,
            currentFile=self.current_file,
            bedTemp=models.BedTemp(
                current=self.bed_temp, target=self.bed_temp_target
            ),
            nozzleTemp=models.NozzleTemp(
                current=self.extruder_temp, target=self.extruder_temp_target
            ),
        )

    def _status_thread(self):
        while self.online:
            self.send_now("M105")
            threading.Event().wait(2)

    def status_thread(self):
        while self.statuscheck:
            self._status_thread()
            threading.Event().wait(1)

    def disconnect(self):
        self.statuscheck = False
        if self.status_thread.is_alive():
            self.status_thread.join(timeout=1)
        return super().disconnect()