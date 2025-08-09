import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePrinterStatus } from '../hooks/usePrinterStatus';
import { useFileManager } from '../hooks/useFileManager';
import { usePrintQueue } from '../hooks/usePrintQueue';
import { usePrinterHandlers } from '../hooks/usePrinterHandlers';
import { Button } from '../components/ui/button';
import PrinterHeader from '../components/printer/PrinterHeader';
import PrinterStatusCard from '../components/printer/PrinterStatusCard';
import MovementControls from '../components/printer/MovementControls';
import FilesAndQueueTabs from '../components/printer/FilesAndQueueTabs';
import { getStatusColor, getStatusBadgeClass, getStatusText, getButtonVariant } from '../utils/printerUtils';

interface PrinterDetailProps { }

const PrinterDetail: React.FC<PrinterDetailProps> = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();

    // Hooks
    const { printer, loading, error, actions } = usePrinterStatus(name);
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
        startPrint,
        markFailed,
        markSuccessful,
        retryItem
    } = usePrintQueue();

    // Custom handlers hook
    const {
        command,
        setCommand,
        handleAddToQueue,
        handlePrintNow,
        handleMovement,
        handleHome,
        handleCommandSubmit,
        handleStartPrint,
        handleStop,
        handlePauseOrResume,
        handleConnect,
        handleDisconnect,
    } = usePrinterHandlers(name, actions, addToQueue, startPrint);

    // Helper functions
    const isMovementDisabled = printer?.status === 'printing' || printer?.status === 'disconnected';

    const getButtonVariantWithStatus = (buttonType: 'pause' | 'stop' | 'connect') => 
        getButtonVariant(buttonType, printer?.status || '');

    // Error handling
    if (!name) {
        navigate('/');
        return null;
    }

    // Loading and error states
    if (error) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Printer not found</h2>
                    <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
                </div>
            </div>
        );
    }

    if (!printer || loading) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Loading Printer Details...</h2>
                    <p className="text-gray-500">Please wait while we fetch the printer status.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
                {/* Header */}
                <PrinterHeader 
                    printer={printer}
                    onNavigateBack={() => navigate('/')} 
                />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Status Card - Left 2/3 */}
                    <PrinterStatusCard
                        printer={printer}
                        getStatusBadgeClass={getStatusBadgeClass}
                        getStatusColor={getStatusColor}
                        getStatusText={getStatusText}
                        getButtonVariant={getButtonVariantWithStatus}
                        onPauseOrResume={handlePauseOrResume}
                        onStop={handleStop}
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                    />

                    {/* Movement Controls - Right 1/3 */}
                    <MovementControls
                        printer={printer}
                        command={command}
                        isMovementDisabled={isMovementDisabled}
                        onMovement={handleMovement}
                        onHome={handleHome}
                        onCommandSubmit={handleCommandSubmit}
                        onCommandChange={setCommand}
                    />
                </div>

                {/* Files and Queue Tabs */}
                <FilesAndQueueTabs
                    fileTree={fileTree}
                    queue={queue}
                    availableTags={availableTags}
                    activeTagFilter={activeTagFilter}
                    filesLoading={filesLoading}
                    queueLoading={queueLoading}
                    onUpload={uploadFiles}
                    onCreateFolder={createFolder}
                    onDelete={deleteItem}
                    onRename={renameItem}
                    onMove={moveItem}
                    onAddToQueue={handleAddToQueue}
                    onPrintNow={handlePrintNow}
                    onStartPrint={handleStartPrint}
                    onRemoveFromQueue={removeFromQueue}
                    onReorderQueue={reorderQueue}
                    onClearQueue={clearQueue}
                    onApplyTagFilter={applyTagFilter}
                    onClearTagFilter={clearTagFilter}
                    onMarkFailed={markFailed}
                    onMarkSuccessful={markSuccessful}
                    onRetryItem={retryItem}
                />

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
