import React from 'react';
import { useUserContext, initialState } from '../UserContext';
import { useFileActions } from '../hooks/useFileActions';
import { PrintersList } from './PrintersList';
import { useNavigate } from 'react-router-dom';


function Menu() {
    const navigate = useNavigate();
    const onClick = (name) => {
        navigate(`/printer/${name}`);
    };

    return (
        <div className="menu">
            <PrintersList onClick={onClick} />
        </div>
    );
}

export default Menu;