import {
    startPrinter,
    stopPrinter,
    pausePrinter,
    connectPrinter,
    disconnectPrinter,
} from '@/api/printers';

export function usePrinterActions() {
    return {
        start: startPrinter,
        stop: stopPrinter,
        pauseOrResume: pausePrinter,
        connect: connectPrinter,
        disconnect: disconnectPrinter,
    };
}
