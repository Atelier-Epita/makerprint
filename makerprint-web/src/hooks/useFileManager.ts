import { useState, useEffect } from 'react';
import {
    fetchFileTree,
    fetchFilesFlat,
    uploadFiles,
    createFolder,
    deleteFileOrFolder,
    renameFileOrFolder,
    moveFileOrFolder
} from '@/api/files';

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    size?: number;
    modified?: string;
    children?: FileNode[];
    tags?: string[];
}

interface File {
    name: string;
    path: string;
    type: string;
    size?: number;
    modified?: string;
    tags: string[];
}

export function useFileManager() {
    const [fileTree, setFileTree] = useState<FileNode | null>(null);
    const [filesFlat, setFilesFlat] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFileTree = async () => {
        try {
            setLoading(true);
            const tree = await fetchFileTree();
            setFileTree(tree);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load file tree');
        } finally {
            setLoading(false);
        }
    };

    const loadFilesFlat = async () => {
        try {
            setLoading(true);
            const files = await fetchFilesFlat();
            setFilesFlat(files);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load files');
        } finally {
            setLoading(false);
        }
    };

    const uploadFilesToFolder = async (files: globalThis.File[], folderPath: string = '') => {
        try {
            const response = await uploadFiles(files, folderPath);
            await loadFileTree();
            await loadFilesFlat();
            return response.data;
        } catch (err: any) {
            setError(err.message || 'Failed to upload files');
            throw err;
        }
    };

    const createNewFolder = async (folderPath: string) => {
        try {
            await createFolder(folderPath);
            await loadFileTree();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to create folder');
            throw err;
        }
    };

    const deleteItem = async (filePath: string) => {
        try {
            await deleteFileOrFolder(filePath);
            await loadFileTree();
            await loadFilesFlat();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to delete item');
            throw err;
        }
    };

    const renameItem = async (filePath: string, newName: string) => {
        try {
            await renameFileOrFolder(filePath, newName);
            await loadFileTree();
            await loadFilesFlat();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to rename item');
            throw err;
        }
    };

    const moveItem = async (filePath: string, newFolderPath: string) => {
        try {
            await moveFileOrFolder(filePath, newFolderPath);
            await loadFileTree();
            await loadFilesFlat();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to move item');
            throw err;
        }
    };

    const refresh = async () => {
        await Promise.all([loadFileTree(), loadFilesFlat()]);
    };

    useEffect(() => {
        refresh();
    }, []);

    return {
        fileTree,
        filesFlat,
        loading,
        error,
        uploadFiles: uploadFilesToFolder,
        createFolder: createNewFolder,
        deleteItem,
        renameItem,
        moveItem,
        refreshFiles: refresh
    };
}
