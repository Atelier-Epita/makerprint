import React, { useRef } from 'react';
import { useUserContext, initialState } from '../UserContext';
import { useFileActions } from '../hooks/useFileActions';
import { PrintersList } from './PrintersList';
import { useNavigate } from 'react-router-dom';


function FilesButton() {
    const [state] = useUserContext();
    const { uploadFile, setFileName } = useFileActions();
    const files = state.files;

    const onClick = (name) => {
        setFileName(name);
    };

    const hiddenFileInput = useRef(null);

    const handleClick = () => {
        hiddenFileInput.current.click();
    };

    const handleChange = (event) => {
        const selectedFiles = event.target.files;
        for (let i = 0; i < selectedFiles.length; i++) {
            uploadFile(selectedFiles[i]);
        }
    };

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