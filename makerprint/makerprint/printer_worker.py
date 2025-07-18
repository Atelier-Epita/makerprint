"""
Printer Worker Process - Handles a single printer in its own process
"""
import os
import time
import multiprocessing
import signal
import threading
from typing import Dict, Any, Optional
from dataclasses import dataclass

from .printer import Printer
from . import utils, models


@dataclass
class WorkerCommand:
    """Command to send to printer worker"""
    action: str  # connect, disconnect, command, start, pause, resume, stop, status, clear_bed
    data: Optional[Dict[str, Any]] = None


@dataclass
class WorkerResponse:
    """Response from printer worker"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class PrinterWorkerProcess:
    """Worker process that manages a single printer"""
    
    def __init__(self, printer_name: str, printer_port: str, 
                 command_queue: multiprocessing.Queue, 
                 response_queue: multiprocessing.Queue, 
                 status_queue: multiprocessing.Queue):
        self.printer_name = printer_name
        self.printer_port = printer_port
        self.command_queue = command_queue
        self.response_queue = response_queue
        self.status_queue = status_queue
        self.printer: Optional[Printer] = None
        self.running = True
        
        self.logger = utils.logger.getChild(f"worker-{printer_name}")
        
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
        
        self.status_thread = None
        self.status_update_interval = 1.0  # Send status updates every second
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        self.logger.info(f"Received signal {signum}, shutting down worker for {self.printer_name}")
        self.running = False
        if self.printer:
            self.printer.disconnect()
    
    def _start_status_monitor(self):
        """Start the status monitoring thread"""
        self.status_thread = threading.Thread(target=self._status_monitor_loop, daemon=True)
        self.status_thread.start()
    
    def _status_monitor_loop(self):
        """Monitor and send status updates"""
        last_update = 0
        while self.running:
            current_time = time.time()
            if current_time - last_update >= self.status_update_interval:
                try:
                    if self.printer:
                        status = self.printer.get_status()
                        status_dict = status.model_dump()
                        self.status_queue.put((self.printer_name, status_dict))
                    else:
                        # Send disconnected status
                        default_status = models.PrinterStatus(
                            status="disconnected",
                            port=self.printer_port,
                            name=self.printer_name,
                            baud=0,
                            progress=0
                        )
                        self.status_queue.put((self.printer_name, default_status.model_dump()))
                    last_update = current_time
                except Exception as e:
                    self.logger.error(f"Error sending status update: {e}")
            time.sleep(0.1)
    
    def _process_connect(self, data: Optional[Dict[str, Any]]) -> WorkerResponse:
        """Connect to the printer"""
        try:
            if self.printer and self.printer.online:
                return WorkerResponse(success=True, data=self.printer.get_status().model_dump())
            
            baud = data.get("baud") if data else None
            self.printer = Printer(self.printer_port, baud=baud)
            
            # Use asyncio.run for the async connect method
            import asyncio
            asyncio.run(self.printer.connect())
            
            self.logger.info(f"Connected to printer {self.printer_name} on {self.printer_port}")
            return WorkerResponse(success=True, data=self.printer.get_status().model_dump())
            
        except Exception as e:
            self.logger.error(f"Failed to connect to {self.printer_name}: {e}")
            return WorkerResponse(success=False, error=str(e))
    
    def _process_disconnect(self) -> WorkerResponse:
        """Disconnect from the printer"""
        try:
            if self.printer:
                self.printer.disconnect()
                self.printer = None
            return WorkerResponse(success=True)
        except Exception as e:
            self.logger.error(f"Failed to disconnect {self.printer_name}: {e}")
            return WorkerResponse(success=False, error=str(e))
    
    def _process_command(self, data: Dict[str, Any]) -> WorkerResponse:
        """Send a G-code command to the printer"""
        try:
            if not self.printer or not self.printer.online:
                return WorkerResponse(success=False, error="Printer not connected")
            
            command = data.get("command", "")
            if not command:
                return WorkerResponse(success=False, error="Command cannot be empty")
            
            # Split commands by semicolon and strip whitespace
            commands = [cmd.strip() for cmd in command.split(";") if cmd.strip()]
            for cmd in commands:
                self.printer.send_now(cmd)
            
            return WorkerResponse(success=True, data=self.printer.get_status().model_dump())
            
        except Exception as e:
            self.logger.error(f"Failed to send command to {self.printer_name}: {e}")
            return WorkerResponse(success=False, error=str(e))
    
    def _process_start(self, data: Dict[str, Any]) -> WorkerResponse:
        """Start printing a file"""
        try:
            if not self.printer or not self.printer.online:
                return WorkerResponse(success=False, error="Printer not connected")
            
            filename = data.get("filename")
            if not filename:
                return WorkerResponse(success=False, error="Filename cannot be empty")
            
            gcode = self.printer.prepare_gcode(filename)
            self.printer.startprint(gcode)
            
            return WorkerResponse(success=True, data=self.printer.get_status().model_dump())
            
        except Exception as e:
            self.logger.error(f"Failed to start print on {self.printer_name}: {e}")
            return WorkerResponse(success=False, error=str(e))
    
    def _process_pause(self) -> WorkerResponse:
        """Pause printing"""
        try:
            if not self.printer or not self.printer.online:
                return WorkerResponse(success=False, error="Printer not connected")
            
            self.printer.pause()
            return WorkerResponse(success=True, data=self.printer.get_status().model_dump())
            
        except Exception as e:
            self.logger.error(f"Failed to pause print on {self.printer_name}: {e}")
            return WorkerResponse(success=False, error=str(e))
    
    def _process_resume(self) -> WorkerResponse:
        """Resume printing"""
        try:
            if not self.printer or not self.printer.online:
                return WorkerResponse(success=False, error="Printer not connected")
            
            self.printer.resume()
            return WorkerResponse(success=True, data=self.printer.get_status().model_dump())
            
        except Exception as e:
            self.logger.error(f"Failed to resume print on {self.printer_name}: {e}")
            return WorkerResponse(success=False, error=str(e))
    
    def _process_stop(self) -> WorkerResponse:
        """Stop printing"""
        try:
            if not self.printer or not self.printer.online:
                return WorkerResponse(success=False, error="Printer not connected")
            
            self.printer.cancelprint()
            return WorkerResponse(success=True, data=self.printer.get_status().model_dump())
            
        except Exception as e:
            self.logger.error(f"Failed to stop print on {self.printer_name}: {e}")
            return WorkerResponse(success=False, error=str(e))
    
    def _process_clear_bed(self) -> WorkerResponse:
        """Clear the bed"""
        try:
            if not self.printer or not self.printer.online:
                return WorkerResponse(success=False, error="Printer not connected")
            
            self.printer.clear_bed()
            return WorkerResponse(success=True, data=self.printer.get_status().model_dump())
            
        except Exception as e:
            self.logger.error(f"Failed to clear bed on {self.printer_name}: {e}")
            return WorkerResponse(success=False, error=str(e))
    
    def _process_status(self) -> WorkerResponse:
        """Get printer status"""
        try:
            if self.printer:
                return WorkerResponse(success=True, data=self.printer.get_status().model_dump())
            else:
                default_status = models.PrinterStatus(
                    status="disconnected",
                    port=self.printer_port,
                    name=self.printer_name,
                    baud=0,
                    progress=0
                )
                return WorkerResponse(success=True, data=default_status.model_dump())
                
        except Exception as e:
            self.logger.error(f"Failed to get status from {self.printer_name}: {e}")
            return WorkerResponse(success=False, error=str(e))
    
    def _handle_command(self, command: WorkerCommand) -> WorkerResponse:
        """Process a command from the main process"""
        try:
            if command.action == "connect":
                return self._process_connect(command.data)
            elif command.action == "disconnect":
                return self._process_disconnect()
            elif command.action == "command":
                return self._process_command(command.data or {})
            elif command.action == "start":
                return self._process_start(command.data or {})
            elif command.action == "pause":
                return self._process_pause()
            elif command.action == "resume":
                return self._process_resume()
            elif command.action == "stop":
                return self._process_stop()
            elif command.action == "clear_bed":
                return self._process_clear_bed()
            elif command.action == "status":
                return self._process_status()
            else:
                return WorkerResponse(success=False, error=f"Unknown command: {command.action}")
                
        except Exception as e:
            self.logger.error(f"Error processing command {command.action}: {e}")
            return WorkerResponse(success=False, error=str(e))
    
    def run(self):
        """Main worker loop"""
        self.logger.info(f"Starting printer worker for {self.printer_name} on {self.printer_port}")
        
        # Start status monitoring
        self._start_status_monitor()
        
        try:
            while self.running:
                try:
                    # Wait for commands with timeout
                    command = self.command_queue.get(timeout=0.1)
                    
                    if command is None:  # Shutdown signal
                        break
                    
                    response = self._handle_command(command)
                    self.response_queue.put(response)
                    
                except multiprocessing.queues.Empty:
                    continue
                except Exception as e:
                    self.logger.error(f"Error in worker loop: {e}")
                    error_response = WorkerResponse(success=False, error=str(e))
                    try:
                        self.response_queue.put(error_response)
                    except:
                        pass
                        
        except Exception as e:
            self.logger.error(f"Fatal error in worker: {e}")
        finally:
            # Cleanup
            if self.printer:
                try:
                    self.printer.disconnect()
                except:
                    pass
            self.logger.info(f"Printer worker for {self.printer_name} shutting down")


def start_printer_worker(printer_name: str, printer_port: str, 
                        command_queue: multiprocessing.Queue,
                        response_queue: multiprocessing.Queue, 
                        status_queue: multiprocessing.Queue):
    """Entry point for starting a printer worker process"""
    worker = PrinterWorkerProcess(printer_name, printer_port, command_queue, response_queue, status_queue)
    worker.run()
