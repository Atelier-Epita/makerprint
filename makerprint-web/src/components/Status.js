import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { ACTIONS, useUserContext } from '../UserContext';

function Status() {
    const [state, dispatch] = useUserContext();

    // TODO: useEffect to get printer status every 5 seconds to update the progress etc.
    const getStatus = () => {
        axios.get(
            `${process.env.REACT_APP_API_URL}/printers/${state.printerName}/`
        )
            .then((res) => {
                dispatch({ type: ACTIONS.SET_ERROR, payload: [res.status, res.statusText] });
                dispatch({ type: ACTIONS.SET_PRINTER_STATUS, payload: res.data });
            });
    }

    const startPrinting = () => {
        axios.post(
            `${process.env.REACT_APP_API_URL}/printers/${state.printerName}/start/`,
            {
                filename: state.fileName,
            }
        )
            .then((res) => {
                dispatch({ type: ACTIONS.SET_ERROR, payload: [res.status, res.statusText] });
                dispatch({ type: ACTIONS.SET_PRINTER_STATUS, payload: res.data });
            })
            .catch((err) => {
                dispatch({ type: ACTIONS.SET_ERROR, payload: [err.name, err.code] });
            });
    }


    const pausePrinting = () => {

        let url;
        if (state.status.printing) {
            url = `${process.env.REACT_APP_API_URL}/printers/${state.printerName}/pause/`;
        }
        else if (state.status.paused) {
            url = `${process.env.REACT_APP_API_URL}/printers/${state.printerName}/resume/`;
        }
        else {
            console.log("Printer is not printing or paused");
            return;
        }

        axios.post(url)
            .then((res) => {
                dispatch({ type: ACTIONS.SET_ERROR, payload: [res.status, res.statusText] });
                dispatch({ type: ACTIONS.SET_PRINTER_STATUS, payload: res.data });
            })
            .catch((err) => {
                dispatch({ type: ACTIONS.SET_ERROR, payload: [err.name, err.code] });
            });
    }

    const stopPrinting = () => {
        axios.post(
            `${process.env.REACT_APP_API_URL}/printers/${state.printerName}/stop/`,
        )
            .then((res) => {
                dispatch({ type: ACTIONS.SET_ERROR, payload: [res.status, res.statusText] });
                dispatch({ type: ACTIONS.SET_PRINTER_STATUS, payload: res.data });
            })
            .catch((err) => {
                dispatch({ type: ACTIONS.SET_ERROR, payload: [err.name, err.code] });
            });
    }

    var disabled = !state.fileName || !state.printerName;
    const status_text = state.status.connected ? state.status.printing ? "Printing" : state.status.paused ? "Paused" : "Idle" : "Disconnected";

    return (
        <div className="menu-status">
            <h2>Status</h2>

            { /* status text */}
            <div className="status-text">
                <p>Printer: {state.printerName}</p>
                <p>File: {state.fileName}</p>
                <p>Status: {status_text}</p>
            </div>

            { /* progress bar */}
            <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${state.status.progress}%` }}></div>
            </div>

            { /* buttons */}
            <div className="status-buttons">
                <button onClick={startPrinting}
                    disabled={disabled || state.status.printing || state.status.paused}>
                    Start
                </button>
                <button onClick={pausePrinting}
                    disabled={disabled || (!state.status.paused && !state.status.printing)}>
                    {state.status.printing ? "Pause" : state.status.paused ? "Resume" : "Pause"}
                </button>
                <button onClick={stopPrinting}
                    disabled={disabled || (!state.status.printing && !state.status.paused)}>
                    Stop
                </button>
            </div>

        </div>
    );
}

export default Status;