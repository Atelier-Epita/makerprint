import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import FileExplorer from '../FileExplorer';
import PrintQueue from '../PrintQueue';
import { start } from 'repl';

interface FilesAndQueueTabsProps {
    fileTree: any;
    queue: any;
    availableTags: any;
    activeTagFilter: any;
    filesLoading: boolean;
    queueLoading: boolean;
    onUpload: any;
    onCreateFolder: any;
    onDelete: any;
    onRename: any;
    onMove: any;
    onAddToQueue: (filePath: string) => void;
    onPrintNow: (filePath: string) => Promise<void>;
    onStartPrint: (queueItemId: string) => Promise<void>;
    onRemoveFromQueue: any;
    onReorderQueue: any;
    onApplyTagFilter: any;
    onClearTagFilter: any;
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
    onUpload,
    onCreateFolder,
    onDelete,
    onRename,
    onMove,
    onAddToQueue,
    onPrintNow,
    onStartPrint,
    onRemoveFromQueue,
    onReorderQueue,
    onApplyTagFilter,
    onClearTagFilter,
    onMarkFailed,
    onMarkSuccessful,
    onRetryItem
}) => {
    return (
        <Card className="mt-6 printer-card group border-0 shadow-md hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
                <CardTitle>Print Management</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="queue" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="queue">Print Queue</TabsTrigger>
                        <TabsTrigger value="files">File Explorer</TabsTrigger>
                    </TabsList>

                    <TabsContent value="queue" className="space-y-4">
                        <PrintQueue
                            queue={queue}
                            availableTags={availableTags}
                            activeTagFilter={activeTagFilter}
                            onStartPrint={onStartPrint}
                            onRemoveFromQueue={onRemoveFromQueue}
                            onReorderQueue={onReorderQueue}
                            onApplyTagFilter={onApplyTagFilter}
                            onClearTagFilter={onClearTagFilter}
                            onMarkFailed={onMarkFailed}
                            onMarkSuccessful={onMarkSuccessful}
                            onRetryItem={onRetryItem}
                            loading={queueLoading}
                        />
                    </TabsContent>

                    <TabsContent value="files" className="space-y-4">
                        <FileExplorer
                            fileTree={fileTree}
                            onUpload={onUpload}
                            onCreateFolder={onCreateFolder}
                            onDelete={onDelete}
                            onRename={onRename}
                            onMove={onMove}
                            onAddToQueue={onAddToQueue}
                            onPrintNow={onPrintNow}
                            loading={filesLoading}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default FilesAndQueueTabs;
