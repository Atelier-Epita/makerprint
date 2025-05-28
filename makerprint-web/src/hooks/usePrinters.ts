import { useEffect, useState } from 'react';
import { fetchPrinters } from '@/api/printers';

export function usePrinters() {
    const [printers, setPrinters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPrinters = async () => {
        try {
            const res = await fetchPrinters();
            const data = res.data;

            if (Array.isArray(data)) {
                setPrinters(data);
            } else if (Array.isArray(data.printers)) {
                setPrinters(data.printers);
            } else if (typeof data === 'object' && data !== null && Object.keys(data).length > 0) {
                setPrinters(Object.values(data));
            } else {
                console.error("Format de données inattendu :", data);
                throw new Error("Données d'imprimantes invalides");
            }
        } catch (err: any) {
            setError(err.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPrinters();
    }, []);

    return { printers, loading, error, refreshPrinters: loadPrinters};
}
