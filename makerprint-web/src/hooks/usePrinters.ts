import { useEffect, useState } from 'react';
import { fetchPrinters } from '@/api/printers';
import { Printer } from '@/data/printers';

export function usePrinters() {
    const [printers, setPrinters] = useState<Printer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPrinters = async () => {
        try {
            const res = await fetchPrinters();
            const data = res.data;

            let printersData = [];

            if (Array.isArray(data)) {
                printersData = data;
            } else if (Array.isArray(data.printers)) {
                printersData = data.printers;
            } else if (typeof data === 'object' && data !== null) {
                printersData = Object.values(data);
            } else {
                console.error("Format de données inattendu :", data);
                throw new Error("Données d'imprimantes invalides");
            }

            // Add computed displayName field for each printer
            const enrichedPrinters = printersData.map(printer => ({
                ...printer,
                displayName: printer.display_name || printer.name
            }));

            setPrinters(enrichedPrinters);
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
