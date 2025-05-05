import React from 'react';
import { FaSync } from 'react-icons/fa';
import { useUserContext, initialState } from '../UserContext';
import { usePrinterActions } from '../hooks/usePrinterActions';
import styles from '../styles/PrintersList.module.css';


function Printer({ printerState, onClick, disabled }) {
    const { printing, paused, progress, name, connected } = printerState;

    let statusColor = "#cccccc"; // default: disconnected
    if (connected && printing) {
        statusColor = "#4CAF50"; // green if connected and printing
    } else if (connected && !printing) {
        statusColor = "#2196F3"; // blue if connected and not printing
    } else if (connected && paused) {
        statusColor = "#FF9800"; // orange if connected and paused
    }

    return (
        <div className={styles.printer_button_wrapper}>
            <button
                className={styles.printer_button}
                onClick={onClick}
                disabled={disabled}
            >
                <div
                    className={styles.printer_status_indicator}
                    style={{ backgroundColor: statusColor }}
                />
                <img
                    src="printer.webp"
                    alt="Printer Icon"
                    className={styles.printer_icon}
                />
                <span className={styles.printer_name}>{name}</span>
            </button>
        </div>
    );
}


export function PrintersList({ onClick }) {
    const [state] = useUserContext();
    const { refreshPrinters } = usePrinterActions();
    const printers = state.printers;
    const printers_name = Object.keys(printers);

    return (
        <div className="printer">
            <div className={styles.printer_header}>
                <h3>Printers
                    <span className="printer_count">
                        {printers.length > 0 ? ` (${printers.length})` : ''}
                    </span>
                    <button
                        className="refresh_button"
                        onClick={refreshPrinters}
                        title="Refresh Printers"
                        style={{ marginLeft: '10px' }}
                    >
                        <FaSync />
                    </button>

                </h3>
            </div>

            {printers_name.length > 0 && (
                <div className={styles.printer_list}>
                    {printers_name.map((printerName, index) => (
                        <Printer
                            key={index}
                            printerState={printers[printerName]}
                            onClick={() => onClick(printerName)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
