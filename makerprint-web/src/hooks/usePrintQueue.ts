import { useState, useEffect } from 'react';
import {
    fetchSharedQueue,
    fetchQueueTags,
    addToSharedQueue,
    removeFromSharedQueue,
    reorderSharedQueue,
    clearSharedQueue
} from '@/api/files';

interface QueueItem {
    id: string;
    file_name: string;
    file_path: string;
    added_at: string;
    tags: string[];
}

export function usePrintQueue() {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [activeTagFilter, setActiveTagFilter] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadQueue = async (tagFilter?: string[]) => {
        try {
            setLoading(true);
            const queueData = await fetchSharedQueue(tagFilter);
            setQueue(queueData);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load shared queue');
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
            await addToSharedQueue(filePath, tags);
            await loadQueue(activeTagFilter.length > 0 ? activeTagFilter : undefined);
            await loadTags(); // Reload tags as new ones might have been added
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to add file to queue');
            throw err;
        }
    };

    const removeFileFromQueue = async (queueItemId: string) => {
        try {
            await removeFromSharedQueue(queueItemId);
            await loadQueue(activeTagFilter.length > 0 ? activeTagFilter : undefined);
            await loadTags(); // Reload tags as some might have been removed
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
            
            await reorderSharedQueue(newIds);
            await loadQueue(activeTagFilter.length > 0 ? activeTagFilter : undefined);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to reorder queue');
            throw err;
        }
    };

    const clearAllQueue = async (tagFilter?: string[]) => {
        try {
            await clearSharedQueue(tagFilter);
            await loadQueue(activeTagFilter.length > 0 ? activeTagFilter : undefined);
            await loadTags();
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to clear queue');
            throw err;
        }
    };

    const applyTagFilter = async (tags: string[]) => {
        setActiveTagFilter(tags);
        await loadQueue(tags.length > 0 ? tags : undefined);
    };

    const clearTagFilter = async () => {
        setActiveTagFilter([]);
        await loadQueue();
    };

    const startPrint = async (queueItemId: string) => {
        // This would typically call the printer API to start printing
        // For now, just remove from queue as it's "printing"
        try {
            console.log(`Starting print for queue item: ${queueItemId}`);
            // Could call printer start API here
        } catch (err: any) {
            setError(err.message || 'Failed to start print');
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
        refreshQueue: () => loadQueue(activeTagFilter.length > 0 ? activeTagFilter : undefined),
        refreshTags: loadTags
    };
}
