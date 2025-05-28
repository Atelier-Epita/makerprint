import {
    uploadFile,
    fetchFiles
} from '@/api/files';
import { useEffect, useState } from 'react';

export function useFiles() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFiles = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchFiles();
            setFiles(res);
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la récupération des fichiers');
        } finally {
            setLoading(false);
        }
    };

    const upload = async (file: File) => {
        try {
            await uploadFile(file);
            setError(null);
            loadFiles();
        } catch (err: any) {
            setError(err.message || 'Erreur lors du téléchargement du fichier');
        }
    };

    useEffect(() => {
        loadFiles();
    }, []);

    return {
        files,
        loading,
        error,
        upload,
        refreshFiles: loadFiles
    };

}
