# Printer Configuration

This directory contains the printer configuration files for MakerPrint.

## Setup

1. Copy `printers.yaml.example` to `printers.yaml`
2. Edit `printers.yaml` to match your printer setup
3. Restart the MakerPrint API container

## Configuration Format

The configuration file uses YAML format with the following structure:

```yaml
version: "1.0"

printers:
  # Printer name (used internally and in the UI)
  YourPrinterName:
    usb_vid: "1234"                      # USB Vendor ID (4-digit hex)
    usb_pid: "5678"                      # USB Product ID (4-digit hex)
    serial_number: "ABC123DEF456"        # Optional: USB serial number
    display_name: "Your Printer Name"    # Human-readable name
    preferred_baud: 115200               # Preferred baud rate (optional)

global_settings:
  auto_detect_new_devices: true         # Auto-detect new USB devices
  default_baud_rates: [250000, 115200, 57600, 38400, 19200, 9600]
  connection_timeout: 10                # Connection timeout in seconds
  status_update_interval: 1.0          # Status update interval in seconds
```

## Baud Rates

Common baud rates for 3D printers:
- 250000: Most modern printers (Prusa, Artillery, etc.)
- 115200: Older printers, Wanhao, Ender series, ...
- 57600: shouldn't even exist, but we never know..

If you don't specify a preferred baud rate, MakerPrint will auto-detect it.
