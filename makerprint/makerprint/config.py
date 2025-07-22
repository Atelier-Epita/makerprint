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
            "usb_location": getattr(device, 'location', None),
            "preferred_baud": None
        }

    def create_default_config(self):
        """Create a default configuration file based on detected devices"""
        self.logger.info("Creating default printer configuration...")
        
        devices = serial.tools.list_ports.comports()
        printers = {}
        
        # create entries for detected USB devices that might be printers
        for i, device in enumerate(devices):
            printer_name = f"Printer_{i+1}"
            device_info = self._extract_device_info(device)
            
            printers[printer_name] = {
                **device_info,
                "display_name": printer_name
            }
        
        # if debug mode, add some mock printers
        debug_mode = os.environ.get("DEBUG", "false").lower() == "true"
        if debug_mode:
            for i in range(3):
                printer_name = f"MockPrinter_{i+1}"
                printers[printer_name] = {
                    "usb_vid": "1234",
                    "usb_pid": f"500{i}",
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
        usb_location = printer_config.get('usb_location')
        
        debug_mode = os.environ.get("DEBUG", "false").lower() == "true"
        
        for device_path, device in current_devices.items():
            if debug_mode and self._is_mock_device_match(device, usb_vid, usb_pid):
                return device_path
            elif self._is_location_match(device, usb_location, usb_vid, usb_pid):
                return device_path
            elif self._is_vid_pid_match(device, usb_vid, usb_pid, usb_location):
                return device_path
        
        return None
    
    def _is_mock_device_match(self, device, usb_vid: str, usb_pid: str) -> bool:
        """Check if device matches mock printer pattern"""
        if not (hasattr(device, 'description') and 'Mock' in device.description):
            return False
        
        if usb_vid != "1234" or not usb_pid or not usb_pid.startswith('500'):
            return False
        
        device_index = device.description.split()[-1]
        if not device_index.isdigit():
            return False
        
        expected_pid = f"500{device_index}"
        return usb_pid == expected_pid
    
    def _is_location_match(self, device, usb_location: str, usb_vid: str, usb_pid: str) -> bool:
        """Check if device matches by USB location"""
        if not usb_location or not hasattr(device, 'location'):
            return False
        
        if device.location != usb_location:
            return False
        
        if usb_vid and usb_pid:
            return self._verify_vid_pid(device, usb_vid, usb_pid)
        
        return True
    
    def _is_vid_pid_match(self, device, usb_vid: str, usb_pid: str, usb_location: str) -> bool:
        """Check if device matches by VID/PID (when no location specified)"""
        if not usb_vid or not usb_pid or usb_location:
            return False
        
        return self._verify_vid_pid(device, usb_vid, usb_pid)
    
    def _verify_vid_pid(self, device, expected_vid: str, expected_pid: str) -> bool:
        """Verify device VID/PID matches expected values"""
        device_vid = getattr(device, 'vid', None)
        device_pid = getattr(device, 'pid', None)
        
        if device_vid is None or device_pid is None:
            return False
        
        device_vid_str = f"{device_vid:04x}" if isinstance(device_vid, int) else str(device_vid)
        device_pid_str = f"{device_pid:04x}" if isinstance(device_pid, int) else str(device_pid)
        
        return (device_vid_str.lower() == expected_vid.lower() and
                device_pid_str.lower() == expected_pid.lower())
    
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
        configured_devices = self._get_configured_device_signatures()
        already_available_paths = set(available.values())
        new_printers_added = False
        
        for device_path, device in current_devices.items():
            if device_path in already_available_paths:
                continue
            
            device_signature = self._get_device_signature(device)
            if device_signature not in configured_devices:
                printer_name = self._add_auto_detected_printer(device, device_path)
                available[printer_name] = device_path
                new_printers_added = True
                self.logger.info(f"Auto-detected new printer device: {device_path} ({device.description})")
        
        if new_printers_added:
            self.save_config()
    
    def _get_configured_device_signatures(self) -> set:
        """Get set of already configured device signatures"""
        configured_devices = set()
        for config in self.get_all_configured_printers().values():
            signature = self._get_config_signature(config)
            if signature != "::":
                configured_devices.add(signature)
        return configured_devices
    
    def _get_device_signature(self, device) -> str:
        """Get device signature for comparison"""
        vid = getattr(device, 'vid', None)
        pid = getattr(device, 'pid', None)
        location = getattr(device, 'location', '')
        vid_str = f"{vid:04x}" if vid is not None else ""
        pid_str = f"{pid:04x}" if pid is not None else ""
        return f"{vid_str}:{pid_str}:{location}"
    
    def _get_config_signature(self, config: Dict) -> str:
        """Get config signature for comparison"""
        usb_vid = config.get('usb_vid', '')
        usb_pid = config.get('usb_pid', '')
        usb_location = config.get('usb_location', '')
        return f"{usb_vid}:{usb_pid}:{usb_location}"
    
    def _add_auto_detected_printer(self, device, device_path: str) -> str:
        """Add auto-detected printer to config and return its name"""
        device_name = getattr(device, 'name', 'Unknown')
        printer_name = f"AutoDetected_{device_name}"
        
        printer_name = self._ensure_unique_printer_name(printer_name)
        
        device_info = self._extract_device_info(device)
        printer_config = {
            **device_info,
            "display_name": printer_name,
            "auto_detected": True
        }
        
        if 'printers' not in self.config_data:
            self.config_data['printers'] = {}
        
        self.config_data['printers'][printer_name] = printer_config
        self.name_mapping[printer_name] = printer_config
        
        return printer_name
    
    def _ensure_unique_printer_name(self, base_name: str) -> str:
        """Ensure printer name is unique"""
        name = base_name
        counter = 1
        while name in self.get_all_configured_printers():
            name = f"{base_name}_{counter}"
            counter += 1
        return name
    
    def get_printer_preferred_baud(self, printer_name: str) -> Optional[int]:
        """Get printer preferred baudrate"""
        config = self.get_printer_by_name(printer_name)
        if config:
            return config.get('preferred_baud')
        return None
    
    def is_printer_available(self, printer_name: str) -> tuple[bool, Optional[str]]:
        """Check if a specific printer is available and return its device path"""
        # First check if it's a configured printer
        printer_config_data = self.get_printer_by_name(printer_name)
        if printer_config_data:
            current_devices = {device.device: device for device in serial.tools.list_ports.comports()}
            device_path = self._find_device_path(printer_config_data, current_devices)
            return device_path is not None, device_path
        
        # if not config, check if it's an auto-detected printer
        available_printers = self.get_available_printers()
        if printer_name in available_printers:
            return True, available_printers[printer_name]
        
        return False, None


# Global config instance
printer_config = PrinterConfig()
