
import React from "react";
import { printers } from "@/data/printers";
import PrinterCard from "@/components/PrinterCard";
import { RefreshCcw, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const refreshPrinters = () => {
    console.log("Refreshing printer status...");
    //TODO : add endpoint to refresh printer status
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 mr-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200">
              <Printer className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">MakerPrint</h1>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {printers.map((printer) => (
            <PrinterCard key={printer.id} printer={printer} />
          ))}
        </div>
        
        <footer className="mt-16 mb-6 text-center">
          <div className="w-24 h-1 mx-auto bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mb-4"></div>
          <p className="text-sm text-gray-500">
            MakerPrint - L'Atelier © 2025
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
