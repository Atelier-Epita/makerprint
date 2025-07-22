"""
Configuration management for printer mappings and properties
"""
import json
import yaml
import os
from typing import Dict, Optional
import serial
import serial.tools.list_ports
import re

from . import utils


class PrinterConfig:
    """Manages printer configuration and device mapping"""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path or os.environ.get("PRINTER_CONFIG", "/config/printers.yaml")
        self.config_data = {}
        self.device_mapping = {}  # maps device paths to printer configs
        self.name_mapping = {}    # maps printer names to printer configs
        self.logger = utils.logger.getChild("config")
        
        self.load_config()
        self._update_device_mapping()
    
    def load_config(self):
        """Load configuration from file"""
        if not os.path.exists(self.config_path):
            self.logger.info(f"Configuration file {self.config_path} not found, creating default")
            self.create_default_config()
            return
        
        try:
            with open(self.config_path, 'r') as f:
                if self.config_path.endswith('.yaml') or self.config_path.endswith('.yml'):
                    self.config_data = yaml.safe_load(f)
                else:
                    self.config_data = json.load(f)
            
            self.logger.info(f"Loaded printer configuration from {self.config_path}")
            
            # Validate config structure
            if not isinstance(self.config_data, dict) or 'printers' not in self.config_data:
                raise ValueError("Invalid configuration format")
                
        except Exception as e:
            self.logger.error(f"Failed to load configuration: {e}")
            self.create_default_config()
    
    def save_config(self):
        """Save current configuration to file"""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            
            with open(self.config_path, 'w') as f:
                if self.config_path.endswith('.yaml') or self.config_path.endswith('.yml'):
                    yaml.safe_dump(self.config_data, f, default_flow_style=False)
                else:
                    json.dump(self.config_data, f, indent=2)
            
            self.logger.info(f"Saved printer configuration to {self.config_path}")
            
        except Exception as e:
            self.logger.error(f"Failed to save configuration: {e}")
    
    def _is_potential_printer_device(self, device) -> bool:
        """Check if a device could be a printer based on its description"""
        white_list = ['usb', 'serial', 'arduino', 'ch340', 'cp210', 'ftdi']
        return any(keyword in device.description.lower() for keyword in white_list)
    
    def _extract_device_info(self, device) -> Dict:
        """Extract device information for printer configuration"""
        vid_str = None
        pid_str = None
        if hasattr(device, 'vid') and device.vid is not None:
            vid_str = f"{device.vid:04x}"
        if hasattr(device, 'pid') and device.pid is not None:
            pid_str = f"{device.pid:04x}"
        
        return {
            "usb_vid": vid_str,
            "usb_pid": pid_str,
            "serial_number": getattr(device, 'serial_number', None),
            "preferred_baud": None
        }

    def create_default_config(self):
        """Create a default configuration file based on detected devices"""
        self.logger.info("Creating default printer configuration...")
        
        devices = serial.tools.list_ports.comports()
        printers = {}
        
        # create entries for detected USB devices that might be printers
        for i, device in enumerate(devices):
            if self._is_potential_printer_device(device):
                printer_name = f"Printer_{i+1}"
                device_info = self._extract_device_info(device)
                
                printers[printer_name] = {
                    **device_info,
                    "display_name": printer_name
                }
            else:
                self.logger.debug(f"Skipping non-printer device: {device.description}, {device.device}, {device.serial_number}")
        
        # if debug mode, add some mock printers
        debug_mode = os.environ.get("DEBUG", "false").lower() == "true"
        if debug_mode:
            for i in range(3):
                printer_name = f"MockPrinter_{i+1}"
                printers[printer_name] = {
                    "usb_vid": "1234",
                    "usb_pid": f"500{i}",
                    "serial_number": f"MOCK{i:04d}",
                    "display_name": f"Mock Printer {i+1}",
                    "preferred_baud": 115200
                }
        
        self.config_data = {
            "version": "1.0",
            "printers": printers,
            "global_settings": {
                "auto_detect_new_devices": True,
                "default_baud_rates": [250000, 115200, 57600],
                "connection_timeout": 10,
                "status_update_interval": 1.0
            }
        }
        
        self.save_config()
    
    def _update_device_mapping(self):
        """Update internal device mappings"""
        self.device_mapping.clear()
        self.name_mapping.clear()
        
        if 'printers' not in self.config_data:
            return
        
        # Get current devices to map USB IDs to device paths
        current_devices = {device.device: device for device in serial.tools.list_ports.comports()}
        
        for printer_name, printer_config in self.config_data['printers'].items():
            # Find the actual device path by matching USB VID/PID or serial number
            device_path = self._find_device_path(printer_config, current_devices)
            if device_path:
                self.device_mapping[device_path] = {
                    'name': printer_name,
                    'config': printer_config
                }
            
            self.name_mapping[printer_name] = printer_config
    
    def _find_device_path(self, printer_config: Dict, current_devices: Dict) -> Optional[str]:
        """Find the current device path for a printer configuration"""
        usb_vid = printer_config.get('usb_vid')
        usb_pid = printer_config.get('usb_pid')
        serial_number = printer_config.get('serial_number')
        
        debug_mode = os.environ.get("DEBUG", "false").lower() == "true" # check if working in debug mode
        for device_path, device in current_devices.items():
            if debug_mode and hasattr(device, 'description') and 'Mock' in device.description:
                # probably overkill for now, but might be useful for dispatching later on ?
                # For mock printers, match by the mock USB VID/PID pattern
                if usb_vid == "1234" and usb_pid and usb_pid.startswith('500') and hasattr(device, 'description'):
                    # Expected format: "Mock Printer Device 0", "Mock Printer Device 1", etc.

                    device_index = device.description.split()[-1]  # Get the last part of the description
                    if not device_index.isdigit():
                        continue # skip

                    device_index = int(device_index)
                    expected_pid = f"500{device_index}"
                    expected_serial = f"MOCK{device_index:0>4}"
                    
                    # should match the mock printer's USB PID and serial number
                    if usb_pid == expected_pid and (not serial_number or serial_number == expected_serial):
                        self.logger.debug(f"Mock printer matched: {device_path}")
                        return device_path
            
            # Match by USB VID/PID
            elif usb_vid and usb_pid:
                device_vid = getattr(device, 'vid', None)
                device_pid = getattr(device, 'pid', None)
                
                if device_vid is not None and device_pid is not None:
                    # Convert to hex strings for comparison
                    device_vid_str = f"{device_vid:04x}" if isinstance(device_vid, int) else str(device_vid)
                    device_pid_str = f"{device_pid:04x}" if isinstance(device_pid, int) else str(device_pid)
                    
                    if (device_vid_str.lower() == usb_vid.lower() and
                        device_pid_str.lower() == usb_pid.lower()):
                        
                        # If serial number is specified, also check that
                        if serial_number and hasattr(device, 'serial_number'):
                            if device.serial_number == serial_number:
                                return device_path
                        elif not serial_number:
                            return device_path
            
            # Match by serial number only
            elif serial_number and hasattr(device, 'serial_number'):
                if device.serial_number == serial_number:
                    return device_path
        
        return None
    
    def get_printer_by_device(self, device_path: str) -> Optional[Dict]:
        """Get printer configuration by device path"""
        return self.device_mapping.get(device_path)
    
    def get_printer_by_name(self, printer_name: str) -> Optional[Dict]:
        """Get printer configuration by name"""
        return self.name_mapping.get(printer_name)
    
    def get_all_configured_printers(self) -> Dict[str, Dict]:
        """Get all configured printers"""
        return self.config_data.get('printers', {})
    
    def get_available_printers(self) -> Dict[str, str]:
        """Get available printers (name -> device_path mapping)"""
        self._update_device_mapping()
        
        available = {}
        current_devices = {device.device: device for device in serial.tools.list_ports.comports()}
        
        for printer_name, config in self.get_all_configured_printers().items():
            device_path = self._find_device_path(config, current_devices)
            if device_path:
                available[printer_name] = device_path
        
        # Auto-detect new devices if enabled
        if self.config_data.get('global_settings', {}).get('auto_detect_new_devices', True):
            self._auto_detect_new_devices(current_devices, available)
        
        return available
    
    def _auto_detect_new_devices(self, current_devices: Dict, available: Dict):
        """Auto-detect and add new devices"""
        configured_devices = set()
        
        # Build set of already configured USB devices (vid:pid, serial)
        for config in self.get_all_configured_printers().values():
            usb_vid = config.get('usb_vid', '')
            usb_pid = config.get('usb_pid', '')
            vid_pid = f"{usb_vid}:{usb_pid}"
            serial = config.get('serial_number', '')
            if vid_pid != ":" or serial:
                configured_devices.add((vid_pid, serial))
        
        already_available_paths = set(available.values())
        for device_path, device in current_devices.items():
            if device_path in already_available_paths:
                continue # skip because already configured
                
            if self._is_potential_printer_device(device):
                # Convert VID/PID to hex strings for comparison
                vid = getattr(device, 'vid', None)
                pid = getattr(device, 'pid', None)
                vid_str = f"{vid:04x}" if vid is not None else ""
                pid_str = f"{pid:04x}" if pid is not None else ""
                vid_pid = f"{vid_str}:{pid_str}"
                serial = getattr(device, 'serial_number', '')
                
                # Only add if not already configured
                if (vid_pid, serial) not in configured_devices:
                    # Create a temporary name for this auto-detected device
                    device_name = getattr(device, 'name', 'Unknown')
                    temp_name = f"AutoDetected_{device_name}"
                    
                    # Ensure unique name
                    counter = 1
                    base_name = temp_name
                    while temp_name in available:
                        temp_name = f"{base_name}_{counter}"
                        counter += 1
                    
                    available[temp_name] = device_path
                    self.logger.info(f"Auto-detected new printer device: {device_path} ({device.description})")
    
    def get_printer_preferred_baud(self, printer_name: str) -> Optional[int]:
        """Get printer preferred baudrate"""
        config = self.get_printer_by_name(printer_name)
        if config:
            return config.get('preferred_baud')
        return None
    
    def is_printer_available(self, printer_name: str) -> tuple[bool, Optional[str]]:
        """Check if a specific printer is available and return its device path"""
        printer_config_data = self.get_printer_by_name(printer_name)
        if not printer_config_data:
            return False, None
        
        current_devices = {device.device: device for device in serial.tools.list_ports.comports()}
        device_path = self._find_device_path(printer_config_data, current_devices)
        return device_path is not None, device_path


# Global config instance
printer_config = PrinterConfig()
