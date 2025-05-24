import axios from 'axios';

const API_URL = import.meta.env.REACT_APP_API_URL;

export async function fetchPrinters() {
    const response = await axios.get(`${API_URL}/printers/`);
    return response;
}

export async function fetchPrinterStatus(printer_name) {
    const response = await axios.get(`${API_URL}/printers/${printer_name}/`);
    return response;
}

export async function startPrinter(printer_name, filename) {
    const response = await axios.post(`${API_URL}/printers/${printer_name}/start/`, { filename });
    return response;
}

export async function stopPrinter(printer_name) {
    const response = await axios.post(`${API_URL}/printers/${printer_name}/stop/`);
    return response;
}

export async function pausePrinter(printer_name, printer_status) {
    let url;
    if (printer_status.printing) {
        url = `${API_URL}/printers/${printer_name}/pause/`;
    } else if (printer_status.paused) {
        url = `${API_URL}/printers/${printer_name}/resume/`;
    } else {
        throw new Error("Printer is not printing or paused");
    }
    const response = await axios.post(url);
    return response;
}

export async function connectPrinter(printer_name) {
    const response = await axios.post(`${API_URL}/printers/${printer_name}/connect/`);
    return response;
}

export async function disconnectPrinter(printer_name) {
    const response = await axios.post(`${API_URL}/printers/${printer_name}/disconnect/`);
    return response;
}
