import { useState } from 'react';
import { useToast } from './use-toast';

export const usePrinterHandlers = (name: string | undefined, actions: any, addToQueue: any, startPrint: any) => {
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [command, setCommand] = useState('');

    const { start, stop, pauseOrResume, connect, disconnect, sendCommand } = actions;

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
            addToQueue(selectedFile, []);
            setSelectedFile(null);
            toast({
                title: 'Success',
                description: 'File added to print queue',
            });
        }
    };

    const handleMovement = (axis: string, direction: number, scale: number = 10) => {
        if (!['X', 'Y', 'Z'].includes(axis) || (direction !== 1 && direction !== -1)) {
            console.error('Invalid movement command');
            return;
        }

        const START_GCODE = 'G91';
        const END_GCODE = 'G90';
        const command = `G0 ${axis}${direction > 0 ? '' : '-'}${scale}`;
        const commands = `${START_GCODE}; ${command}; ${END_GCODE};`;
        sendCommand(name, commands);
    };

    const handleHome = () => {
        const command = 'G28';
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

    return {
        selectedFile,
        setSelectedFile,
        command,
        setCommand,
        handleFileSelect,
        handleAddToQueue,
        handleAddSelectedToQueue,
        handleMovement,
        handleHome,
        handleCommandSubmit,
        handleStartPrint,
        handleStart: start,
        handleStop: stop,
        handlePauseOrResume: pauseOrResume,
        handleConnect: connect,
        handleDisconnect: disconnect,
    };
};
