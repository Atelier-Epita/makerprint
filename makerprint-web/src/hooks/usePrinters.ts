import { useEffect, useState } from 'react';
import { fetchPrinters } from '@/api/printers';

export function usePrinters() {
    const [printers, setPrinters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPrinters = async () => {
            try {
                const res = await fetchPrinters();
                const data = res.data;

                if (Array.isArray(data)) {
                    setPrinters(data);
                } else if (Array.isArray(data.printers)) {
                    setPrinters(data.printers);
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

        loadPrinters();
    }, []);

    return { printers, loading, error };
}
