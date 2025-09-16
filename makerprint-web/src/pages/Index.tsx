import React from "react";
import { RefreshCcw, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrinters } from "@/hooks/usePrinters";
import { useFileManager } from '@/hooks/useFileManager';
import { usePrintQueue } from '@/hooks/usePrintQueue';
import { usePrinterHandlers } from '@/hooks/usePrinterHandlers';
import FilesAndQueueTabs from '@/components/printer/FilesAndQueueTabs';
import PrinterCard from "@/components/PrinterCard";
import Footer from '@/components/Footer';
import { useQueueHandlers } from "@/hooks/useQueueHandlers";

const Index = () => {
  const { printers, loading, error, refreshPrinters } = usePrinters();
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
      applyTagFilter,
      clearTagFilter,
      startPrint,
      markFailed,
      markSuccessful,
      retryItem
  } = usePrintQueue();

  // custom hooks for dispatch / choose printer prompt
  const {
      handleAddToQueue,
      handleDispatchPrint,
  } = useQueueHandlers(addToQueue, startPrint, printers);

  return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="container py-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 mr-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200">
                <Printer className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                MakerPrint
              </h1>
            </div>

            <Button
                variant="outline"
                size="sm"
                className="mt-4 sm:mt-0 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300"
                onClick={refreshPrinters}
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh Printers
            </Button>
          </div>

          <div className="flex items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">My Printers</h2>
            <div className="ml-2 w-2 h-2 rounded-full animate-pulse bg-green-500"></div>
          </div>

          {loading && <p>Chargement des imprimantes...</p>}

          {/* Printers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {printers.map((printer: any) => (
                <PrinterCard key={printer.id || printer.name} printer={printer} />
            ))}
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
              onPrintNow={undefined} // TODO: implement handlePrintNow for dispatch
              onStartPrint={undefined} // TODO: implement handleDispatchPrint
              onRemoveFromQueue={removeFromQueue}
              onReorderQueue={reorderQueue}
              onApplyTagFilter={applyTagFilter}
              onClearTagFilter={clearTagFilter}
              onMarkFailed={markFailed}
              onMarkSuccessful={markSuccessful}
              onRetryItem={retryItem}
          />

          <Footer />
        </div>
      </div>
  );
};

export default Index;
