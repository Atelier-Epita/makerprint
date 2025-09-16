import React, { useState, useRef } from 'react';
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    FolderPlus,
    Upload,
    Trash2,
    Edit3,
    MoreVertical,
    Plus,
    Move,
    Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    size?: number;
    modified?: string;
    children?: FileNode[];
    tags?: string[];
}

interface FileExplorerProps {
    fileTree: FileNode | null;
    onUpload: (files: File[], folderPath: string) => Promise<any>;
    onCreateFolder: (folderPath: string) => Promise<void>;
    onDelete: (filePath: string) => Promise<void>;
    onRename: (filePath: string, newName: string) => Promise<void>;
    onMove?: (filePath: string, newFolderPath: string) => Promise<void>;
    onAddToQueue?: (filePath: string) => void;
    onPrintNow?: (filePath: string) => void;
    loading?: boolean;
}

interface FileNodeComponentProps {
    node: FileNode;
    level: number;
    parentPath: string;
    onDelete: (filePath: string) => Promise<void>;
    onRename: (filePath: string, newName: string) => Promise<void>;
    onMove?: (filePath: string, newFolderPath: string) => Promise<void>;
    onAddToQueue?: (filePath: string) => void;
    onPrintNow?: (filePath: string) => void;
    allFolders: string[];
}

const FileNodeComponent: React.FC<FileNodeComponentProps> = ({
    node,
    level,
    parentPath,
    onDelete,
    onRename,
    onMove,
    onAddToQueue,
    onPrintNow,
    allFolders
}) => {
    // if parent folder, expand by default
    const isParentFolder = parentPath === '';
    const [isExpanded, setIsExpanded] = useState(isParentFolder);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(node.name);
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState('');

    const handleExpand = () => {
        if (node.type === 'folder') {
            setIsExpanded(!isExpanded);
        }
    };

    const handleRename = async () => {
        if (newName.trim() === '' || newName === node.name) {
            setIsRenaming(false);
            setNewName(node.name);
            return;
        }

        try {
            await onRename(node.path, newName.trim());
            setIsRenaming(false);
        } catch (error) {
            console.error('Failed to rename:', error);
            setNewName(node.name);
            setIsRenaming(false);
        }
    };

    const handleMove = async () => {
        if (!onMove) return;
        
        try {
            await onMove(node.path, selectedFolder);
            setShowMoveDialog(false);
            setSelectedFolder('');
        } catch (error) {
            console.error('Failed to move:', error);
        }
    };

    const handleAddToQueue = () => {
        if (node.type === 'file' && node.name.endsWith('.gcode') && onAddToQueue) {
            onAddToQueue(node.path);
        }
    };

    const handlePrintNow = () => {
        if (node.type === 'file' && node.name.endsWith('.gcode') && onPrintNow) {
            onPrintNow(node.path);
        }
    };

    const handleDelete = async () => {
        try {
            await onDelete(node.path);
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    return (
        <div>
            <div
                className={`flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer group`}
                style={{ paddingLeft: `${level * 20 + 8}px` }}
            >
                {node.type === 'folder' && (
                    <button onClick={handleExpand} className="p-1 shrink-0">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                )}
                
                <div className="shrink-0">
                    {node.type === 'folder' ? (
                        <Folder className="h-4 w-4 text-blue-500" />
                    ) : (
                        <File className="h-4 w-4 text-gray-500" />
                    )}
                </div>
                
                <div className="flex-1 min-w-0 flex items-center">
                    {isRenaming ? (
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                                if (e.key === 'Escape') {
                                    setIsRenaming(false);
                                    setNewName(node.name);
                                }
                            }}
                            className="h-6 text-sm"
                            autoFocus
                        />
                    ) : (
                        <span className="text-sm break-words leading-none">{node.name}</span>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {node.type === 'file' && node.size && (
                        <span className="text-xs text-gray-400">{formatSize(node.size)}</span>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            >
                                <MoreVertical className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {node.type === 'file' && node.name.endsWith('.gcode') && (onAddToQueue || onPrintNow) && (
                                <>
                                    {onPrintNow && (
                                        <DropdownMenuItem 
                                            onClick={handlePrintNow}
                                            className="font-medium text-green-700 hover:text-green-800 hover:bg-green-50"
                                        >
                                            <Play className="h-4 w-4 mr-2" />
                                            Print Now
                                        </DropdownMenuItem>
                                    )}
                                    {onAddToQueue && (
                                        <DropdownMenuItem onClick={handleAddToQueue}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add to Queue
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            
                            <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Rename
                            </DropdownMenuItem>
                            
                            {onMove && (
                                <DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
                                    <Move className="h-4 w-4 mr-2" />
                                    Move
                                </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem 
                                onClick={handleDelete}
                                className="text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Move Dialog */}
                <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Move {node.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Select destination folder:</label>
                                <select
                                    value={selectedFolder}
                                    onChange={(e) => setSelectedFolder(e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-md"
                                >
                                    <option value="">Root folder</option>
                                    {allFolders.map((folder) => (
                                        <option key={folder} value={folder}>
                                            {folder}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleMove}>
                                    Move
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {node.type === 'folder' && isExpanded && node.children && (
                <div>
                    {node.children.map((child) => (
                        <FileNodeComponent
                            key={child.path}
                            node={child}
                            level={level + 1}
                            parentPath={node.path}
                            onDelete={onDelete}
                            onRename={onRename}
                            onMove={onMove}
                            onAddToQueue={onAddToQueue}
                            onPrintNow={onPrintNow}
                            allFolders={allFolders}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const FileExplorer: React.FC<FileExplorerProps> = ({
    fileTree,
    onUpload,
    onCreateFolder,
    onDelete,
    onRename,
    onMove,
    onAddToQueue,
    onPrintNow,
    loading = false
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [selectedUploadFolder, setSelectedUploadFolder] = useState('');
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Extract all folder paths for folder selection
    const getAllFolders = (node: FileNode | null, currentPath = ''): string[] => {
        if (!node) return [];
        
        const folders: string[] = [];
        if (node.type === 'folder' && currentPath) {
            folders.push(currentPath);
        }
        
        if (node.children) {
            node.children.forEach(child => {
                if (child.type === 'folder') {
                    const childPath = currentPath ? `${currentPath}/${child.name}` : child.name;
                    folders.push(...getAllFolders(child, childPath));
                }
            });
        }
        
        return folders;
    };

    const allFolders = getAllFolders(fileTree);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const gcodeFiles = files.filter(file => file.name.endsWith('.gcode'));

        if (gcodeFiles.length === 0) {
            alert('Please drop .gcode files only');
            return;
        }

        setPendingFiles(gcodeFiles);
        setShowUploadDialog(true);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const gcodeFiles = Array.from(files).filter(file => file.name.endsWith('.gcode'));
            if (gcodeFiles.length === 0) {
                alert('Please select .gcode files only');
                return;
            }
            setPendingFiles(gcodeFiles);
            setShowUploadDialog(true);
        }
    };

    const handleUploadConfirm = async () => {
        if (pendingFiles.length === 0) return;
        
        try {
            await onUpload(pendingFiles, selectedUploadFolder);
            setShowUploadDialog(false);
            setPendingFiles([]);
            setSelectedUploadFolder('');
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            await onCreateFolder(newFolderName.trim());
            setNewFolderName('');
            setIsCreatingFolder(false);
            console.log(`Created folder ${newFolderName}`);
        } catch (error) {
            console.error('Failed to create folder:', error);
        }
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">File Explorer</CardTitle>
                    <div className="flex gap-2">
                        <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <FolderPlus className="h-4 w-4 mr-2" />
                                    New Folder
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Create New Folder</DialogTitle>
                                </DialogHeader>
                                <div className="flex items-center space-x-2">
                                    <Input
                                        placeholder="Folder name"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreateFolder();
                                        }}
                                    />
                                    <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                                        Create
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                        </Button>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".gcode"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />
                    </div>
                </div>
            </CardHeader>
            
            <CardContent
                className={`h-96 overflow-auto border-2 border-dashed rounded-lg transition-colors ${
                    isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-sm text-gray-500">Loading files...</div>
                    </div>
                ) : fileTree ? (
                    <FileNodeComponent
                        node={fileTree}
                        level={0}
                        parentPath=""
                        onDelete={onDelete}
                        onRename={onRename}
                        onMove={onMove}
                        onAddToQueue={onAddToQueue}
                        onPrintNow={onPrintNow}
                        allFolders={allFolders}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Upload className="h-12 w-12 mb-4" />
                        <p className="text-sm mb-2">Drag and drop .gcode files here</p>
                        <p className="text-xs">or click Upload to browse</p>
                    </div>
                )}
            </CardContent>

            {/* upload Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Choose Upload Location</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">
                                Uploading {pendingFiles.length} file(s)
                            </p>
                            <div className="max-h-20 overflow-y-auto text-xs text-gray-500">
                                {pendingFiles.map((file, index) => (
                                    <div key={index}>{file.name}</div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Select destination folder:</label>
                            <select
                                value={selectedUploadFolder}
                                onChange={(e) => setSelectedUploadFolder(e.target.value)}
                                className="w-full mt-1 p-2 border rounded-md"
                            >
                                <option value="">Root folder</option>
                                {allFolders.map((folder) => (
                                    <option key={folder} value={folder}>
                                        {folder}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUploadConfirm}>
                                Upload
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default FileExplorer;
