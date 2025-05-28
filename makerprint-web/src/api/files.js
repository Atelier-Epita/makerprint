import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

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

