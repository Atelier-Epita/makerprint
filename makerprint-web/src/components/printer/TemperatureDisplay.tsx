import React from 'react';
import { Thermometer } from 'lucide-react';

interface TemperatureDisplayProps {
    label: string;
    current: number;
    target: number;
    iconColor: 'orange' | 'red';
    gradientColors: string;
}

const TemperatureDisplay: React.FC<TemperatureDisplayProps> = ({
    label,
    current,
    target,
    iconColor,
    gradientColors
}) => {
    const iconColorClass = iconColor === 'orange' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600';

    return (
        <div className="flex flex-col p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-md ${iconColorClass} mr-3`}>
                        <Thermometer className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <div className="flex items-baseline">
                    <span className="text-lg font-bold">
                        {current}°C
                    </span>
                    <span className="text-xs font-medium text-gray-500 ml-1">
                        / {target}°C
                    </span>
                </div>
            </div>
            {target > 0 && (
                <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-gradient-to-r ${gradientColors} rounded-full`}
                        style={{ width: `${Math.min(100, (current / target) * 100)}%` }}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default TemperatureDisplay;
