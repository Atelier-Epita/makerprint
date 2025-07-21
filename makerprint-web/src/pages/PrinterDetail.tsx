import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePrinterStatus } from '../hooks/usePrinterStatus';
import { useFileManager } from '../hooks/useFileManager';
import { usePrintQueue } from '../hooks/usePrintQueue';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import {
    ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home, Play, Pause, CircleStop,
    Plug, RefreshCcw, Thermometer, File, BarChart2
} from 'lucide-react';
import FileExplorer from '../components/FileExplorer';
import PrintQueue from '../components/PrintQueue';
import { useToast } from '../hooks/use-toast';

interface PrinterDetailProps { }

const PrinterDetail: React.FC<PrinterDetailProps> = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    // State
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [command, setCommand] = useState('');

    // Hooks
    const { printer, loading, error, actions } = usePrinterStatus(name);
    const { start, stop, pauseOrResume, connect, disconnect, sendCommand, refreshStatus } = actions;
    const {
        fileTree,
        loading: filesLoading,
        uploadFiles,
        createFolder,
        deleteItem,
        renameItem,
        moveItem
    } = useFileManager();
    const {
        queue,
        availableTags,
        activeTagFilter,
        loading: queueLoading,
        addToQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        applyTagFilter,
        clearTagFilter,
        startPrint
    } = usePrintQueue();

    // Helper functions from original PrinterDetail
    const isMovementDisabled = printer?.status === 'printing' || printer?.status === 'disconnected';

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'printing': return 'bg-printer-printing';
            case 'idle': return 'bg-printer-idle';
            case 'error': return 'bg-printer-error';
            default: return 'bg-printer-disconnected';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'printing': return 'status-badge status-badge-printing';
            case 'idle': return 'status-badge status-badge-idle';
            case 'error': return 'status-badge status-badge-error';
            default: return 'status-badge status-badge-disconnected';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'printing': return 'Printing';
            case 'idle': return 'Idle';
            case 'error': return 'Error';
            default: return 'Disconnected';
        }
    };

    const getButtonVariant = (buttonType: 'start' | 'pause' | 'stop' | 'connect') => {
        const status = printer?.status;

        if (buttonType === 'start' && status === 'idle') {
            return 'default';
        }
        if (buttonType === 'pause' && (status === 'printing' || status === 'paused')) {
            return 'default';
        }
        if (buttonType === 'stop' && (status === 'printing' || status === 'paused')) {
            return 'destructive';
        }
        if (buttonType === 'connect' && (status === 'disconnected' || status === 'idle')) {
            return 'default';
        }
        return 'outline';
    };

    // Handlers
    const handleFileSelect = (filePath: string) => {
        console.log('File selected:', filePath);
        setSelectedFile(filePath);
    };

    const handleAddToQueue = (filePath: string) => {
        if (filePath.endsWith('.gcode')) {
            addToQueue(filePath, []);
            toast({
                title: 'Success',
                description: 'File added to print queue',
            });
        }
    };

    const handleAddSelectedToQueue = () => {
        if (selectedFile && selectedFile.endsWith('.gcode')) {
            addToQueue(selectedFile, []); // TODO: probably add tags here ?
            setSelectedFile(null);
            toast({
                title: 'Success',
                description: 'File added to print queue',
            });
        }
    };

    const handleMovement = (axis: string, direction: number, scale: number = 10) => {
        if (printer?.status === 'disconnected' || isMovementDisabled) {
            console.warn('Cannot move printer while disconnected or during print');
            return;
        }

        if (!['X', 'Y', 'Z'].includes(axis) || (direction !== 1 && direction !== -1)) {
            console.error('Invalid movement command');
            return;
        }

        const START_GCODE = 'G91'; // Set to relative positioning before movement
        const END_GCODE = 'G90'; // Set to absolute positioning after movement
        const command = `G0 ${axis}${direction > 0 ? '' : '-'}${scale}`;
        const commands = `${START_GCODE}; ${command}; ${END_GCODE};`;
        sendCommand(name, commands);
    };

    const handleHome = () => {
        const command = 'G28'; // G-code command to home all axes
        sendCommand(name, command);
    };

    const handleCommandSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim()) {
            console.warn('Command input is empty');
            return;
        }
        sendCommand(name, command.trim());
        setCommand('');
    };

    const handleStartPrint = async (queueItemId: string) => {
        if (!name) {
            console.error('Printer name is not available');
            return;
        }

        try {
            await startPrint(queueItemId, name);
            toast({
                title: 'Success',
                description: 'Print job started successfully',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to start print',
                variant: 'destructive',
            });
        }
    };

    // Error handling
    if (!name) {
        navigate('/');
        return null;
    };

    // Find the current printer
    // const printer = printers.find(p => p.id === id); // Already have printer from hook

    // Loading state
    if (error) {
        return (
            <div className="container py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Printer not found</h2>
                    <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
                </div>
            </div>
        );
    }

    if (!printer || loading) {
        return (
            <div className="container py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Loading Printer Details...</h2>
                    <p className="text-gray-500">Please wait while we fetch the printer status.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <div className="container py-6 max-w-5xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate('/')}
                            className="mr-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center">
                            <div className="flex items-center justify-center w-10 h-10 mr-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200">
                                <h1 className="text-xl font-bold text-white">
                                    {name?.charAt(0).toUpperCase()}
                                </h1>
                            </div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                                {name}
                            </h1>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300"
                        onClick={() => navigate('/')}
                    >
                        Back to Dashboard
                    </Button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Status Card - Left 2/3 */}
                    <Card className="xl:col-span-2 printer-card group border-0 shadow-md hover:shadow-xl transition-all duration-300">
                        {/* Status indicator strip at top */}
                        <div
                            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                            style={{
                                background: `hsl(${printer.status === 'printing' ? 'var(--printer-printing)' :
                                    printer.status === 'idle' ? 'var(--printer-idle)' :
                                        printer.status === 'error' ? 'var(--printer-error)' :
                                            'var(--printer-disconnected)'
                                    })`
                            }}
                        />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle>Status</CardTitle>
                                <span className={getStatusBadgeClass(printer.status)}>
                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(printer.status)} animate-pulse-subtle`} />
                                    <span>{getStatusText(printer.status)}</span>
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 mr-3">
                                                <File className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-medium text-muted-foreground">File</span>
                                        </div>
                                        <span className="text-sm font-semibold truncate max-w-[200px]">
                                            {printer.currentFile || 'No file selected'}
                                        </span>
                                    </div>

                                    {/* Nozzle Temperature Display */}
                                    <div className="flex flex-col p-3 rounded-lg bg-gray-50">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-orange-100 text-orange-600 mr-3">
                                                    <Thermometer className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">Nozzle</span>
                                            </div>
                                            <div className="flex items-baseline">
                                                <span className="text-lg font-bold">
                                                    {printer.nozzleTemp?.current || 0}°C
                                                </span>
                                                <span className="text-xs font-medium text-gray-500 ml-1">
                                                    / {printer.nozzleTemp?.target || 0}°C
                                                </span>
                                            </div>
                                        </div>
                                        {printer.nozzleTemp?.target > 0 && (
                                            <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                                                    style={{ width: `${Math.min(100, (printer.nozzleTemp.current / printer.nozzleTemp.target) * 100)}%` }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bed Temperature Display */}
                                    <div className="flex flex-col p-3 rounded-lg bg-gray-50">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-red-100 text-red-600 mr-3">
                                                    <Thermometer className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">Bed</span>
                                            </div>
                                            <div className="flex items-baseline">
                                                <span className="text-lg font-bold">
                                                    {printer.bedTemp?.current || 0}°C
                                                </span>
                                                <span className="text-xs font-medium text-gray-500 ml-1">
                                                    / {printer.bedTemp?.target || 0}°C
                                                </span>
                                            </div>
                                        </div>
                                        {printer.bedTemp?.target > 0 && (
                                            <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-red-400 to-rose-500 rounded-full"
                                                    style={{ width: `${Math.min(100, (printer.bedTemp.current / printer.bedTemp.target) * 100)}%` }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {printer.layerHeight > 0 && (
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-purple-100 text-purple-600 mr-3">
                                                    <BarChart2 className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">Layer height</span>
                                            </div>
                                            <span className="text-sm font-semibold">{printer.layerHeight}mm</span>
                                        </div>
                                    )}

                                    {printer.timeRemaining > 0 && (
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-green-100 text-green-600 mr-3">
                                                    <BarChart2 className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">Time Elapsed / Remaining</span>
                                            </div>
                                            <span className="text-sm font-semibold">
                                                {Math.floor(printer.timeElapsed / 3600) > 0
                                                    ? `${Math.floor(printer.timeElapsed / 3600)}h `
                                                    : ''}
                                                {Math.floor((printer.timeElapsed % 3600) / 60)}m{' '}
                                                {Math.floor(printer.timeElapsed % 60)}s /{' '}

                                                {Math.floor(printer.timeRemaining / 3600) > 0
                                                    ? `${Math.floor(printer.timeRemaining / 3600)}h `
                                                    : ''}
                                                {Math.floor((printer.timeRemaining % 3600) / 60)}m{' '}
                                                {Math.floor(printer.timeRemaining % 60)}s
                                            </span>
                                        </div>
                                    )}

                                    {printer.progress !== undefined && printer.progress > 0 && (
                                        <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-md bg-indigo-100 text-indigo-600 mr-3">
                                                        <BarChart2 className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-sm font-medium text-muted-foreground">Progress</span>
                                                </div>
                                                <span className="text-sm font-semibold">{printer.progress}%</span>
                                            </div>
                                            <div className="progress-container">
                                                <div
                                                    className="progress-printing"
                                                    style={{
                                                        width: `${printer.progress}%`,
                                                        background: `linear-gradient(90deg, hsl(${printer.status === 'printing' ? 'var(--printer-printing)' :
                                                            printer.status === 'idle' ? 'var(--printer-idle)' :
                                                                'var(--printer-disconnected)'
                                                            }), hsl(${printer.status === 'printing' ? 'var(--printer-printing)' :
                                                                printer.status === 'idle' ? 'var(--printer-idle)' :
                                                                    'var(--printer-disconnected)'
                                                            }) 70%)`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex gap-4 pt-4">
                                <Button
                                    className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                                    variant={getButtonVariant('start')}
                                    disabled={printer.status === 'printing' || printer.status === 'disconnected' || !selectedFile}
                                    onClick={() => start(selectedFile)}
                                >
                                    <Play className="mr-2 h-4 w-4" />
                                    Start
                                </Button>
                                <Button
                                    className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                                    variant={getButtonVariant('pause')}
                                    disabled={printer.status !== 'printing' && printer.status !== 'paused'}
                                    onClick={() => pauseOrResume()}
                                >
                                    {printer.status === 'printing' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                                    {printer.status === 'printing' ? 'Pause' : 'Resume'}
                                </Button>
                                <Button
                                    className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                                    variant={getButtonVariant('stop')}
                                    disabled={printer.status !== 'printing' && printer.status !== 'paused'}
                                    onClick={() => stop()}
                                >
                                    <CircleStop className="mr-2 h-4 w-4" />
                                    Stop
                                </Button>
                                <Button
                                    className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                                    variant={getButtonVariant('connect')}
                                    disabled={printer.status === 'printing' || printer.status === 'paused'}
                                    onClick={() => printer.status === 'disconnected' ? connect() : disconnect()}
                                >
                                    <Plug className="mr-2 h-4 w-4" />
                                    {printer.status === 'disconnected' ? 'Connect' : 'Disconnect'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Movement Controls - Right 1/3 */}
                    <Card className="printer-card group border-0 shadow-md hover:shadow-xl transition-all duration-300">
                        <CardHeader className="pb-2">
                            <CardTitle>Move</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Y+ Button (Top) */}
                                <div className="flex justify-center">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="w-16 h-16 aspect-square rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                                        onClick={() => handleMovement('Y', 1)}
                                        disabled={isMovementDisabled}
                                    >
                                        <ArrowUp className="h-8 w-8 text-purple-600" />
                                    </Button>
                                </div>

                                {/* X-/Home/X+ Row */}
                                <div className="flex justify-center items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="w-16 h-16 aspect-square rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                                        onClick={() => handleMovement('X', -1)}
                                        disabled={isMovementDisabled}
                                    >
                                        <ArrowLeft className="h-8 w-8 text-purple-600" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="w-16 h-16 aspect-square rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                                        onClick={handleHome}
                                        disabled={isMovementDisabled}
                                    >
                                        <Home className="h-8 w-8" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="w-16 h-16 aspect-square rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                                        onClick={() => handleMovement('X', 1)}
                                        disabled={isMovementDisabled}
                                    >
                                        <ArrowRight className="h-8 w-8 text-purple-600" />
                                    </Button>
                                </div>

                                {/* Y- Button (Bottom) */}
                                <div className="flex justify-center">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="w-16 h-16 aspect-square rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                                        onClick={() => handleMovement('Y', -1)}
                                        disabled={isMovementDisabled}
                                    >
                                        <ArrowDown className="h-8 w-8 text-purple-600" />
                                    </Button>
                                </div>
                            </div>

                            {/* Z+ and Z- buttons */}
                            <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
                                <Button
                                    variant="outline"
                                    className="h-14 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                                    onClick={() => handleMovement('Z', 1)}
                                    disabled={isMovementDisabled}
                                >
                                    <ArrowUp className="mr-2 h-5 w-5 text-purple-600" />
                                    <span className="font-semibold text-gray-700">Z+</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-14 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                                    onClick={() => handleMovement('Z', -1)}
                                    disabled={isMovementDisabled}
                                >
                                    <ArrowDown className="mr-2 h-5 w-5 text-purple-600" />
                                    <span className="font-semibold text-gray-700">Z-</span>
                                </Button>
                            </div>

                            {/* Command input */}
                            <form onSubmit={handleCommandSubmit} className="mt-4">
                                <Input
                                    value={command}
                                    onChange={(e) => setCommand(e.target.value)}
                                    placeholder="Enter a command"
                                    disabled={printer.status === 'disconnected' || isMovementDisabled}
                                    className="h-12 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 text-base"
                                />
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* File Selection Card */}
                {selectedFile && (
                    <Card className="mt-6 printer-card group border-0 shadow-md hover:shadow-xl transition-all duration-300">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-500">Selected File</div>
                                    <div className="font-medium">{selectedFile.split('/').pop()}</div>
                                </div>
                                <div className="space-x-2">
                                    <Button variant="outline" onClick={() => setSelectedFile(null)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleAddSelectedToQueue}>
                                        Add to Queue
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Files and Queue Tabs */}
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
                                    onFileSelect={handleFileSelect}
                                    onUpload={uploadFiles}
                                    onCreateFolder={createFolder}
                                    onDelete={deleteItem}
                                    onRename={renameItem}
                                    onMove={moveItem}
                                    onAddToQueue={handleAddToQueue}
                                    loading={filesLoading}
                                />
                            </TabsContent>

                            <TabsContent value="queue" className="space-y-4">
                                <PrintQueue
                                    queue={queue}
                                    availableTags={availableTags}
                                    activeTagFilter={activeTagFilter}
                                    onStartPrint={handleStartPrint}
                                    onRemoveFromQueue={removeFromQueue}
                                    onReorderQueue={reorderQueue}
                                    onClearQueue={clearQueue}
                                    onApplyTagFilter={applyTagFilter}
                                    onClearTagFilter={clearTagFilter}
                                    loading={queueLoading}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <footer className="mt-12 mb-6 text-center">
                    <div className="w-24 h-1 mx-auto bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mb-4"></div>
                    <p className="text-sm text-gray-500">
                        MakerPrint - L'Atelier © 2025
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default PrinterDetail;
