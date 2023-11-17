import React from 'react';
import { useUserContext, ACTIONS } from '../UserContext';

function Printer({ name }) {
    const [state, dispatch] = useUserContext();

    const onClick = (name) => {
        dispatch({ type: ACTIONS.SET_PRINTER_NAME, payload: name });
    };

    return (
        <button type="button" onClick={() => onClick(name)}>
            {name}
        </button>
    );
}

function Printers({ printers }) {
    let printers_array = [];
    for (let key in printers) {
        printers_array.push(printers[key]);
    }

    const printer_objects = printers_array.map((printer, index) => {
        return <Printer key={index} name={printer} />;
    });

    return (
        <div className="menu-printers">
            <h3>Printers</h3>
            Found {printers.length} printers
            {printer_objects}
        </div>
    );
}

export default Printers;
