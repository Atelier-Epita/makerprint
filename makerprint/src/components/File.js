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

function Files({ files }) {
    let files_array = [];
    for (let key in files) {
        files_array.push(files[key]);
    }

    const file_objects = files_array.map((file, index) => {
        return <File key={index} name={file} />;
    });

    return (
        <div className="menu-files">
            <h3>Files</h3>
            Found {files.length} files
            {file_objects}
        </div>
    );
}


function UploadFile({ name }) {
    // TODO
}

export default Files;