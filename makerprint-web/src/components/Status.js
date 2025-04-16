import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { ACTIONS, useUserContext } from '../UserContext';

function Status() {
    const [state, dispatch] = useUserContext();

    const getStatus = () => {
        if (!state.printerName) return null;
        axios.get(
            `${process.env.REACT_APP_API_URL}/printers/${state.printerName}/`
        )
            .then((res) => {
                if (res.status === 200) {
                    const status = res.data.status;
                }
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
                if (res.status === 200) {
                    dispatch({ type: ACTIONS.SET_STATUS, payload: "printing" });
                }
                else {
                    console.log(res);
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


    const pausePrinting = () => {
        if (state.status === "printing") {
            axios.post(
                `${process.env.REACT_APP_API_URL}/printers/${state.printerName}/pause/`,
            )
                .then((res) => {
                    if (res.status === 200) {
                        dispatch({ type: ACTIONS.SET_STATUS, payload: "paused" });
                    }
                    else {
                        console.log(res);
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        }
        else if (state.status === "paused") {
            axios.post(
                `${process.env.REACT_APP_API_URL}/printers/${state.printerName}/resume/`,
            )
                .then((res) => {
                    if (res.status === 200) {
                        dispatch({ type: ACTIONS.SET_STATUS, payload: "printing" });
                    }
                    else {
                        console.log(res);
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }

    const stopPrinting = () => {
        axios.post(
            `${process.env.REACT_APP_API_URL}/printers/${state.printerName}/stop/`,
        )
            .then((res) => {
                if (res.status === 200) {
                    dispatch({ type: ACTIONS.SET_STATUS, payload: "idle" });
                }
                else {
                    console.log(res);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    }

    var disabled = !state.fileName || !state.printerName;

    // /* Get status every 2 sec*/
    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         if (!state.printerName) return null;
    //         getStatus();
    //     }, 2000);
    //     return () => clearInterval(interval);
    // }, [state.printerName]);

    useEffect(() => {
    }, [state.status]);

    // console.log("Status: ", state.status);
    // console.log("Progress: ", state.progress);

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