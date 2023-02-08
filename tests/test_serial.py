from makerprint import printer_serial


def test_serial():
    ports = printer_serial.list_ports()
    assert ports is not None
    if len(ports) > 0:
        assert printer_serial.connect(ports[0].device) is not None