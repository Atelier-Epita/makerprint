"""
Printer Process Manager - Manages multiple printer worker processes
"""
import asyncio
import atexit
import multiprocessing
import os
import threading
import time
from queue import Empty, Queue
from typing import Any, Dict, Optional

from . import models, utils
from .config import printer_config
from .printer_worker import WorkerCommand, WorkerResponse, start_printer_worker


class PrinterManager:
    """Manages multiple printer worker processes"""
    
    def __init__(self):
        self.workers: Dict[str, Dict[str, Any]] = {}
        self.printer_statuses: Dict[str, Dict[str, Any]] = {}
        self.status_queue = multiprocessing.Queue()
        
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.loop_thread: Optional[threading.Thread] = None
        self.running = True
        
        self._start_event_loop()
        atexit.register(self.shutdown)
        
        self.logger = utils.logger.getChild("printer_manager")
    
    def _start_event_loop(self):
        """Start the asyncio event loop in a separate thread"""
        self.loop = asyncio.new_event_loop()
        self.loop_thread = threading.Thread(target=self._run_event_loop, daemon=True)
        self.loop_thread.start()

    def _run_event_loop(self):
        """Run the asyncio event loop"""
        asyncio.set_event_loop(self.loop)
        self.loop.create_task(self._status_monitor_loop_async())
        self.loop.run_forever()

    async def _status_monitor_loop_async(self):
        """Asynchronously monitor status updates from worker processes"""
        if not self.loop:
            self.logger.error("Event loop not initialized")
            return

        while self.running:
            try:
                status_update = await self.loop.run_in_executor(None, self.status_queue.get, True, 1.0)
                if status_update:
                    printer_name, status = status_update
                    self.printer_statuses[printer_name] = status
            except Empty:
                continue
            except Exception as e:
                self.logger.error(f"Error in status monitor loop: {e}")
            
            await asyncio.sleep(0.1)
    
    def _ensure_worker_running(self, printer_name: str) -> bool:
        """Ensure a worker process is running for the given printer"""
        if printer_name in self.workers:
            process = self.workers[printer_name]['process']
            if process.is_alive():
                return True
            else:
                # process died, clean it up
                self.logger.warning(f"Worker process for {printer_name} died, cleaning up")
                self._cleanup_worker(printer_name)
        
        return self._start_worker(printer_name)
    
    def _start_worker(self, printer_name: str) -> bool:
        """Start a worker process for a printer"""
        is_available, printer_port = printer_config.is_printer_available(printer_name)
        if not is_available:
            self.logger.error(f"Printer {printer_name} not found in available printers")
            return False
        
        # get printer config for display name and baud baud
        printer_config_data = printer_config.get_printer_by_name(printer_name)
        display_name = printer_config_data.get('display_name', printer_name) if printer_config_data else printer_name
        preferred_baud = printer_config_data.get('preferred_baud') if printer_config_data else None

        try:
            # create queues
            command_queue = multiprocessing.Queue()
            response_queue = multiprocessing.Queue()
            
            # start worker process
            # TODO: use threads if in dev mode (because of daemon process not being able to spawn children)
            process = multiprocessing.Process(
                target=start_printer_worker,
                args=(printer_name, printer_port, command_queue, response_queue, self.status_queue, preferred_baud),
                name=f"PrinterWorker-{printer_name}"
            )
            process.start()
            
            # store worker info
            self.workers[printer_name] = {
                'process': process,
                'command_queue': command_queue,
                'response_queue': response_queue,
                'port': printer_port
            }
            
            # init status
            self.printer_statuses[printer_name] = {
                "status": "disconnected",
                "name": printer_name,
                "display_name": display_name,
                "baud": 0,
                "progress": 0,
                "timeElapsed": 0,
                "timeRemaining": 0,
                "currentQueueItem": None,
                "currentQueueItemName": None,
                "bedClear": False,
                "bedTemp": {"current": 0, "target": 0},
                "nozzleTemp": {"current": 0, "target": 0},
            }
            
            self.logger.info(f"Started worker for printer {printer_name} on {printer_port}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to start worker for {printer_name}: {e}")
            return False
    
    def _cleanup_worker(self, printer_name: str):
        """Clean up a worker process"""
        if printer_name in self.workers:
            del self.workers[printer_name]
        if printer_name in self.printer_statuses:
            del self.printer_statuses[printer_name]
    
    def _stop_worker(self, printer_name: str) -> bool:
        """Stop a worker process for a printer"""
        if printer_name not in self.workers:
            return True  # Already stopped
        
        try:
            worker_info = self.workers[printer_name]
            process = worker_info['process']

            # send shutdown command
            worker_info['command_queue'].put(None)

            # wait for process to terminate
            process.join(timeout=5.0)
            
            if process.is_alive():
                process.terminate()
                process.join(timeout=2.0)
                
                if process.is_alive():
                    process.kill()
                    process.join()
            
            # Clean up
            self._cleanup_worker(printer_name)
            
            self.logger.info(f"Stopped worker for printer {printer_name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to stop worker for {printer_name}: {e}")
            return False
    
    async def _send_command(self, printer_name: str, command: WorkerCommand, timeout: float = 10.0) -> Optional[WorkerResponse]:
        """Asynchronously send a command to a printer worker, safely callable from another loop."""
        if not self._ensure_worker_running(printer_name):
            return WorkerResponse(success=False, error="Failed to start printer worker")

        async def _send_and_receive():
            try:
                # send cmd an await response
                worker_info = self.workers[printer_name]
                await self.loop.run_in_executor(None, worker_info['command_queue'].put, command)
                f = self.loop.run_in_executor(None, worker_info['response_queue'].get, True, timeout)
                return await f 
                
            except Empty:
                return WorkerResponse(success=False, error="Command timeout")
            except Exception as e:
                self.logger.error(f"Failed to send command to {printer_name}: {e}")
                return WorkerResponse(success=False, error=str(e))

        # check if the current loop is the same as the manager's loop
        current_loop = asyncio.get_running_loop()
        if current_loop is self.loop:
            return await _send_and_receive()

        # if different loop, schedule it on the manager's loop 
        future = asyncio.run_coroutine_threadsafe(_send_and_receive(), self.loop)
        return await asyncio.wrap_future(future, loop=current_loop)
    
    def list_available_printers(self) -> list[str]:
        """List all available printers"""
        return list(printer_config.get_available_printers().keys())

    def list_active_workers(self) -> list[str]:
        """List all active worker processes"""
        # Filter out dead processes
        active_workers = []
        for name, worker_info in list(self.workers.items()):
            if worker_info['process'].is_alive():
                active_workers.append(name)
            else:
                self._cleanup_worker(name)
        return active_workers
    
    def get_printer_status(self, printer_name: str) -> Dict[str, Any]:
        """Get the current status of a printer"""
        if printer_name in self.printer_statuses:
            return self.printer_statuses[printer_name]
        
        # Return default status if printer not found
        printer_config_data = printer_config.get_printer_by_name(printer_name)
        display_name = printer_config_data.get('display_name', printer_name) if printer_config_data else printer_name
        
        return {
            "status": "disconnected",
            "name": printer_name,
            "display_name": display_name,
            "baud": 0,
            "progress": 0,
            "timeElapsed": 0,
            "timeRemaining": 0,
            "currentQueueItem": None,
            "currentQueueItemName": None,
            "bedClear": False,
            "bedTemp": {"current": 0, "target": 0},
            "nozzleTemp": {"current": 0, "target": 0},
        }
    
    def get_all_printer_statuses(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all available printers"""
        statuses = {}
        for printer_name in self.list_available_printers():
            statuses[printer_name] = self.get_printer_status(printer_name)
        return statuses
    
    async def connect_printer(self, printer_name: str, baud: Optional[int] = None) -> Optional[WorkerResponse]:
        """Connect to a printer"""
        # Use preferred baud rate if no baud specified
        if baud is None:
            preferred_baud = printer_config.get_printer_preferred_baud(printer_name)
            if preferred_baud:
                baud = preferred_baud
        
        command = WorkerCommand(action="connect", data={"baud": baud} if baud else None)
        return await self._send_command(printer_name, command)
    
    async def disconnect_printer(self, printer_name: str) -> Optional[WorkerResponse]:
        """Disconnect from a printer"""
        command = WorkerCommand(action="disconnect")
        response = await self._send_command(printer_name, command)
        
        # Also stop the worker process
        self._stop_worker(printer_name)
        
        return response
    
    async def send_printer_command(self, printer_name: str, gcode_command: str) -> Optional[WorkerResponse]:
        """Send a G-code command to a printer"""
        command = WorkerCommand(action="command", data={"command": gcode_command})
        return await self._send_command(printer_name, command)
    
    async def pause_print(self, printer_name: str) -> Optional[WorkerResponse]:
        """Pause printing"""
        command = WorkerCommand(action="pause")
        return await self._send_command(printer_name, command)
    
    async def resume_print(self, printer_name: str) -> Optional[WorkerResponse]:
        """Resume printing"""
        command = WorkerCommand(action="resume")
        return await self._send_command(printer_name, command)
    
    async def stop_print(self, printer_name: str) -> Optional[WorkerResponse]:
        """Stop printing"""
        command = WorkerCommand(action="stop")
        return await self._send_command(printer_name, command)
    
    async def clear_bed(self, printer_name: str) -> Optional[WorkerResponse]:
        """Clear the bed"""
        command = WorkerCommand(action="clear_bed")
        return await self._send_command(printer_name, command)
    
    async def start_print_from_queue(self, printer_name: str, queue_item_id: str) -> Optional[WorkerResponse]:
        """Start printing from a queue item"""
        # try to start the worker if not already running
        if not self._ensure_worker_running(printer_name):
            return WorkerResponse(success=False, error="Failed to start printer worker")
        
        # if not connected, connect first
        status = self.get_printer_status(printer_name)["status"]
        if status not in ["idle", "printing", "paused"]:
            connect_response = await self.connect_printer(printer_name)
            if not connect_response or not connect_response.success:
                return connect_response

        command = WorkerCommand(action="start_queue_item", data={"queue_item_id": queue_item_id})
        return await self._send_command(printer_name, command)
    
    async def mark_print_finished(self, printer_name: str) -> Optional[WorkerResponse]:
        """Mark the current print as finished"""
        command = WorkerCommand(action="mark_finished")
        return await self._send_command(printer_name, command)
    
    async def mark_print_failed(self, printer_name: str, error_message: str = None) -> Optional[WorkerResponse]:
        """Mark the current print as failed"""
        command = WorkerCommand(action="mark_failed", data={"error_message": error_message})
        return await self._send_command(printer_name, command)
    
    def shutdown(self):
        """Shutdown all worker processes"""
        self.logger.info("Shutting down printer manager...")
        self.running = False
        
        # Stop all workers
        for printer_name in list(self.workers.keys()):
            self._stop_worker(printer_name)
        
        # Stop status monitoring thread
        if self.loop and self.loop.is_running():
            self.loop.call_soon_threadsafe(self.loop.stop)
        if self.loop_thread and self.loop_thread.is_alive():
            self.loop_thread.join(timeout=2.0)
        
        self.logger.info("Printer manager shutdown complete")


# Global printer manager instance
printer_manager = PrinterManager()
