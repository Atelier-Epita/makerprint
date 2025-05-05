import { useUserContext, ACTIONS } from '../UserContext';
import {
    fetchPrinters,
    fetchPrinterStatus,
    startPrinter,
    stopPrinter,
    pausePrinter,
    connectPrinter,
    disconnectPrinter
} from '../api/printers';

export function usePrinterActions() {
    const [, dispatch] = useUserContext();

    const handleStatus = (res) => {
        dispatch({ type: ACTIONS.SET_ERROR, payload: [res.status, res.statusText] });
        dispatch({ type: ACTIONS.SET_PRINTER_STATUS, payload: res.data });
    };

    const handleError = (err) => {
        dispatch({
            type: ACTIONS.SET_ERROR,
            payload: [err.code || err.name, err.message || err.code],
        });
    };

    const refreshPrinters = async () => {
        try {
            const printers = await fetchPrinters();
            dispatch({ type: ACTIONS.SET_PRINTERS, payload: printers });
        } catch (err) {
            handleError(err);
        }
    };

    const clearPrinterName = () => {
        dispatch({ type: ACTIONS.SET_PRINTER_NAME, payload: null });
    };

    const getPrinterStatus = async (printer_name) => {
        try {
            const res = await fetchPrinterStatus(printer_name);
            handleStatus(res);
        } catch (err) {
            handleError(err);
        }
    };

    const startPrinting = async (printer_name, filename) => {
        try {
            const res = await startPrinter(printer_name, filename);
            handleStatus(res);
        } catch (err) {
            handleError(err);
        }
    };

    const pausePrinting = async (printer_name, printer_status) => {
        try {
            const res = await pausePrinter(printer_name, printer_status);
            handleStatus(res);
        } catch (err) {
            handleError(err);
        }
    };

    const stopPrinting = async (printer_name) => {
        try {
            const res = await stopPrinter(printer_name);
            handleStatus(res);
        } catch (err) {
            handleError(err);
        }
    };

    const connectToPrinter = async (printer_name) => {
        try {
            const res = await connectPrinter(printer_name);
            handleStatus(res);
        } catch (err) {
            handleError(err);
        }
    };

    const disconnectFromPrinter = async (printer_name) => {
        try {
            const res = await disconnectPrinter(printer_name);
            handleStatus(res);
        } catch (err) {
            handleError(err);
        }
    };

    return {
        refreshPrinters,
        clearPrinters: clearPrinterName,
        getPrinterStatus,
        startPrinting,
        pausePrinting,
        stopPrinting,
        connectToPrinter,
        disconnectFromPrinter,
    };
}
