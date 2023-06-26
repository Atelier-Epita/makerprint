from makerprint import printer_serial, commands

def test_list_ports():
    ports = printer_serial.list_ports()
    assert len(ports) > 0

def test_serial():
    printser = printer_serial.PrinterSerial()
    assert printser.ser is not None
    printser.ser.close()

def test_upload_file():
    printser = printer_serial.PrinterSerial()
    ret = printser.init_sd_card()
    print(ret)
    ret = printser.list_sd_card()
    print(ret)
    ret = printser.write_file("WD12300D_clip-v2.1.gcode", b"test")
    print(ret)
