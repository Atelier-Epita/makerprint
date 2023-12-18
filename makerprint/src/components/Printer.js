import React, { useCallback } from 'react';
import { useUserContext, ACTIONS } from '../UserContext';

function Printers({ printers }) {

    const [state, dispatch] = useUserContext();

    const onClick = useCallback((name) => {
        dispatch({ type: ACTIONS.SET_PRINTER_NAME, payload: name });
    }
    , [dispatch]);

    return (
        <div className="menu-printers">
            <h3>Printers</h3>
            Found {printers.length} printers
            {printers.map((printer, index) => (
                <button key={index} type="button" onClick={() => onClick(printer)}>
                    {printer}
                </button>
            ))}
        </div>
    );
}

export default Printers;
