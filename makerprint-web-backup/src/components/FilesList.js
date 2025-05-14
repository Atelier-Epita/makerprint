import React, { useRef } from 'react';
import styles from '../styles/FilesList.module.css';
import { useUserContext } from '../UserContext';
import { useFileActions } from '../hooks/useFileActions';

export default function FilesList() {
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
        <div className="files container">
            <h2>Files</h2>

            {files.length > 0 && (
                <div className="button_container vertical max_height">
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

            <div className="button_container">
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