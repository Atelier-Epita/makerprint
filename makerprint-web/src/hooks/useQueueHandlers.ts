import { useState } from 'react';
import { useToast } from './use-toast';
import { Printer } from '@/data/printers';

export const useQueueHandlers = (addToQueue: any, startPrint: any, printers: Printer[]) => {
    const { toast } = useToast();

    const handleAddToQueue = (filePath: string) => {
        if (filePath.endsWith('.gcode')) {
            addToQueue(filePath, []);
            toast({
                title: 'Success',
                description: 'File added to print queue',
            });
        }
    };

    // TODO: this is the equivalent of handleStartPrint but with printer selection
    // integrated in the function
    //  it should open a modal to select the printer if any is available
    const handleDispatchPrint = async (queueItemId: string) => {
        console.log('handleDispatchPrint called with queueItemId:', queueItemId);
    }

    return { handleAddToQueue, handleDispatchPrint };
}