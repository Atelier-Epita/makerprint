import { useUserContext, ACTIONS } from '../UserContext';
import { fetchFiles, uploadFile as uploadFileToServer } from '../api/files';

export function useFileActions() {
    const [, dispatch] = useUserContext();

    const refreshFiles = async () => {
        try {
            const files = await fetchFiles();
            dispatch({ type: ACTIONS.SET_FILES, payload: files });
        } catch (err) {
            dispatch({
                type: ACTIONS.SET_ERROR,
                payload: [err.code || err.name, err.message || err.code],
            });
        }
    };

    const uploadFile = async (file) => {
        try {
            const res = await uploadFileToServer(file);
            await refreshFiles();
            dispatch({
                type: ACTIONS.SET_ERROR,
                payload: [res.status, res.statusText],
            });
        } catch (err) {
            dispatch({
                type: ACTIONS.SET_ERROR,
                payload: [err.code || err.name, err.message || err.code],
            });
        }
    };

    const clearFileName = () => {
        dispatch({ type: ACTIONS.SET_FILE_NAME, payload: null });
    };

    const setFileName = (name) => {
        dispatch({ type: ACTIONS.SET_FILE_NAME, payload: name });
    };

    return { refreshFiles, uploadFile, clearFiles: clearFileName, setFileName };
}
