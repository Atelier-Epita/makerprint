import { useEffect, useState } from 'react';
import {
    startPrinter,
    stopPrinter,
    pausePrinter,
    resumePrinter,
    connectPrinter,
    disconnectPrinter,
    sendCmd,
    fetchPrinterStatus,
} from '@/api/printers';


export function usePrinterStatus(printerName?: string) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshStatus = async (hotReload = true) => {
        if (!printerName) return;
        if (!hotReload) {
            setLoading(true);
            setError(null);
        }

        fetchPrinterStatus(printerName)
            .then(res => setStatus(res.data))
            .catch(err => setError(err.message || 'Erreur inconnue'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (printerName) {
            refreshStatus(false);
        }
    }, [printerName]);

    useEffect(() => {
        if (!printerName) return;

        const interval = setInterval(() => {
            refreshStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, [printerName]);

    const start = async (selectedFile) => {
        startPrinter(printerName, selectedFile)
            .then((resp) => {
                setStatus(resp.data);
            }).catch((error) => {
                console.error('Error starting print:', error);
            });
    }
    const stop = async () => {
        stopPrinter(printerName)
            .then((resp) => {
                setStatus(resp.data);
            }).catch((error) => {
                console.error('Error stopping print:', error);
            });
    }
    const pauseOrResume = async () => {
        if (status.status === 'printing') {
            pausePrinter(printerName)
                .then((resp) => {
                    setStatus(resp.data);
                }
                ).catch((error) => {
                    console.error('Error pausing print:', error);
                });
        } else if (status.status === 'paused') {
            resumePrinter(printerName)
                .then((resp) => {
                    setStatus(resp.data);
                }
                ).catch((error) => {
                    console.error('Error resuming print:', error);
                });
        }
    }

    const connect = async () => {
        connectPrinter(printerName)
            .then((resp) => {
                setStatus(resp.data);
            }).catch((error) => {
                console.error('Error connecting to printer:', error);
            });
    }
    const disconnect = async () => {
        disconnectPrinter(printerName)
            .then((resp) => {
                setStatus(resp.data);
            }).catch((error) => {
                console.error('Error disconnecting from printer:', error);
            });
    }

    const sendCommand = async (name: string, gcodeCommand: string) => {
        sendCmd(name, gcodeCommand)
            .then((resp) => {
                setStatus(resp.data);
            }).catch((error) => {
                console.error(`Error executing command ${gcodeCommand} on printer ${name}:`, error);
            });
    }

    const actions = {
        start,
        stop,
        pauseOrResume,
        connect,
        disconnect,
        sendCommand,
        refreshStatus,
    };

    return {
        printer: status,
        loading,
        error,
        actions,
    };
}
