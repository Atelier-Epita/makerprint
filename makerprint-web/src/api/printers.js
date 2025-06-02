import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

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

export async function pausePrinter(printer_name) {
    url = `${API_URL}/printers/${printer_name}/pause/`;
    const response = await axios.post(url);
    return response;
}

export async function resumePrinter(printer_name) {
    const response = await axios.post(`${API_URL}/printers/${printer_name}/resume/`);
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

export async function sendCmd(printer_name, command) {
    if (!printer_name || !command) {
        throw new Error("Printer name and command are required");
    }
    const response = await axios.post(`${API_URL}/printers/${printer_name}/command/`, { command });
    return response;
}