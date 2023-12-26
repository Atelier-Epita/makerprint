import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { useUserContext, ACTIONS } from '../UserContext';

function Error() {
    const [state, dispatch] = useUserContext();
    useEffect(() => {
        setTimeout(() => {
            dispatch({ type: ACTIONS.SET_ERROR, payload: null });
        }, 5000);
    }, [state.error, dispatch]);
    if (!state.error) return null;

    const [code, message] = state.error;
    if (code === 200) return null;

    return (
        <div className="error-container">
            <h2>{code}</h2>
            <p>{message}</p>
        </div>
    );
}

export default Error;