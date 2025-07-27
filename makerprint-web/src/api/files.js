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
    const encodedPath = encodeURIComponent(filePath);
    return axios.delete(`${API_URL}/files/${encodedPath}`);
};

export const renameFileOrFolder = (filePath, newName) => {
    const encodedPath = encodeURIComponent(filePath);
    return axios.put(`${API_URL}/files/${encodedPath}/rename/`, { new_name: newName });
};

export const moveFileOrFolder = (filePath, newFolderPath) => {
    const encodedPath = encodeURIComponent(filePath);
    return axios.put(`${API_URL}/files/${encodedPath}/move/`, { new_folder_path: newFolderPath });
};

// Queue API

export const fetchQueue = (tags = null) => {
    const params = tags ? { tags: tags.join(',') } : {};
    return axios.get(`${API_URL}/queue/`, { params }).then((res) => res.data);
};

export const fetchQueueTags = () => {
    return axios.get(`${API_URL}/queue/tags/`).then((res) => res.data);
};

export const addToQueue = (filePath, tags = []) => {
    return axios.post(`${API_URL}/queue/`, { file_path: filePath, tags });
};

export const removeFromQueue = (queueItemId) => {
    return axios.delete(`${API_URL}/queue/${queueItemId}`);
};

export const reorderQueue = (itemIds) => {
    return axios.put(`${API_URL}/queue/reorder/`, { item_ids: itemIds });
};

export const clearQueue = (tags = null) => {
    const params = tags ? { tags: tags.join(',') } : {};
    return axios.delete(`${API_URL}/queue/`, { params });
};

export const markQueueItemFinished = (queueItemId) => {
    return axios.post(`${API_URL}/queue/${queueItemId}/mark_finished/`);
};

export const markQueueItemFailed = (queueItemId, errorMessage = null) => {
    const data = errorMessage ? { error_message: errorMessage } : {};
    return axios.post(`${API_URL}/queue/${queueItemId}/mark_failed/`, data);
};

export const markQueueItemSuccessful = (queueItemId) => {
    return axios.post(`${API_URL}/queue/${queueItemId}/mark_successful/`);
};

export const retryQueueItem = (queueItemId) => {
    return axios.post(`${API_URL}/queue/${queueItemId}/retry/`);
};

