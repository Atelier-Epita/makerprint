import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { ACTIONS, useUserContext } from '../UserContext';

function Status() {
    const [state, dispatch] = useUserContext();

    const sendCommand = (command) => {
        if (!state.printerName) return null;

        axios.post(
            `${process.env.REACT_APP_API_URL}/printer/command`,
            {
                command: command,
                port: state.printerName
            },
        )
            .then((res) => {
                const code = res.status;
                const message = res.statusText;
                dispatch({ type: ACTIONS.SET_ERROR, payload: [code, message] });
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const startPrinting = () => {
        axios.post(
            `${process.env.REACT_APP_API_URL}/printer/start`,
            {
                port: state.printerName,
                file: state.fileName
            },
        )
            .then((res) => {
                if (res.status === 200)
                {
                    dispatch({ type: ACTIONS.SET_STATUS, payload: "printing" });
                }
                else {
                    dispatch({ type: ACTIONS.SET_STATUS, payload: "idle" });
                }
                const code = res.status;
                const message = res.statusText;
                dispatch({ type: ACTIONS.SET_ERROR, payload: [code, message] });
            })
            .catch((err) => {
                console.log(err);
            });

    }

    const stopPrinting = () => {
        sendCommand("M0");
        dispatch({ type: ACTIONS.SET_STATUS, payload: "idle" });
    }

    const pausePrinting = () => {
        if (state.status === "printing") {
            sendCommand("M25");
            dispatch({ type: ACTIONS.SET_STATUS, payload: "paused" });
        }
        else if (state.status === "paused") {
            sendCommand("M24");
            dispatch({ type: ACTIONS.SET_STATUS, payload: "printing" });
        }
    }

    var disabled = !state.fileName || !state.printerName;

    /* Send command to get status every 2 sec*/
    useEffect(() => {
        if (state.printerName) {
            sendCommand("M27 S2");
        }
    }, [state.printerName]);

    useEffect(() => {
    }, [state.status]);

    return (
        <div className="menu-status">
            <h2>Status</h2>

            { /* status text */}
            <div className="status-text">
                <p>Printer: {state.printerName}</p>
                <p>File: {state.fileName}</p>
                <p>Status: {state.status}</p>
            </div>

            { /* progress bar */}
            <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${state.progress}%` }}></div>
            </div>

            { /* buttons */}
            <div className="status-buttons">
                <button onClick={startPrinting}
                    disabled={disabled || state.status !== "idle"}>
                    Start
                </button>
                <button onClick={pausePrinting}
                    disabled={disabled || (state.status !== "paused" && state.status !== "printing")}>
                    {state.status === "printing" ? "Pause" : "Resume"}
                </button>
                <button onClick={stopPrinting}
                    disabled={disabled || state.status === "idle"}>
                    Stop
                </button>
            </div>

        </div>
    );
}

export default Status;