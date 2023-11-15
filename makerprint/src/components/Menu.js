import React from 'react';
import Printer from './Printer';
import File from './File';
import { useUserContext } from '../UserContext';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function Menu() {
    const [state, dispatch] = useUserContext();
    let printers = state.printers ? state.printers : [];
    let files = state.files ? state.files : [];

    const printerCount = printers.length;
    const fileCount = files.length;

    printers = printers.map((printer, index) => {
        return <Printer key={index} name={printer} />;
    });

    files = files.map((file, index) => {
        return <File key={index} name={file} />;
    });

    const onRefresh = () => {
        axios.get(`${API_URL}/printer/list`)
        .then((res) => {
            dispatch({ type: 'SET_PRINTERS', payload: res.data });
        })

        axios.get(`${API_URL}/printer/files`)
        .then((res) => {
            dispatch({ type: 'SET_FILES', payload: res.data });
        })
    }

    return (
        <div className="menu-left-bar">
            <h1>MakerPrint</h1>
            <img src="logo.png" alt="MakerPrint Logo" />

            <div className="menu-printers">
                <h3>Printers</h3>
                Found {printerCount} printers
                {printers}
            </div>

            <div className="menu-files">
                <h3>Files</h3>
                Found {fileCount} files
                {files}
            </div>

            <div className="menu-refresh">
                <button type="button" onClick={onRefresh}>
                    Refresh
                </button>
            </div>
        </div>
    );
}

export default Menu;