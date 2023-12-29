"""
Benchmark for serial baudrate and true speed
"""

import time
import serial
import serial.tools.list_ports
import random

from mock_serial import MockSerial

import makerprint

def generate_command():
    # generate dummy gcode like command
    commands = ["G0", "M0", "M1", "M2", "M3", "M4", "M5", "M6"]
    params = ["X", "Y", "Z", "E", "F"]
    num_params = random.randint(0, 5)
    return f"{random.choice(commands)} {' '.join([random.choice(params) + str(random.randint(0, 100)) for i in range(num_params)])}"

def benchmark(serial_port: str, baudrate: int):
    # open serial port
    ser = serial.Serial(serial_port, baudrate, timeout=1)

    # stress test by sending 10000 commands
    commands = [generate_command() for i in range(10000)]
    commands_str = ("\n".join(commands)).encode("utf-8")

    start = time.time()

    ser.write(commands_str)

    end = time.time()
    dt = end - start
    return dt

if __name__ == "__main__":
    # list all serial ports
    ports = makerprint.printer_serial.list_ports()
    print(ports)

    # test all baudrates
    for baudrate in makerprint.const.BAUDRATES:
        print(f"Testing baudrate {baudrate}")

        # test all serial ports
        for port in ports:
            print(f"Testing port {port}")

            # test 10 times
            times = [benchmark(port, baudrate) for i in range(10)]
            print(times)
            print(f"Average time: {sum(times) / len(times)}")