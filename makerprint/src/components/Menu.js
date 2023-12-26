import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useUserContext, ACTIONS } from '../UserContext';

function FilesButton() {
    const [state, dispatch] = useUserContext();
    const files = state.files;

    const onClick = useCallback(
        (name) => {
            dispatch({ type: ACTIONS.SET_FILE_NAME, payload: name });
        }
        , [dispatch]
    );

    const refreshFiles = () => {
        axios.get(`${process.env.REACT_APP_API_URL}/file/list`)
            .then((res) => {
                dispatch({ type: ACTIONS.SET_FILES, payload: res.data });
            })
    }

    const uploadFile = (file) => {
        const formData = new FormData();
        formData.append('file', file);

        axios.post(`${process.env.REACT_APP_API_URL}/file/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then((res) => {
                refreshFiles();
                const code = res.status;
                const message = res.statusText;
                dispatch({ type: ACTIONS.SET_ERROR, payload: [code, message] });
            })
            .catch((err) => {
                // todo catch errors and display them
                console.log(err);
            });
    };

    const hiddenFileInput = useRef(null);

    const handleClick = event => {
        hiddenFileInput.current.click();
    }

    const handleChange = event => {
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            uploadFile(files[i]);
        }
    }

    return (
        <div className="menu-files">
            <h3>Files</h3>

            {files.length > 0 && (
                <div className="menu-files-list">
                    {files.map((file, index) => (
                        <button key={index} type="button"
                            onClick={() => onClick(file)}
                            disabled={state.fileName !== null && state.fileName !== file}
                        >
                            {file}
                        </button>
                    ))}
                </div>)
            }

            <div className="menu-files-upload">
                <button onClick={handleClick}>
                    Upload a file
                </button>
                <input
                    type="file"
                    ref={hiddenFileInput}
                    onChange={handleChange}
                    accept=".gcode"
                    style={{ display: 'none' }}
                    multiple
                />
            </div>
        </div>
    );
}

function PrintersButton() {
    const [state, dispatch] = useUserContext();
    const printers = state.printers;

    const onClick = useCallback(
        (name) => {
            dispatch({ type: ACTIONS.SET_PRINTER_NAME, payload: name });
        }
        , [dispatch]
    );

    return (
        <div className="menu-printers">
            <h3>Printers</h3>
            Found {printers.length} printers
            {printers.map((printer, index) => (
                <button key={index} type="button"
                    onClick={() => onClick(printer)}
                    disabled={state.printerName !== null && state.printerName !== printer}
                >
                    {printer}
                </button>
            ))}
        </div>
    );
}


function Menu() {
    const [state, dispatch] = useUserContext();

    const onRefresh = () => {
        axios.get(`${process.env.REACT_APP_API_URL}/printer/list`)
            .then((res) => {
                dispatch({ type: ACTIONS.SET_PRINTERS, payload: res.data });
            })

        axios.get(`${process.env.REACT_APP_API_URL}/file/list`)
            .then((res) => {
                dispatch({ type: ACTIONS.SET_FILES, payload: res.data });
            })
    }

    const onClear = () => {
        dispatch({ type: ACTIONS.SET_PRINTER_NAME, payload: null });
        dispatch({ type: ACTIONS.SET_FILE_NAME, payload: null });
        dispatch({ type: ACTIONS.SET_PROGRESS, payload: 0 });
        dispatch({ type: ACTIONS.SET_STATUS, payload: "idle" });
    }

    return (
        <div className="menu-left-bar">
            <h1>MakerPrint</h1>
            <img src="logo.png" alt="MakerPrint Logo" />

            <PrintersButton />
            <FilesButton />

            <div className="menu-refresh">
                <button type="button" onClick={onRefresh}> Refresh </button>
                <button type="button" onClick={onClear}> Clear </button>
            </div>
        </div>
    );
}

export default Menu;