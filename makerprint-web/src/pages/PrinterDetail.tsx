import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, data } from 'react-router-dom';
import { usePrinterStatus } from '@/hooks/usePrinterStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFiles } from '@/hooks/useFiles.ts';
import {
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  Home, Play, Pause, CircleStop, Plug, RefreshCcw,
  Thermometer, File, BarChart2
} from 'lucide-react';

const PrinterDetail = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();

  const [command, setCommand] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const { printer, loading, error, actions } = usePrinterStatus(name);
  const { start, stop, pauseOrResume, connect, disconnect, sendCommand, refreshStatus } = actions;
  const { files, loading: filesLoading, error: filesError, upload, refreshFiles } = useFiles();

  if (!name) {
    navigate('/');
    return;
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Printer not found</h2>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  } else if (!printer || loading) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Printer Details...</h2>
          <p className="text-gray-500">Please wait while we fetch the printer status.</p>
        </div>
      </div>
    );
  }

  // Only disable movement when actively printing
  const isMovementDisabled = printer.status === 'printing' || printer.status === 'disconnected';

  // Get status color for buttons
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'printing': return 'bg-printer-printing';
      case 'idle': return 'bg-printer-idle';
      case 'error': return 'bg-printer-error';
      default: return 'bg-printer-disconnected';
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'printing': return 'Printing';
      case 'idle': return 'Idle';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  // Get button variants based on printer status
  const getButtonVariant = (buttonType: 'start' | 'pause' | 'stop' | 'connect') => {
    const { status } = printer;

    if (buttonType === 'start' && status === 'idle') {
      return 'default';
    }

    if (buttonType === 'pause' && (status === 'printing' || status === 'paused')) {
      return 'default';
    }

    if (buttonType === 'stop' && (status === 'printing' || status === 'paused')) {
      return 'destructive';
    }

    if (buttonType === 'connect' && (status === 'disconnected' || status === 'idle')) {
      return 'default';
    }

    return 'outline';
  };

  const handleMovement = (axis: string, direction: number, scale: number = 10) => {
    if (printer.status === 'disconnected' || isMovementDisabled) {
      console.warn('Cannot move printer while disconnected or during print');
      return;
    }

    if (!['X', 'Y', 'Z'].includes(axis) || (direction !== 1 && direction !== -1)) {
      console.error('Invalid movement command');
      return;
    }

    const START_GCODE = 'G91'; // Set to relative positioning before movement
    const END_GCODE = 'G90'; // Set to absolute positioning after movement
    const command = `G0 ${axis}${direction > 0 ? '' : '-'}${scale}`;
    const commands = `${START_GCODE}; ${command}; ${END_GCODE};`;
    sendCommand(name, commands);
  };

  const handleHome = () => {
    const command = 'G28'; // G-code command to home all axes
    sendCommand(name, command);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!command.trim()) {
      console.warn('Command input is empty');
      return;
    }
    // send command and clear input
    sendCommand(name, command.trim());
    setCommand('');
  };

  const handleFileSelect = (file: string) => {
    if (file === selectedFile) {
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.gcode,.gco,.g,.gcode.gz';
    fileInput.multiple = true;
    fileInput.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach((file) => {
          upload(file);
        });
      }
    };
    fileInput.click();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/')}
              className="mr-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 mr-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200">
                <h1 className="text-xl font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </h1>
              </div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                {name}
              </h1>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300"
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 printer-card group border-0 shadow-md hover:shadow-xl transition-all duration-300">
            {/* Status indicator strip at top */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
              style={{
                background: `hsl(${printer.status === 'printing' ? 'var(--printer-printing)' :
                  printer.status === 'idle' ? 'var(--printer-idle)' :
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

                  {/* Updated Nozzle Temperature Display without color styling */}
                  <div className="flex flex-col p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-orange-100 text-orange-600 mr-3">
                          <Thermometer className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Nozzle</span>
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold">
                          {printer.nozzleTemp.current}°C
                        </span>
                        <span className="text-xs font-medium text-gray-500 ml-1">
                          / {printer.nozzleTemp.target}°C
                        </span>
                      </div>
                    </div>
                    {/* Temperature progress bar - keeping this for visual indication */}
                    {printer.nozzleTemp.target > 0 && (
                      <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                          style={{ width: `${Math.min(100, (printer.nozzleTemp.current / printer.nozzleTemp.target) * 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {/* Updated Bed Temperature Display without color styling */}
                  <div className="flex flex-col p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-red-100 text-red-600 mr-3">
                          <Thermometer className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Bed</span>
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold">
                          {printer.bedTemp.current}°C
                        </span>
                        <span className="text-xs font-medium text-gray-500 ml-1">
                          / {printer.bedTemp.target}°C
                        </span>
                      </div>
                    </div>
                    {/* Temperature progress bar - keeping this for visual indication */}
                    {printer.bedTemp.target > 0 && (
                      <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-400 to-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, (printer.bedTemp.current / printer.bedTemp.target) * 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {printer.layerHeight && (
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

                  {printer.timeRemaining !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-green-100 text-green-600 mr-3">
                          <BarChart2 className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Time remaining</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {Math.floor(printer.timeRemaining / 60)}h {printer.timeRemaining % 60}m
                      </span>
                    </div>
                  )}

                  {printer.progress !== undefined && (
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
                                'var(--printer-disconnected)'
                              }), hsl(${printer.status === 'printing' ? 'var(--printer-printing)' :
                                printer.status === 'idle' ? 'var(--printer-idle)' :
                                  'var(--printer-disconnected)'
                              }) 70%)`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                {/* Updated buttons with dynamic variant colors */}
                <Button
                  className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                  variant={getButtonVariant('start')}
                  disabled={printer.status === 'printing' || printer.status === 'disconnected' || !selectedFile}
                  onClick={() => start(selectedFile)}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
                <Button
                  className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                  variant={getButtonVariant('pause')}
                  disabled={printer.status !== 'printing' && printer.status !== 'paused'}
                  onClick={() => pauseOrResume()}
                >
                  {printer.status === 'printing' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {printer.status === 'printing' ? 'Pause' : 'Resume'}
                </Button>
                <Button
                  className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                  variant={getButtonVariant('stop')}
                  disabled={printer.status !== 'printing' && printer.status !== 'paused'}
                  onClick= {() => stop()}
                >
                  <CircleStop className="mr-2 h-4 w-4" />
                  Stop
                </Button>
                <Button
                  className="flex-1 shadow-md hover:shadow-lg transition-all duration-300"
                  variant={getButtonVariant('connect')}
                  disabled={printer.status === 'printing' || printer.status === 'paused'}
                  onClick={() => printer.status === 'disconnected' ? connect() : disconnect()}
                >
                  <Plug className="mr-2 h-4 w-4" />
                  {printer.status === 'disconnected' ? 'Connect' : 'Disconnect'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="printer-card group border-0 shadow-md hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle>Move</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Updated Move control panel with proper centering */}
              <div className="space-y-6">
                {/* Y+ Button (Top) */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-16 h-16 aspect-square rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                    onClick={() => handleMovement('Y', 1)}
                    disabled={isMovementDisabled}
                  >
                    <ArrowUp className="h-8 w-8 text-purple-600" />
                  </Button>
                </div>

                {/* X-/Home/X+ Row */}
                <div className="flex justify-center items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-16 h-16 aspect-square rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                    onClick={() => handleMovement('X', -1)}
                    disabled={isMovementDisabled}
                  >
                    <ArrowLeft className="h-8 w-8 text-purple-600" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="w-16 h-16 aspect-square rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                    onClick={handleHome}
                    disabled={isMovementDisabled}
                  >
                    <Home className="h-8 w-8" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="w-16 h-16 aspect-square rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                    onClick={() => handleMovement('X', 1)}
                    disabled={isMovementDisabled}
                  >
                    <ArrowRight className="h-8 w-8 text-purple-600" />
                  </Button>
                </div>

                {/* Y- Button (Bottom) */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-16 h-16 aspect-square rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                    onClick={() => handleMovement('Y', -1)}
                    disabled={isMovementDisabled}
                  >
                    <ArrowDown className="h-8 w-8 text-purple-600" />
                  </Button>
                </div>
              </div>

              {/* Z+ and Z- buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
                <Button
                  variant="outline"
                  className="h-14 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                  onClick={() => handleMovement('Z', 1)}
                  disabled={isMovementDisabled}
                >
                  <ArrowUp className="mr-2 h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-gray-700">Z+</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-14 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                  onClick={() => handleMovement('Z', -1)}
                  disabled={isMovementDisabled}
                >
                  <ArrowDown className="mr-2 h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-gray-700">Z-</span>
                </Button>
              </div>

              {/* Command input */}
              <form onSubmit={handleCommandSubmit} className="mt-4">
                <Input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Enter a command"
                  disabled={printer.status === 'disconnected' || isMovementDisabled}
                  className="h-12 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 text-base"
                />
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 printer-card group border-0 shadow-md hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filesLoading ? (
                <p className="text-center text-muted-foreground py-6">Loading files...</p>
              ) : filesError ? (
                <p className="text-center text-red-500 py-6">Error loading files: {filesError}</p>
              ) : null}
              {files && files.length === 0 && !filesLoading && !filesError ?
                <p className="text-center text-muted-foreground py-6">No files available</p>
                : null}
              {files && files.length > 0 && (
                files.map((file, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-md flex justify-between items-center border border-transparent transition-all duration-300 ${file === selectedFile
                      ? 'bg-secondary shadow-inner'
                      : 'hover:bg-secondary/30 hover:border-gray-200'
                      }`}
                  >
                    <div className="flex items-center">
                      <File className={`mr-3 h-5 w-5 ${file === selectedFile ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="font-medium truncate">{file}</span>
                    </div>
                    {printer.status !== 'disconnected' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={file === selectedFile ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : ''}
                        disabled={printer.status === 'printing' && file === selectedFile}
                        onClick={() => handleFileSelect(file)}
                      >
                        {file === selectedFile ? 'Selected' : 'Select'}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full shadow-sm hover:shadow-md transition-all duration-300"
                onClick={refreshFiles}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh Files
              </Button>

              <Button
                className="w-full shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600"
                disabled={printer.status === 'disconnected'}
                onClick={handleFileUpload}
              >
                <File className="mr-2 h-4 w-4" />
                Upload File
              </Button>

            </div>
          </CardContent>
        </Card>

        <footer className="mt-12 mb-6 text-center">
          <div className="w-24 h-1 mx-auto bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mb-4"></div>
          <p className="text-sm text-gray-500">
            MakerPrint - L'Atelier © 2025
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PrinterDetail;
