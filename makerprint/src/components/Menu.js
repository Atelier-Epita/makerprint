import React from 'react';
import axios from 'axios';
import { useUserContext, ACTIONS} from '../UserContext';
import Printers from './Printer';
import Files from './File';

const API_URL = 'http://10.69.88.6:5000';

function Menu() {
    const [state, dispatch] = useUserContext();

    const onRefresh = () => {
        axios.get(`${API_URL}/printer/list`)
            .then((res) => {
                dispatch({ type: ACTIONS.SET_PRINTERS, payload: res.data });
            })

        axios.get(`${API_URL}/file/list`)
            .then((res) => {
                dispatch({ type: ACTIONS.SET_FILES, payload: res.data });
            })
    }

    return (
        <div className="menu-left-bar">
            <h1>MakerPrint</h1>
            <img src="logo.png" alt="MakerPrint Logo" />

            <Printers printers={state.printers} />
            <Files files={state.files} />

            <div className="menu-refresh">
                <button type="button" onClick={onRefresh}>
                    Refresh
                </button>
            </div>
        </div>
    );
}

export default Menu;