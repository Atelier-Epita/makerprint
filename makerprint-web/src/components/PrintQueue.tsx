import React, { useState } from 'react';
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
    loading = false
}) => {
    const [selectedTags, setSelectedTags] = useState<string[]>(activeTagFilter);

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

    const handleApplyTagFilter = async () => {
        await onApplyTagFilter(selectedTags);
    };

    const handleClearTagFilter = async () => {
        setSelectedTags([]);
        await onClearTagFilter();
    };

    const handleTagSelect = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleClearSelected = async () => {
        if (onClearQueue && activeTagFilter.length > 0) {
            await onClearQueue(activeTagFilter);
        } else if (onClearQueue) {
            await onClearQueue();
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
                                variant={selectedTags.includes(tag) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => handleTagSelect(tag)}
                            >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    
                    <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            onClick={handleApplyTagFilter}
                            disabled={selectedTags.length === 0}
                        >
                            Apply Filter
                        </Button>
                        {activeTagFilter.length > 0 && (
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleClearTagFilter}
                            >
                                Clear Filter
                            </Button>
                        )}
                        {queue.length > 0 && (
                            <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={handleClearSelected}
                            >
                                Clear {activeTagFilter.length > 0 ? 'Filtered' : 'All'}
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {queue.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <File className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-sm">
                            {activeTagFilter.length > 0 
                                ? `No items found with tags: ${activeTagFilter.join(', ')}`
                                : 'No items in queue'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {queue.map((item, index) => (
                            <div
                                key={item.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg hover:bg-gray-50"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2 mb-1">
                                        <File className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium text-sm break-words">{item.file_name}</span>
                                        </div>
                                        <Badge variant="secondary" className="shrink-0 ml-2">
                                            #{index + 1}
                                        </Badge>
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
                                    
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Added: {formatDate(item.added_at)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-1 w-full sm:w-auto">
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

                                    <div className="flex gap-0.5 sm:gap-1">
                                        {/* Print action buttons */}
                                        {onStartPrint && (
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

                                        {/* Remove button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveFromQueue(item.id)}
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 sm:h-8 sm:w-8"
                                            title="Remove from queue"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
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
