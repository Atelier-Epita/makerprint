import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { File, BarChart2 } from 'lucide-react';
import TemperatureDisplay from './TemperatureDisplay';
import PrinterControls from './PrinterControls';

interface PrinterStatusCardProps {
    printer: any;
    selectedFile: string | null;
    getStatusBadgeClass: (status: string) => string;
    getStatusColor: (status: string) => string;
    getStatusText: (status: string) => string;
    getButtonVariant: (buttonType: 'start' | 'pause' | 'stop' | 'connect') => any;
    onStart: (file: string | null) => void;
    onPauseOrResume: () => void;
    onStop: () => void;
    onConnect: () => void;
    onDisconnect: () => void;
}

const PrinterStatusCard: React.FC<PrinterStatusCardProps> = ({
    printer,
    selectedFile,
    getStatusBadgeClass,
    getStatusColor,
    getStatusText,
    getButtonVariant,
    onStart,
    onPauseOrResume,
    onStop,
    onConnect,
    onDisconnect
}) => {
    return (
        <Card className="xl:col-span-2 printer-card group border-0 shadow-md hover:shadow-xl transition-all duration-300">
            {/* Status indicator strip at top */}
            <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                style={{
                    background: `hsl(${printer.status === 'printing' ? 'var(--printer-printing)' :
                        printer.status === 'idle' ? 'var(--printer-idle)' :
                            printer.status === 'paused' ? 'var(--printer-paused)' :
                                printer.status === 'error' ? 'var(--printer-error)' :
                                    'var(--printer-disconnected)'
                        })`
                }}
            />
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle>Status</CardTitle>
                    <span className={getStatusBadgeClass(printer.status)}>
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(printer.status)} animate-pulse-subtle`} />
                        <span>{getStatusText(printer.status)}</span>
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center">
                                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 mr-3">
                                    <File className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">File</span>
                            </div>
                            <span className="text-sm font-semibold truncate max-w-[200px]">
                                {printer.currentFile || 'No file selected'}
                            </span>
                        </div>

                        <TemperatureDisplay
                            label="Nozzle"
                            current={printer.nozzleTemp?.current || 0}
                            target={printer.nozzleTemp?.target || 0}
                            iconColor="orange"
                            gradientColors="from-yellow-400 to-orange-500"
                        />

                        <TemperatureDisplay
                            label="Bed"
                            current={printer.bedTemp?.current || 0}
                            target={printer.bedTemp?.target || 0}
                            iconColor="red"
                            gradientColors="from-red-400 to-rose-500"
                        />
                    </div>

                    <div className="space-y-3">
                        {printer.layerHeight > 0 && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 flex items-center justify-center rounded-md bg-purple-100 text-purple-600 mr-3">
                                        <BarChart2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Layer height</span>
                                </div>
                                <span className="text-sm font-semibold">{printer.layerHeight}mm</span>
                            </div>
                        )}

                        {printer.timeRemaining > 0 && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 flex items-center justify-center rounded-md bg-green-100 text-green-600 mr-3">
                                        <BarChart2 className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">Time Elapsed / Remaining</span>
                                </div>
                                <span className="text-sm font-semibold">
                                    {Math.floor(printer.timeElapsed / 3600) > 0
                                        ? `${Math.floor(printer.timeElapsed / 3600)}h `
                                        : ''}
                                    {Math.floor((printer.timeElapsed % 3600) / 60)}m{' '}
                                    {Math.floor(printer.timeElapsed % 60)}s /{' '}

                                    {Math.floor(printer.timeRemaining / 3600) > 0
                                        ? `${Math.floor(printer.timeRemaining / 3600)}h `
                                        : ''}
                                    {Math.floor((printer.timeRemaining % 3600) / 60)}m{' '}
                                    {Math.floor(printer.timeRemaining % 60)}s
                                </span>
                            </div>
                        )}

                        {printer.progress !== undefined && printer.progress > 0 && (
                            <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-indigo-100 text-indigo-600 mr-3">
                                            <BarChart2 className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium text-muted-foreground">Progress</span>
                                    </div>
                                    <span className="text-sm font-semibold">{printer.progress}%</span>
                                </div>
                                <div className="progress-container">
                                    <div
                                        className="progress-printing"
                                        style={{
                                            width: `${printer.progress}%`,
                                            background: `linear-gradient(90deg, hsl(${printer.status === 'printing' ? 'var(--printer-printing)' :
                                                printer.status === 'idle' ? 'var(--printer-idle)' :
                                                    printer.status === 'paused' ? 'var(--printer-paused)' :
                                                        'var(--printer-disconnected)'
                                                }), hsl(${printer.status === 'printing' ? 'var(--printer-printing)' :
                                                    printer.status === 'idle' ? 'var(--printer-idle)' :
                                                        printer.status === 'paused' ? 'var(--printer-paused)' :
                                                            'var(--printer-disconnected)'
                                                }) 70%)`
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Control Buttons */}
                <PrinterControls
                    printer={printer}
                    selectedFile={selectedFile}
                    onStart={onStart}
                    onPauseOrResume={onPauseOrResume}
                    onStop={onStop}
                    onConnect={onConnect}
                    onDisconnect={onDisconnect}
                    getButtonVariant={getButtonVariant}
                />
            </CardContent>
        </Card>
    );
};

export default PrinterStatusCard;
