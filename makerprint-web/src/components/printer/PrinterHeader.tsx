import React from 'react';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { Printer } from '@/data/printers';

interface PrinterHeaderProps {
    printer: Printer;
    onNavigateBack: () => void;
}

const PrinterHeader: React.FC<PrinterHeaderProps> = ({ printer, onNavigateBack }) => {
    const displayName = printer?.displayName || printer?.display_name || printer?.name || 'Unknown Printer';
    
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onNavigateBack}
                    className="mr-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 mr-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200">
                        <h1 className="text-xl font-bold text-white">
                            {displayName?.charAt(0).toUpperCase()}
                        </h1>
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                        {displayName}
                    </h1>
                </div>
            </div>

            <Button
                variant="outline"
                size="sm"
                className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300"
                onClick={onNavigateBack}
            >
                Back to Dashboard
            </Button>
        </div>
    );
};

export default PrinterHeader;
