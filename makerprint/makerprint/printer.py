import os
import threading
import time
import asyncio
from datetime import datetime

from printrun.printcore import printcore
from printrun import gcoder
from fastapi import HTTPException

from . import utils, models
from .utils import logger
from .file_manager import queue_manager

class Printer(printcore):
    def __init__(self, port, baud=None, printer_name=None, display_name=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.tempcb = self._tempcb
        self.startcb = self._startcb
        self.endcb = self._endcb

        # status stuff
        self.port = port
        self.baud = baud
        self.extruder_temp = 0 
        self.extruder_temp_target = 0 
        self.bed_temp = 0 
        self.bed_temp_target = 0 

        self.name = printer_name if printer_name else self.port
        self.display_name = display_name
        self.current_queue_item_id = None  # ID of the queue item being printed
        self.current_queue_item_name = None  # Name of the queue item being printed
        self.start_time = time.time() # meh just want to have a default value
        self.total_paused_duration = 0
        self.pause_start_time = None
        self.bed_clear = True

        self.printing = False
        self.paused = False

    def is_printing(self):
        return self.printing or self.paused

    def prepare_gcode_from_queue_item(self, queue_item_id, queue_manager):
        """Prepare gcode from a queue item"""
        from .file_manager import queue_manager as default_queue_manager
        qm = queue_manager or default_queue_manager
        
        queue_item = qm.get_queue_item_by_id(queue_item_id)
        if not queue_item:
            raise HTTPException(
                status_code=404,
                detail=f"Queue item {queue_item_id} not found",
            )
        
        if queue_item.status != "todo":
            raise HTTPException(
                status_code=400,
                detail=f"Queue item {queue_item_id} is not in 'todo' status (current: {queue_item.status})",
            )

        folder = utils.GCODEFOLDER
        filepath = os.path.join(folder, queue_item.file_path)
        if not os.path.exists(filepath):
            raise HTTPException(
                status_code=404,
                detail=f"File {queue_item.file_path} not found in {folder}",
            )

        self.current_queue_item_id = queue_item_id
        self.current_queue_item_name = queue_item.file_name
        
        # Mark the item as being printed
        qm.mark_print_started(queue_item_id, self.name)
        
        gcode = [i.strip() for i in open(filepath).readlines() if i.strip()]
        gcode = gcoder.LightGCode(gcode)
        return gcode

    def _startcb(self, resuming=False):
        if not resuming:
            self.start_time = time.time()
            self.total_paused_duration = 0
            self.pause_start_time = None
            self.bed_clear = False
        else:
            if self.pause_start_time is not None:
                self.total_paused_duration += time.time() - self.pause_start_time
                self.pause_start_time = None

    def _endcb(self):
        if not self.paused:
            queue_manager.update_queue_item_status(
                self.current_queue_item_id, 
                status="finished",
                finished_at=datetime.now().isoformat()
            )
            
            if self.start_time is not None:
                elapsed = self._get_actual_elapsed_time()
                time_string = time.strftime("%H:%M:%S", time.gmtime(elapsed))
                logger.info(f"Print finished on {self.name} in {time_string}")
            else:
                logger.info(f"Print finished on {self.name}")

            self._reset_print_timing()
        else:
            self.pause_start_time = time.time()

    def _reset_print_timing(self):
        self.start_time = None
        self.current_queue_item_id = None
        self.current_queue_item_name = None
        self.total_paused_duration = 0
        self.pause_start_time = None

    def _get_actual_elapsed_time(self):
        if self.start_time is None:
            return 0
        
        current_time = time.time()
        raw_elapsed = current_time - self.start_time
        
        current_pause_duration = 0
        if self.paused and self.pause_start_time is not None:
            current_pause_duration = current_time - self.pause_start_time
        
        return raw_elapsed - self.total_paused_duration - current_pause_duration

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
                elapsed_time = self._get_actual_elapsed_time()
                total_time = elapsed_time / max(fraction, 0.01)
                time_remaining = (total_time - elapsed_time)

        status = 'printing' if self.printing else 'paused' if self.paused else 'idle'

        return models.PrinterStatus(
            status=status,
            port=self.port,
            name=self.name,
            displayName=self.display_name,
            baud=self.baud,
            progress=percentage,
            timeElapsed=elapsed_time,
            timeRemaining=time_remaining,
            currentQueueItem=self.current_queue_item_id,
            currentQueueItemName=self.current_queue_item_name,
            bedClear=self.bed_clear,
            bedTemp=models.BedTemp(
                current=self.bed_temp, target=self.bed_temp_target
            ),
            nozzleTemp=models.NozzleTemp(
                current=self.extruder_temp, target=self.extruder_temp_target
            ),
        )

    def request_temperature_update(self):
        """Request a temperature update from the printer"""
        if self.online:
            try:
                self.send_now("M105")
            except Exception as e:
                logger.error(f"Failed to request temperature update for {self.name}: {e}")
                raise

    def disconnect(self):
        return super().disconnect()
    
    def clear_bed(self):
        """Set the bed to clear. This is used to indicate that the bed is clear for a new print."""
        if not self.online:
            raise HTTPException(
                status_code=400,
                detail=f"Printer {self.name} is not connected",
            )
        self.bed_clear = True
        logger.info(f"Bed cleared for printer {self.name} on {self.port}")

    def mark_current_print_failed(self, error_message: str = None):
        """Mark the current print as failed in the queue"""
        if self.current_queue_item_id:
            from .file_manager import queue_manager
            queue_manager.mark_print_failed(self.current_queue_item_id, error_message)
            logger.info(f"Marked queue item {self.current_queue_item_id} as failed on printer {self.name}")
        else:
            logger.warning(f"No queue item to mark as failed for printer {self.name}")

    def mark_current_print_finished(self):
        """Mark the current print as finished in the queue"""
        if self.current_queue_item_id:
            from .file_manager import queue_manager
            queue_manager.mark_print_finished(self.current_queue_item_id)
            logger.info(f"Marked queue item {self.current_queue_item_id} as finished on printer {self.name}")
        else:
            logger.warning(f"No queue item to mark as finished for printer {self.name}")

    async def connect(self, port=None, baud=None, dtr=None):
        """Connect to the printer with the specified port and baud rate. waits until the printer is online."""
        if self.online:
            logger.warning(f"Printer {self.name} is already connected on {self.port}")
            return

        self.port = port or self.port
        self.baud = baud or self.baud

        if not self.baud:
            detected = await utils.auto_detect_baud(port=self.port)
            if not detected:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to auto-detect baud rate for {self.port}",
                )

            self.baud = detected

        super().connect(self.port, self.baud, dtr)
        start = asyncio.get_event_loop().time()

        while not self.online and (asyncio.get_event_loop().time() - start) < 10:
            await asyncio.sleep(0.1)

        if not self.online:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to connect to printer on {self.port} at {self.baud} baud",
            )

        logger.debug(f"Connected to printer {self.name} on {self.port} at {self.baud} baud")