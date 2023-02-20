from . import printer_serial, commands
import logging
import sys

# log to file and stdout
logging.basicConfig(
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("makerprint.log", mode="w")
    ],
    level=logging.DEBUG,
)


ser = printer_serial.PrinterSerial()
ser.send(commands.INIT_SD_CARD)
print(ser.recv())
ser.send(commands.LIST_SD_CARD)
print(ser.recv())

while True:
    a = input("Enter command: ")
    ser.send(a)
    print(ser.recv())
