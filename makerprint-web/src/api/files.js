import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const uploadFiles = async (files, folderPath = '') => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('folder_path', folderPath);
    
    return axios.post(`${API_URL}/files/upload/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const fetchFileTree = () => {
    return axios.get(`${API_URL}/files/tree/`).then((res) => res.data);
};

export const fetchFilesFlat = () => {
    return axios.get(`${API_URL}/files/list/`).then((res) => res.data);
};

export const createFolder = (folderPath) => {
    return axios.post(`${API_URL}/files/folder/`, { folder_path: folderPath });
};

export const deleteFileOrFolder = (filePath) => {
    return axios.delete(`${API_URL}/files/${filePath}`);
};

export const renameFileOrFolder = (filePath, newName) => {
    return axios.put(`${API_URL}/files/${filePath}/rename/`, { new_name: newName });
};

// ========== PRINT QUEUE ==========

export const fetchPrintQueue = (printerName) => {
    return axios.get(`${API_URL}/printers/${printerName}/queue/`).then((res) => res.data);
};

export const addToQueue = (printerName, filePath) => {
    return axios.post(`${API_URL}/printers/${printerName}/queue/`, { file_path: filePath });
};

export const removeFromQueue = (printerName, queueItemId) => {
    return axios.delete(`${API_URL}/printers/${printerName}/queue/${queueItemId}`);
};

export const reorderQueue = (printerName, itemIds) => {
    return axios.put(`${API_URL}/printers/${printerName}/queue/reorder/`, { item_ids: itemIds });
};

export const clearQueue = (printerName) => {
    return axios.delete(`${API_URL}/printers/${printerName}/queue/`);
};

// legacy

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API_URL}/file/upload/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const fetchFiles = () => {
    return axios.get(`${API_URL}/file/list/`).then((res) => res.data);
};

