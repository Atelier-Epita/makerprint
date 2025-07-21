import React from 'react';
import { Button } from '../ui/button';
import { Play, Pause, CircleStop, Plug } from 'lucide-react';

interface PrinterControlsProps {
    printer: any;
    selectedFile: string | null;
    onStart: (file: string | null) => void;
    onPauseOrResume: () => void;
    onStop: () => void;
    onConnect: () => void;
    onDisconnect: () => void;
    getButtonVariant: (buttonType: 'start' | 'pause' | 'stop' | 'connect') => any;
}

const PrinterControls: React.FC<PrinterControlsProps> = ({
    printer,
    selectedFile,
    onStart,
    onPauseOrResume,
    onStop,
    onConnect,
    onDisconnect,
    getButtonVariant
}) => {
    return (
        <div className="flex gap-4 pt-4">
            <Button
                className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                variant={getButtonVariant('start')}
                disabled={printer.status === 'printing' || printer.status === 'disconnected' || !selectedFile}
                onClick={() => onStart(selectedFile)}
            >
                <Play className="mr-2 h-4 w-4" />
                Start
            </Button>
            <Button
                className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                variant={getButtonVariant('pause')}
                disabled={printer.status !== 'printing' && printer.status !== 'paused'}
                onClick={onPauseOrResume}
            >
                {printer.status === 'printing' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {printer.status === 'printing' ? 'Pause' : 'Resume'}
            </Button>
            <Button
                className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                variant={getButtonVariant('stop')}
                disabled={printer.status !== 'printing' && printer.status !== 'paused'}
                onClick={onStop}
            >
                <CircleStop className="mr-2 h-4 w-4" />
                Stop
            </Button>
            <Button
                className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                variant={getButtonVariant('connect')}
                disabled={printer.status === 'printing' || printer.status === 'paused'}
                onClick={() => printer.status === 'disconnected' ? onConnect() : onDisconnect()}
            >
                <Plug className="mr-2 h-4 w-4" />
                {printer.status === 'disconnected' ? 'Connect' : 'Disconnect'}
            </Button>
        </div>
    );
};

export default PrinterControls;
