import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ACTIONS, useUserContext } from '../UserContext';
import { usePrinterActions } from '../hooks/usePrinterActions'; // adjust path if necessary
import styles from '../styles/Status.module.css';

function Status() {
    const [state] = useUserContext();
    const { name: printer_name } = useParams();
    const {
        startPrinting,
        pausePrinting,
        stopPrinting,
        getPrinterStatus,
        connectToPrinter,
        disconnectFromPrinter,
    } = usePrinterActions();

    // why the fuck does this create some undifined stuff ??
    // useEffect(() => {
    //     if (!printer_name) return;
    //     // getPrinterStatus(printer_name); // initial fetch

    //     const interval = setInterval(() => {
    //         getPrinterStatus(printer_name);
    //     }, 5000);

    //     return () => clearInterval(interval);
    // }, []);

    console.log("status", state.status);

    const printer_status = state.status || {};
    const status_text = printer_status.connected
        ? printer_status.printing
            ? 'Printing'
            : printer_status.paused
                ? 'Paused'
                : 'Idle'
        : 'Disconnected';

    const temperature_text = `${printer_status.extruder_temp || 0}/${printer_status.extruder_temp_target || 0}°C ${printer_status.bed_temp || 0}/${printer_status.bed_temp_target || 0}°C`;

    return (
        <div>
            <h2>Status</h2>

            <div className={styles.status_text}>
                <p>Printer: {printer_name}</p>
                <p>File: {state.fileName}</p>
                <p>Status: {status_text}</p>
                <p>Temperature: {temperature_text}</p>
                <p>Progress: {printer_status.progress ? `${printer_status.progress}%` : 'N/A'}</p>
                <div className={styles.progress_bar_container}>
                    <div className={styles.progress_bar} style={{ width: `${printer_status.progress || 0}%` }}></div>
                </div>
            </div>

            <div className="button_container">
                <button
                    onClick={() => startPrinting(printer_name, state.fileName)}
                    disabled={!state.fileName || !printer_name || printer_status.printing || printer_status.paused}
                >
                    Start
                </button>
                <button
                    onClick={() => pausePrinting(printer_name, printer_status)}
                    disabled={!printer_status.paused && !printer_status.printing}
                >
                    {printer_status.printing ? 'Pause' : printer_status.paused ? 'Resume' : 'Pause'}
                </button>
                <button
                    onClick={() => stopPrinting(printer_name)}
                    disabled={!printer_status.printing && !printer_status.paused}
                >
                    Stop
                </button>

                {/* connect or disconnect button */}
                <button
                    onClick={() => {
                        if (printer_status.connected) {
                            disconnectFromPrinter(printer_name);
                        } else {
                            connectToPrinter(printer_name);
                        }
                    }}
                    disabled={printer_status.printing || printer_status.paused}
                >
                    {printer_status.connected ? 'Disconnect' : 'Connect'}
                </button>
            </div>
        </div>
    );
}

export default Status;
