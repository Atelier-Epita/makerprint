import os
import re
import threading

from printrun.printcore import printcore
from printrun import gcoder

from . import utils, models
from .utils import logger


class Printer(printcore):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.tempcb = self._tempcb

        # status stuff
        self.extruder_temp = None
        self.extruder_temp_target = None
        self.bed_temp = None
        self.bed_temp_target = None

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
            raise FileNotFoundError(f"File {filepath} doesn't exist")

        gcode = [i.strip() for i in open(filepath).readlines() if i.strip()]
        gcode = gcoder.LightGCode(gcode)
        return gcode

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
        progress = 0
        if self.mainqueue:
            progress = int(float(self.queueindex) / len(self.mainqueue) * 100)

        return models.PrinterStatus(
            connected=self.online,
            port=self.port,
            baud=self.baud,
            printing=self.printing,
            paused=self.paused,
            progress=progress,
            bed_temp=self.bed_temp,
            bed_temp_target=self.bed_temp_target,
            extruder_temp=self.extruder_temp,
            extruder_temp_target=self.extruder_temp_target,
        )

    def _status_thread(self):
        while self.online:
            self.send_now("M105")
            threading.Event().wait(5)

    def status_thread(self):
        while self.statuscheck:
            self._status_thread()
            threading.Event().wait(1)

    def disconnect(self):
        self.statuscheck = False
        if self.status_thread.is_alive():
            self.status_thread.join(timeout=1)
        return super().disconnect()