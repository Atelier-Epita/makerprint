
import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from '@/data/printers';
import { useNavigate } from 'react-router-dom';
import { Thermometer, File, BarChart2 } from 'lucide-react';

interface PrinterCardProps {
  printer: Printer;
}

const PrinterCard: React.FC<PrinterCardProps> = ({ printer }) => {
  const navigate = useNavigate();
  const { status } = printer;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'printing': return 'bg-printer-printing';
      case 'idle': return 'bg-printer-idle';
      case 'error': return 'bg-printer-error';
      default: return 'bg-printer-disconnected';
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
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'printing': return 'status-badge status-badge-printing';
      case 'idle': return 'status-badge status-badge-idle';
      case 'error': return 'status-badge status-badge-error';
      default: return 'status-badge status-badge-disconnected';
    }
  };

  return (
    <Card className="printer-card group">
      {/* Status indicator strip at top */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ 
          background: `hsl(${
            status === 'printing' ? 'var(--printer-printing)' :
            status === 'idle' ? 'var(--printer-idle)' :
            status === 'error' ? 'var(--printer-error)' :
            'var(--printer-disconnected)'
          })` 
        }}
      />
      
      <CardContent className="p-6 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{printer.name}</h3>
          <span className={getStatusBadgeClass(printer.status)}>
            <span className={`w-2 h-2 rounded-full ${getStatusColor(printer.status)}`} />
            <span>{getStatusText(printer.status)}</span>
          </span>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center">
              <Thermometer className="mr-2 h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">Nozzle</span>
            </div>
            <span className="text-sm font-semibold">
              {printer.nozzleTemp.current}°C / {printer.nozzleTemp.target}°C
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center">
              <Thermometer className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-muted-foreground">Bed</span>
            </div>
            <span className="text-sm font-semibold">
              {printer.bedTemp.current}°C / {printer.bedTemp.target}°C
            </span>
          </div>
          
          {printer.currentFile && (
            <>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <File className="mr-2 h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-muted-foreground">File</span>
                </div>
                <span className="text-sm font-semibold truncate max-w-[150px]">
                  {printer.currentFile}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart2 className="mr-2 h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-muted-foreground">Progress</span>
                  </div>
                  <span className="text-sm font-semibold">{printer.progress}%</span>
                </div>
                <div className="progress-container">
                  <div 
                    className="progress-printing" 
                    style={{ width: `${printer.progress}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full font-medium hover:bg-primary/90 transition-all duration-300 group-hover:translate-y-0 translate-y-0 group-hover:shadow-md" 
          onClick={() => navigate(`/printer/${printer.name}`)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PrinterCard;
