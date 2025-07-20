import { useState, useEffect } from 'react';
import {
    fetchPrintQueue,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue
} from '@/api/files';

interface QueueItem {
    id: string;
    file_name: string;
    file_path: string;
    added_at: string;
}

export function usePrintQueue(printerName: string) {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadQueue = async () => {
        if (!printerName) return;
        
        try {
            setLoading(true);
            const queueData = await fetchPrintQueue(printerName);
            setQueue(queueData);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load print queue');
        } finally {
            setLoading(false);
        }
    };

    const addFileToQueue = async (filePath: string) => {
        try {
            await addToQueue(printerName, filePath);
            await loadQueue();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to add file to queue');
            throw err;
        }
    };

    const removeFileFromQueue = async (queueItemId: string) => {
        try {
            await removeFromQueue(printerName, queueItemId);
            await loadQueue();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to remove file from queue');
            throw err;
        }
    };

    const reorderQueueItems = async (queueItemId: string, direction: 'up' | 'down') => {
        try {
            // Get current queue order
            const currentIds = queue.map(item => item.id);
            const currentIndex = currentIds.indexOf(queueItemId);
            
            if (currentIndex === -1) return;
            
            let newIndex: number;
            if (direction === 'up' && currentIndex > 0) {
                newIndex = currentIndex - 1;
            } else if (direction === 'down' && currentIndex < currentIds.length - 1) {
                newIndex = currentIndex + 1;
            } else {
                return; // Can't move further
            }
            
            // Swap items
            const newIds = [...currentIds];
            [newIds[currentIndex], newIds[newIndex]] = [newIds[newIndex], newIds[currentIndex]];
            
            await reorderQueue(printerName, newIds);
            await loadQueue();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to reorder queue');
            throw err;
        }
    };

    const clearAllQueue = async () => {
        try {
            await clearQueue(printerName);
            await loadQueue();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to clear queue');
            throw err;
        }
    };

    const startPrint = async (queueItemId: string) => {
        // This would typically call the printer API to start printing
        // For now, just remove from queue as it's "printing"
        try {
            // Could call printer start API here
            console.log(`Starting print for queue item: ${queueItemId}`);
        } catch (err: any) {
            setError(err.message || 'Failed to start print');
            throw err;
        }
    };

    const pausePrint = async (queueItemId: string) => {
        try {
            console.log(`Pausing print for queue item: ${queueItemId}`);
        } catch (err: any) {
            setError(err.message || 'Failed to pause print');
            throw err;
        }
    };

    const cancelPrint = async (queueItemId: string) => {
        try {
            console.log(`Cancelling print for queue item: ${queueItemId}`);
        } catch (err: any) {
            setError(err.message || 'Failed to cancel print');
            throw err;
        }
    };

    useEffect(() => {
        loadQueue();
    }, [printerName]);

    return {
        queue,
        loading,
        error,
        addToQueue: addFileToQueue,
        removeFromQueue: removeFileFromQueue,
        reorderQueue: reorderQueueItems,
        clearQueue: clearAllQueue,
        startPrint,
        pausePrint,
        cancelPrint,
        refreshQueue: loadQueue
    };
}
