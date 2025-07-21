export const getStatusColor = (status: string) => {
    switch (status) {
        case 'printing': return 'bg-printer-printing';
        case 'idle': return 'bg-printer-idle';
        case 'error': return 'bg-printer-error';
        default: return 'bg-printer-disconnected';
    }
};

export const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'printing': return 'status-badge status-badge-printing';
        case 'idle': return 'status-badge status-badge-idle';
        case 'error': return 'status-badge status-badge-error';
        default: return 'status-badge status-badge-disconnected';
    }
};

export const getStatusText = (status: string) => {
    switch (status) {
        case 'printing': return 'Printing';
        case 'idle': return 'Idle';
        case 'error': return 'Error';
        default: return 'Disconnected';
    }
};

export const getButtonVariant = (buttonType: 'start' | 'pause' | 'stop' | 'connect', status: string) => {
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
