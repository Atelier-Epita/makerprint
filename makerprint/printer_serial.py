import serial

baudrates = [250000, 115200, 57600, 38400, 19200, 9600]


def connect(port="/dev/ttyUSB0", timeout=1, baudrate=None):
    if baudrate is not None:
        return serial.Serial(port, baudrate, timeout=timeout)

    for baudrate in baudrates:
        try:
            ser = serial.Serial(port, baudrate, timeout=timeout)
            ser.close()
            return baudrate
        except serial.SerialException:
            pass
    return None


def list_ports():
    return serial.tools.list_ports.comports()
