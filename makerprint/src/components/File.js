import React from 'react';

import { useUserContext, ACTIONS } from '../UserContext';

function File({ name }) {
    const [state, dispatch] = useUserContext();

    const onClick = (name) => {
        dispatch({ type: ACTIONS.SET_FILE_NAME, payload: name });
    }

    return (
        <button type="button" onClick={() => onClick(name)}>
            {name}
        </button>
    );
}

function UploadFile({ name }) {
    // TODO
}

export default File;