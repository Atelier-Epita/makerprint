import React from 'react';
import { Button } from '../ui/button';
import { Pause, CircleStop, Plug, Play } from 'lucide-react';

interface PrinterControlsProps {
    printer: any;
    onPauseOrResume: () => void;
    onStop: () => void;
    onConnect: () => void;
    onDisconnect: () => void;
    getButtonVariant: (buttonType: 'pause' | 'stop' | 'connect') => any;
}

const PrinterControls: React.FC<PrinterControlsProps> = ({
    printer,
    onPauseOrResume,
    onStop,
    onConnect,
    onDisconnect,
    getButtonVariant
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4">
            <Button
                className="flex-1 shadow-md hover:shadow-lg transition-all duration-300 h-10 sm:h-10 text-sm sm:text-sm"
                variant={getButtonVariant('pause')}
                disabled={printer.status !== 'printing' && printer.status !== 'paused'}
                onClick={onPauseOrResume}
            >
                {printer.status === 'printing' ? <Pause className="h-4 w-4 mr-1 sm:mr-2 sm:h-4 sm:w-4" /> : <Play className="h-4 w-4 mr-1 sm:mr-2 sm:h-4 sm:w-4" />}
                {printer.status === 'printing' ? 'Pause' : 'Resume'}
            </Button>
            <Button
                className="flex-1 shadow-md hover:shadow-lg transition-all duration-300 h-10 sm:h-10 text-sm sm:text-sm"
                variant={getButtonVariant('stop')}
                disabled={printer.status !== 'printing' && printer.status !== 'paused'}
                onClick={onStop}
            >
                <CircleStop className="h-4 w-4 mr-1 sm:mr-2 sm:h-4 sm:w-4" />
                Stop
            </Button>
            <Button
                className="flex-1 shadow-md hover:shadow-lg transition-all duration-300 h-10 sm:h-10 text-sm sm:text-sm"
                variant={getButtonVariant('connect')}
                disabled={printer.status === 'printing' || printer.status === 'paused'}
                onClick={() => printer.status === 'disconnected' ? onConnect() : onDisconnect()}
            >
                <Plug className="h-4 w-4 mr-1 sm:mr-2 sm:h-4 sm:w-4" />
                {printer.status === 'disconnected' ? 'Connect' : 'Disconnect'}
            </Button>
        </div>
    );
};

export default PrinterControls;
