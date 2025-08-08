import { useState } from 'react';
import { useToast } from './use-toast';

export const usePrinterHandlers = (name: string | undefined, actions: any, addToQueue: any, startPrint: any) => {
    const { toast } = useToast();
    const [command, setCommand] = useState('');

    const { start, stop, pauseOrResume, connect, disconnect, sendCommand } = actions;

    const handleAddToQueue = (filePath: string) => {
        if (filePath.endsWith('.gcode')) {
            addToQueue(filePath, []);
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

    const handlePrintNow = async (filePath: string) => {
        if (!name) {
            console.error('Printer name is not available');
            return;
        }

        if (!filePath.endsWith('.gcode')) {
            console.error('Invalid file type for printing');
            return;
        }

        try {
            // Add file to queue and get the queue item ID
            const response = await addToQueue(filePath, []);
            const queueItemId = response.data.queue_item_id;
            
            // Immediately start printing the newly added item
            await startPrint(queueItemId, name);
            
            toast({
                title: 'Print Started',
                description: 'File added to queue and print started successfully!',
            });
            
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to start print immediately',
                variant: 'destructive',
            });
        }
    };

    return {
        command,
        setCommand,
        handleAddToQueue,
        handlePrintNow,
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
