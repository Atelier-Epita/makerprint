import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import FileExplorer from '../FileExplorer';
import PrintQueue from '../PrintQueue';

interface FilesAndQueueTabsProps {
    fileTree: any;
    queue: any;
    availableTags: any;
    activeTagFilter: any;
    filesLoading: boolean;
    queueLoading: boolean;
    onFileSelect: (filePath: string) => void;
    onUpload: any;
    onCreateFolder: any;
    onDelete: any;
    onRename: any;
    onMove: any;
    onAddToQueue: (filePath: string) => void;
    onStartPrint: (queueItemId: string) => Promise<void>;
    onRemoveFromQueue: any;
    onReorderQueue: any;
    onClearQueue: any;
    onApplyTagFilter: any;
    onClearTagFilter: any;
    onMarkFinished?: (queueItemId: string) => Promise<void>;
    onMarkFailed?: (queueItemId: string) => Promise<void>;
    onMarkSuccessful?: (queueItemId: string) => Promise<void>;
    onRetryItem?: (queueItemId: string) => Promise<void>;
}

const FilesAndQueueTabs: React.FC<FilesAndQueueTabsProps> = ({
    fileTree,
    queue,
    availableTags,
    activeTagFilter,
    filesLoading,
    queueLoading,
    onFileSelect,
    onUpload,
    onCreateFolder,
    onDelete,
    onRename,
    onMove,
    onAddToQueue,
    onStartPrint,
    onRemoveFromQueue,
    onReorderQueue,
    onClearQueue,
    onApplyTagFilter,
    onClearTagFilter,
    onMarkFinished,
    onMarkFailed,
    onMarkSuccessful,
    onRetryItem
}) => {
    return (
        <Card className="mt-6 printer-card group border-0 shadow-md hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
                <CardTitle>Files & Print Queue</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="files" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="files">File Explorer</TabsTrigger>
                        <TabsTrigger value="queue">Print Queue</TabsTrigger>
                    </TabsList>

                    <TabsContent value="files" className="space-y-4">
                        <FileExplorer
                            fileTree={fileTree}
                            onFileSelect={onFileSelect}
                            onUpload={onUpload}
                            onCreateFolder={onCreateFolder}
                            onDelete={onDelete}
                            onRename={onRename}
                            onMove={onMove}
                            onAddToQueue={onAddToQueue}
                            loading={filesLoading}
                        />
                    </TabsContent>

                    <TabsContent value="queue" className="space-y-4">
                        <PrintQueue
                            queue={queue}
                            availableTags={availableTags}
                            activeTagFilter={activeTagFilter}
                            onStartPrint={onStartPrint}
                            onRemoveFromQueue={onRemoveFromQueue}
                            onReorderQueue={onReorderQueue}
                            onClearQueue={onClearQueue}
                            onApplyTagFilter={onApplyTagFilter}
                            onClearTagFilter={onClearTagFilter}
                            onMarkFinished={onMarkFinished}
                            onMarkFailed={onMarkFailed}
                            onMarkSuccessful={onMarkSuccessful}
                            onRetryItem={onRetryItem}
                            loading={queueLoading}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default FilesAndQueueTabs;
