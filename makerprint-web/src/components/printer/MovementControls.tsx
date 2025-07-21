import React from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home } from 'lucide-react';

interface MovementControlsProps {
    printer: any;
    command: string;
    isMovementDisabled: boolean;
    onMovement: (axis: string, direction: number, scale?: number) => void;
    onHome: () => void;
    onCommandSubmit: (e: React.FormEvent) => void;
    onCommandChange: (command: string) => void;
}

const MovementControls: React.FC<MovementControlsProps> = ({
    printer,
    command,
    isMovementDisabled,
    onMovement,
    onHome,
    onCommandSubmit,
    onCommandChange
}) => {
    return (
        <Card className="printer-card group border-0 shadow-md hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
                <CardTitle>Move</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Y+ Button (Top) */}
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-16 h-16 aspect-square rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                            onClick={() => onMovement('Y', 1)}
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
                            onClick={() => onMovement('X', -1)}
                            disabled={isMovementDisabled}
                        >
                            <ArrowLeft className="h-8 w-8 text-purple-600" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            className="w-16 h-16 aspect-square rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                            onClick={onHome}
                            disabled={isMovementDisabled}
                        >
                            <Home className="h-8 w-8" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            className="w-16 h-16 aspect-square rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                            onClick={() => onMovement('X', 1)}
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
                            onClick={() => onMovement('Y', -1)}
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
                        onClick={() => onMovement('Z', 1)}
                        disabled={isMovementDisabled}
                    >
                        <ArrowUp className="mr-2 h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-gray-700">Z+</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-14 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white border border-gray-200"
                        onClick={() => onMovement('Z', -1)}
                        disabled={isMovementDisabled}
                    >
                        <ArrowDown className="mr-2 h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-gray-700">Z-</span>
                    </Button>
                </div>

                {/* Command input */}
                <form onSubmit={onCommandSubmit} className="mt-4">
                    <Input
                        value={command}
                        onChange={(e) => onCommandChange(e.target.value)}
                        placeholder="Enter a command"
                        disabled={printer.status === 'disconnected' || isMovementDisabled}
                        className="h-12 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border-gray-200 text-base"
                    />
                </form>
            </CardContent>
        </Card>
    );
};

export default MovementControls;
