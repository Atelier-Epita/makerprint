import React, { useEffect, useState } from 'react';
import { useUserContext } from '../UserContext';
import axios from 'axios';

const API_URL = 'http://localhost:5000';
const GCODE = {
    LIST_SD_CARD: 'M20',
    INIT_SD_CARD: 'M21',
    SELECT_SD_CARD: 'M23',
    START_PRINT: 'M24',
    STOP_PRINT: 'M25',
    BEGIN_WRITE: 'M28',
    END_WRITE: 'M29',
};

function ConsoleLog({ printerName }) {
    // TODO: websocket for console logs
    if (!printerName) return null;

    return (
        <div>
            <p> some console logs </p>
        </div>
    );
}

function Console() {
    const [state] = useUserContext();

    // handle form data
    const [formData, setFormData] = useState({
        command: '',
    });
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post(
            `${API_URL}/printer/command`,
            { command: formData.command, port: state.printerName }
        )
        .then((res) => {
            console.log(res);
        })
        .catch((err) => {
            console.log(err);
        });
    };

    // update console logs when switching printers
    useEffect(() => { }, [state.printerName]);

    return (
        <div className="console">
            <h3>Connected to {state.printerName}</h3>
            <div className="console-output">
                <h3>Console output</h3>
                <div className="console-output-container">
                    <ConsoleLog printerName={state.printerName} />
                </div>
            </div>
            <div className="console-input">
                <h3>Console input</h3>
                <div className="console-input-container">
                    <ConsoleLog printerName={state.printerName} />
                </div>
                <form onSubmit={handleSubmit}>
                    <input type="text" name="command" onChange={handleChange} />
                    <button type="submit">Send</button>
                </form>
            </div>
        </div>
    );
}

export default Console;
