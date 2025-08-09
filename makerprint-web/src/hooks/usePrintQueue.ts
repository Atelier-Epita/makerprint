import { useState, useEffect } from 'react';
import {
    fetchQueue,
    fetchQueueTags,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    markQueueItemFailed,
    markQueueItemSuccessful,
    retryQueueItem
} from '@/api/files';
import {
    startPrinter,
} from '@/api/printers';

interface QueueItem {
    id: string;
    file_name: string;
    file_path: string;
    added_at: string;
    tags: string[];
    status: string;  // todo, printing, finished, failed
    printer_name?: string;
    started_at?: string;
    finished_at?: string;
    error_message?: string;
}

export function usePrintQueue() {
    const [fullQueue, setFullQueue] = useState<QueueItem[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [activeTagFilter, setActiveTagFilter] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Computed property for filtered queue
    const queue = fullQueue.filter(item => {
        if (activeTagFilter.length === 0) return true;
        return activeTagFilter.some(tag => item.tags.includes(tag));
    });

    const loadQueue = async () => {
        try {
            setLoading(true);
            const queueData = await fetchQueue(); // Always load full queue
            setFullQueue(queueData);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load queue');
        } finally {
            setLoading(false);
        }
    };

    const loadTags = async () => {
        try {
            const tags = await fetchQueueTags();
            setAvailableTags(tags);
        } catch (err: any) {
            console.error('Failed to load tags:', err);
        }
    };

    const addFileToQueue = async (filePath: string, tags: string[] = []) => {
        try {
            const response = await addToQueue(filePath, tags);
            await loadQueue();
            await loadTags(); // Reload tags as new ones might have been added
            setError(null);
            return response;
        } catch (err: any) {
            setError(err.message || 'Failed to add file to queue');
            throw err;
        }
    };

    const removeFileFromQueue = async (queueItemId: string) => {
        const originalQueue = [...fullQueue];
        
        try {
            setFullQueue(prev => prev.filter(item => item.id !== queueItemId));
            
            await removeFromQueue(queueItemId);
            await loadTags();
            setError(null);
        } catch (err: any) {
            setFullQueue(originalQueue);
            setError(err.message || 'Failed to remove file from queue');
            throw err;
        }
    };

    const reorderQueueItems = async (queueItemId: string, direction: 'up' | 'down') => {
        const originalQueue = [...fullQueue];
        
        try {
            // Get current queue order
            const currentIds = fullQueue.map(item => item.id);
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
            
            const newQueue = [...fullQueue];
            [newQueue[currentIndex], newQueue[newIndex]] = [newQueue[newIndex], newQueue[currentIndex]];
            setFullQueue(newQueue);
            
            const newIds = newQueue.map(item => item.id);
            await reorderQueue(newIds);
            setError(null);
        } catch (err: any) {
            setFullQueue(originalQueue);
            setError(err.message || 'Failed to reorder queue');
            throw err;
        }
    };

    const clearAllQueue = async (tagFilter?: string[]) => {
        try {
            await clearQueue(tagFilter);
            await loadQueue();
            await loadTags();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to clear queue');
            throw err;
        }
    };

    const applyTagFilter = async (tags: string[]) => {
        setActiveTagFilter(tags);
    };

    const clearTagFilter = async () => {
        setActiveTagFilter([]);
    };

    const startPrint = async (queueItemId: string, printerName?: string) => {
        try {
            // refresh the queue if not found in local state
            let queueItem = fullQueue.find(item => item.id === queueItemId);
            if (!queueItem) {
                const freshQueueData = await fetchQueue();
                queueItem = freshQueueData.find(item => item.id === queueItemId);
                setFullQueue(freshQueueData);
            }
            
            if (!queueItem) {
                throw new Error('Queue item not found');
            }

            if (!printerName) {
                throw new Error('Printer name is required to start print');
            }

            await startPrinter(printerName, queueItemId);
        } catch (err: any) {
            setError(err.message || 'Failed to start print');
            throw err;
        }
    };

    const markItemFailed = async (queueItemId: string, errorMessage?: string) => {
        try {
            await markQueueItemFailed(queueItemId, errorMessage);
            await loadQueue();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to mark item as failed');
            throw err;
        }
    };

    const markItemSuccessful = async (queueItemId: string) => {
        try {
            await markQueueItemSuccessful(queueItemId);
            await loadQueue();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to mark item as successful');
            throw err;
        }
    };

    const retryItem = async (queueItemId: string) => {
        try {
            await retryQueueItem(queueItemId);
            await loadQueue();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to retry item');
            throw err;
        }
    };

    useEffect(() => {
        loadQueue();
        loadTags();
    }, []);

    return {
        queue,
        availableTags,
        activeTagFilter,
        loading,
        error,
        addToQueue: addFileToQueue,
        removeFromQueue: removeFileFromQueue,
        reorderQueue: reorderQueueItems,
        clearQueue: clearAllQueue,
        applyTagFilter,
        clearTagFilter,
        startPrint,
        markFailed: markItemFailed,
        markSuccessful: markItemSuccessful,
        retryItem,
        refreshQueue: () => loadQueue(),
        refreshTags: loadTags
    };
}
