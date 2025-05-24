import { useEffect, useState } from 'react';
import { fetchPrinterStatus } from '@/api/printers';

export function usePrinterStatus(printerName?: string) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!printerName) return;

        const loadStatus = async () => {
            try {
                const res = await fetchPrinterStatus(printerName);
                setStatus(res.data);
            } catch (err: any) {
                setError(err.message || 'Erreur inconnue');
            } finally {
                setLoading(false);
            }
        };

        loadStatus();
    }, [printerName]);

    return { status, loading, error };
}
