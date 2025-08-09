import React from 'react';
import {
    X,
    Play,
    Pause,
    ArrowUp,
    ArrowDown,
    Clock,
    File,
    Filter,
    Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface PrintQueueProps {
    queue: QueueItem[];
    availableTags: string[];
    activeTagFilter: string[];
    onStartPrint?: (queueId: string) => Promise<void>;
    onPausePrint?: (queueId: string) => Promise<void>;
    onCancelPrint?: (queueId: string) => Promise<void>;
    onRemoveFromQueue: (queueId: string) => Promise<void>;
    onReorderQueue?: (queueId: string, direction: 'up' | 'down') => Promise<void>;
    onClearQueue?: (tagFilter?: string[]) => Promise<void>;
    onApplyTagFilter: (tags: string[]) => Promise<void>;
    onClearTagFilter: () => Promise<void>;
    onMarkFailed?: (queueId: string) => Promise<void>;
    onMarkSuccessful?: (queueId: string) => Promise<void>;
    onRetryItem?: (queueId: string) => Promise<void>;
    loading?: boolean;
}

const PrintQueue: React.FC<PrintQueueProps> = ({
    queue,
    availableTags,
    activeTagFilter,
    onStartPrint,
    onRemoveFromQueue,
    onReorderQueue,
    onClearQueue,
    onApplyTagFilter,
    onClearTagFilter,
    onMarkFailed,
    onMarkSuccessful,
    onRetryItem,
    loading = false
}) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const handleStartPrint = async (queueId: string) => {
        if (onStartPrint) {
            try {
                await onStartPrint(queueId);
            } catch (error) {
                console.error('Failed to start print:', error);
            }
        }
    };

    const handleRemoveFromQueue = async (queueId: string) => {
        try {
            await onRemoveFromQueue(queueId);
        } catch (error) {
            console.error('Failed to remove from queue:', error);
        }
    };

    const handleReorderQueue = async (queueId: string, direction: 'up' | 'down') => {
        if (onReorderQueue) {
            try {
                await onReorderQueue(queueId, direction);
            } catch (error) {
                console.error('Failed to reorder queue:', error);
            }
        }
    };

    const handleClearTagFilter = async () => {
        await onClearTagFilter();
    };

    const handleTagSelect = async (tag: string) => {
        let newSelectedTags: string[];
        if (activeTagFilter.includes(tag)) {
            newSelectedTags = activeTagFilter.filter(t => t !== tag);
        } else {
            newSelectedTags = [...activeTagFilter, tag];
        }
        await onApplyTagFilter(newSelectedTags);
    };

    const handleRetryItem = async (queueId: string) => {
        if (onRetryItem) {
            try {
                await onRetryItem(queueId);
            } catch (error) {
                console.error('Failed to retry item:', error);
            }
        }
    };

    const handleMarkFailed = async (queueId: string) => {
        if (onMarkFailed) {
            try {
                await onMarkFailed(queueId);
            } catch (error) {
                console.error('Failed to mark as failed:', error);
            }
        }
    };

    const handleMarkSuccessful = async (queueId: string) => {
        if (onMarkSuccessful) {
            try {
                await onMarkSuccessful(queueId);
            } catch (error) {
                console.error('Failed to mark as successful:', error);
            }
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Print Queue</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="text-sm text-gray-500">Loading queue...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Print Queue</span>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{queue.length} items</Badge>
                        {activeTagFilter.length > 0 && (
                            <Badge variant="secondary">
                                Filtered by: {activeTagFilter.join(', ')}
                            </Badge>
                        )}
                    </div>
                </CardTitle>
                
                {/* Tag Filter Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm font-medium">Filter by tags:</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => (
                            <Badge 
                                key={tag} 
                                variant={activeTagFilter.includes(tag) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => handleTagSelect(tag)}
                            >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    
                    {activeTagFilter.length > 0 && (
                        <div className="flex gap-2">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleClearTagFilter}
                            >
                                Clear Filter
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {queue.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <File className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Print Queue is Empty</h3>
                        <p className="text-sm mb-4">
                            {activeTagFilter.length > 0 
                                ? `No items found with tags: ${activeTagFilter.join(', ')}`
                                : 'Add files to the queue to start printing'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {queue.map((item, index) => (
                            <div
                                key={item.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg hover:bg-gray-50 transition-all duration-300"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2 mb-1">
                                        <File className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium text-sm break-words">{item.file_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <Badge 
                                                variant={
                                                    item.status === 'todo' ? 'outline' :
                                                    item.status === 'printing' ? 'default' :
                                                    item.status === 'finished' ? 'secondary' :
                                                    item.status === 'success' ? 'success' :
                                                    item.status === 'failed' ? 'destructive' :
                                                    'destructive'
                                                }
                                                className={`text-xs ${
                                                    item.status === 'finished' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                                    item.status === 'success' ? 'bg-green-100 text-green-800 border-green-300' :
                                                    ''
                                                }`}
                                            >
                                                {item.status}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                #{index + 1}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    {item.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-1">
                                            {item.tags.map((tag) => (
                                                <Badge key={tag} variant="outline" className="text-xs">
                                                    <Tag className="h-2 w-2 mr-1" />
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                    
                                    <div className="text-xs text-gray-500 space-y-1">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Added: {formatDate(item.added_at)}
                                        </div>
                                        {item.printer_name && (
                                            <div className="flex items-center gap-1">
                                                <span>Printer: {item.printer_name}</span>
                                            </div>
                                        )}
                                        {item.started_at && (
                                            <div className="flex items-center gap-1">
                                                <span>Started: {formatDate(item.started_at)}</span>
                                            </div>
                                        )}
                                        {item.finished_at && (
                                            <div className="flex items-center gap-1">
                                                <span>Finished: {formatDate(item.finished_at)}</span>
                                            </div>
                                        )}
                                        {item.error_message && (
                                            <div className="flex items-center gap-1 text-red-600">
                                                <span>Error: {item.error_message}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-1 w-full sm:w-auto">
                                    {/* Status action buttons based on item status */}
                                    {item.status === 'todo' && onStartPrint && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleStartPrint(item.id)}
                                            className="h-8 px-3 text-sm sm:h-8 sm:px-3 sm:text-sm"
                                            title="Start print"
                                        >
                                            <Play className="h-4 w-4 mr-1" />
                                            Start
                                        </Button>
                                    )}

                                    {/* Finished items need validation */}
                                    {item.status === 'finished' && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleMarkSuccessful(item.id)}
                                                className="h-8 px-3 text-sm sm:h-8 sm:px-3 sm:text-sm text-green-600 hover:text-green-700"
                                                title="Mark as successful and remove"
                                            >
                                                ✓ Success
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleMarkFailed(item.id)}
                                                className="h-8 px-3 text-sm sm:h-8 sm:px-3 sm:text-sm text-red-600 hover:text-red-700"
                                                title="Mark as failed"
                                            >
                                                ✗ Failed
                                            </Button>
                                        </>
                                    )}

                                    {/* Printing items can be manually marked */}
                                    {item.status === 'printing' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleMarkFailed(item.id)}
                                            className="h-8 px-3 text-sm sm:h-8 sm:px-3 sm:text-sm text-red-600 hover:text-red-700"
                                            title="Mark as failed"
                                        >
                                            ✗ Failed
                                        </Button>
                                    )}

                                    {/* Failed items can be retried */}
                                    {item.status === 'failed' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRetryItem(item.id)}
                                            className="h-8 px-3 text-sm sm:h-8 sm:px-3 sm:text-sm text-orange-600 hover:text-orange-700"
                                            title="Retry print"
                                        >
                                            <Play className="h-4 w-4 mr-1" />
                                            Retry
                                        </Button>
                                    )}

                                    {/* Reorder buttons */}
                                    {onReorderQueue && (
                                        <div className="flex gap-0.5 sm:gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={index === 0}
                                                onClick={() => handleReorderQueue(item.id, 'up')}
                                                className="h-8 w-8 p-0 sm:h-8 sm:w-8"
                                                title="Move up"
                                            >
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={index === queue.length - 1}
                                                onClick={() => handleReorderQueue(item.id, 'down')}
                                                className="h-8 w-8 p-0 sm:h-8 sm:w-8"
                                                title="Move down"
                                            >
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={item.status === 'printing'}
                                        onClick={() => handleRemoveFromQueue(item.id)}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 sm:h-8 sm:w-8"
                                        title="Remove from queue"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PrintQueue;
