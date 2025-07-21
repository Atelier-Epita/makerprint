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
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-gray-500">Selected File</div>
                        <div className="font-medium">{selectedFile.split('/').pop()}</div>
                    </div>
                    <div className="space-x-2">
                        <Button variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button onClick={onAddToQueue}>
                            Add to Queue
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SelectedFileCard;
