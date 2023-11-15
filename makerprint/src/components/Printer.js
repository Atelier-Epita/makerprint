import React from 'react';
import { useUserContext, ACTIONS } from '../UserContext';

function Printer({ name }) {
    const [state, dispatch] = useUserContext();

    const onClick = (dispatch, name) => {
        dispatch({ type: ACTIONS.SET_PRINTER_NAME, payload: name });
    };

    return (
        <div>
            <button type="button" onClick={() => onClick(dispatch, name)}>{name}</button>
        </div>
    );
}

export default Printer;
