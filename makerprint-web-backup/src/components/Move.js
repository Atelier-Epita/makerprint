import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { ACTIONS, useUserContext } from '../UserContext';
import styles from '../styles/Move.module.css';
import { useParams } from 'react-router-dom';

function Move() {
    const [state, dispatch] = useUserContext();
    const [formData, setFormData] = useState({command: ''});
    const printer_name = useParams().name;

    const sendCommand = (command) => {
        if (!printer_name) return null;

        axios.post(
            `${process.env.REACT_APP_API_URL}/printers/${printer_name}/command/`,
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
        if (!formData.command.trim()) {
            console.error("Command is empty.");
            return;
        }
        sendCommand(formData.command.trim());
        setFormData({ command: '' });
    }

    return (
        <div className={styles.move}>
            <h2>Move</h2>
            <div className={styles.move_buttons}>
                <button className={styles.right_arrow} onClick={() => sendCommand("G1 X10")}></button>
                <button className={styles.yup_arrow} onClick={() => sendCommand("G1 Y10")}></button>
                <button className={styles.ydown_arrow} onClick={() => sendCommand("G1 Y-10")}></button>
                <button className={styles.left_arrow} onClick={() => sendCommand("G1 X-10")}></button>
                <button className={styles.zup_arrow} onClick={() => sendCommand("G1 Z10")}></button>
                <button className={styles.zdown_arrow} onClick={() => sendCommand("G1 Z-10")}></button>
                <button className={styles.home_button} onClick={() => sendCommand("G28")}></button>
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