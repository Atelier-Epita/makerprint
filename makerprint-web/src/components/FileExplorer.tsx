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
    MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
    onFileSelect?: (filePath: string) => void;
    onUpload: (files: File[], folderPath: string) => Promise<any>;
    onCreateFolder: (folderPath: string) => Promise<void>;
    onDelete: (filePath: string) => Promise<void>;
    onRename: (filePath: string, newName: string) => Promise<void>;
    loading?: boolean;
}

interface FileNodeComponentProps {
    node: FileNode;
    level: number;
    parentPath: string;
    onFileSelect?: (filePath: string) => void;
    onDelete: (filePath: string) => Promise<void>;
    onRename: (filePath: string, newName: string) => Promise<void>;
}

const FileNodeComponent: React.FC<FileNodeComponentProps> = ({
    node,
    level,
    parentPath,
    onFileSelect,
    onDelete,
    onRename
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(node.name);

    const handleExpand = () => {
        if (node.type === 'folder') {
            setIsExpanded(!isExpanded);
        }
    };

    const handleFileClick = () => {
        if (node.type === 'file' && node.name.endsWith('.gcode') && onFileSelect) {
            onFileSelect(node.path);
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
                    <button onClick={handleExpand} className="p-1">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                )}
                
                <div className="flex items-center gap-2 flex-1" onClick={handleFileClick}>
                    {node.type === 'folder' ? (
                        <Folder className="h-4 w-4 text-blue-500" />
                    ) : (
                        <File className="h-4 w-4 text-gray-500" />
                    )}
                    
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
                        <span className="text-sm">{node.name}</span>
                    )}
                </div>

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
                        <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Rename
                        </DropdownMenuItem>
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

            {node.type === 'folder' && isExpanded && node.children && (
                <div>
                    {node.children.map((child) => (
                        <FileNodeComponent
                            key={child.path}
                            node={child}
                            level={level + 1}
                            parentPath={node.path}
                            onFileSelect={onFileSelect}
                            onDelete={onDelete}
                            onRename={onRename}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const FileExplorer: React.FC<FileExplorerProps> = ({
    fileTree,
    onFileSelect,
    onUpload,
    onCreateFolder,
    onDelete,
    onRename,
    loading = false
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            alert('Only .gcode files are allowed');
            return;
        }

        try {
            await onUpload(gcodeFiles, '');
            console.log(`Uploaded ${gcodeFiles.length} file(s)`);
        } catch (error) {
            console.error('Failed to upload files:', error);
        }
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        try {
            await onUpload(files, '');
            console.log(`Uploaded ${files.length} file(s)`);
        } catch (error) {
            console.error('Failed to upload files:', error);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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
                        onFileSelect={onFileSelect}
                        onDelete={onDelete}
                        onRename={onRename}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Upload className="h-12 w-12 mb-4" />
                        <p className="text-sm mb-2">Drag and drop .gcode files here</p>
                        <p className="text-xs">or click Upload to browse</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default FileExplorer;
