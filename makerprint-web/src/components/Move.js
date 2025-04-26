import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { ACTIONS, useUserContext } from '../UserContext';

function Move() {
    const [state, dispatch] = useUserContext();
    const [formData, setFormData] = useState({
        command: '',
    });

    const sendCommand = (command) => {
        if (!state.printerName) return null;

        axios.post(
            `${process.env.REACT_APP_API_URL}/printers/${state.printerName}/command/`,
            {
                command: command,
            },
        )
            .then((res) => {
                dispatch({ type: ACTIONS.SET_ERROR, payload: [res.status, res.statusText] });
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!state.printerName) {
            console.error("Printer name is not set.");
            return;
        }
        if (!formData.command.trim()) {
            console.error("Command is empty.");
            return;
        }
        sendCommand(formData.command.trim());
        setFormData({ command: '' });
    }

    return (
        <div className="menu-move">
            <h2>Move</h2>
            <div className="menu-move-buttons">
                <button className="right-arrow" onClick={() => sendCommand("G1 X10")}></button>
                <button className="yup-arrow" onClick={() => sendCommand("G1 Y10")}></button>
                <button className="ydown-arrow" onClick={() => sendCommand("G1 Y-10")}></button>
                <button className="left-arrow" onClick={() => sendCommand("G1 X-10")}></button>
                <button className="zup-arrow" onClick={() => sendCommand("G1 Z10")}></button>
                <button className="zdown-arrow" onClick={() => sendCommand("G1 Z-10")}></button>
                <button className="home-button" onClick={() => sendCommand("G28")}></button>
            </div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="command"
                    onChange={handleChange}
                    value={formData.command}
                    placeholder="Enter a command"
                />
            </form>
        </div>
    );
}

export default Move;