import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface SelectedFileCardProps {
    selectedFile: string;
    onCancel: () => void;
    onAddToQueue: () => void;
}

const SelectedFileCard: React.FC<SelectedFileCardProps> = ({
    selectedFile,
    onCancel,
    onAddToQueue
}) => {
    return (
        <Card className="mt-6 printer-card group border-0 shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                        <div className="text-sm text-gray-500">Selected File</div>
                        <div className="font-medium break-words">{selectedFile.split('/').pop()}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0">
                        <Button 
                            variant="outline" 
                            onClick={onCancel}
                            className="h-10 text-sm"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={onAddToQueue}
                            className="h-10 text-sm"
                        >
                            Add to Queue
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SelectedFileCard;
