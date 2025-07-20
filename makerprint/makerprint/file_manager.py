import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import uuid

from . import models, utils
from .utils import logger


class FileManager:
    """Manages file operations and maintains file structure"""
    
    def __init__(self, base_path: str = None):
        self.base_path = Path(base_path or utils.GCODEFOLDER)
        self.base_path.mkdir(parents=True, exist_ok=True)
        
    def _get_file_info(self, file_path: Path) -> models.File:
        """Get file information for a single file"""
        stat = file_path.stat()
        relative_path = str(file_path.relative_to(self.base_path))
        
        return models.File(
            name=file_path.name,
            path=relative_path,
            type="folder" if file_path.is_dir() else "file",
            size=stat.st_size if file_path.is_file() else None,
            modified=datetime.fromtimestamp(stat.st_mtime).isoformat(),
            tags=[]
        )
    
    def _build_file_tree(self, directory: Path) -> models.FileNode:
        """Recursively build file tree structure"""
        stat = directory.stat()
        relative_path = str(directory.relative_to(self.base_path))
        
        node = models.FileNode(
            name=directory.name,
            path=relative_path,
            type="folder" if directory.is_dir() else "file",
            size=stat.st_size if directory.is_file() else None,
            modified=datetime.fromtimestamp(stat.st_mtime).isoformat(),
            children=[] if directory.is_dir() else None,
            tags=[]
        )
        
        if directory.is_dir():
            try:
                for child in sorted(directory.iterdir()):
                    if child.name.startswith('.'):
                        continue  # Skip hidden files
                    node.children.append(self._build_file_tree(child))
            except PermissionError:
                logger.warning(f"Permission denied accessing {directory}")
                
        return node
    
    def get_file_tree(self) -> models.FileNode:
        """Get the complete file tree structure"""
        return self._build_file_tree(self.base_path)
    
    def get_files_flat(self) -> List[models.File]:
        """Get a flat list of all files (no folders)"""
        files = []
        
        def collect_files(directory: Path):
            try:
                for item in directory.iterdir():
                    if item.name.startswith('.'):
                        continue
                    if item.is_file() and item.suffix.lower() == '.gcode':
                        files.append(self._get_file_info(item))
                    elif item.is_dir():
                        collect_files(item)
            except PermissionError:
                logger.warning(f"Permission denied accessing {directory}")
        
        collect_files(self.base_path)
        return files
    
    def create_folder(self, folder_path: str) -> bool:
        """Create a new folder"""
        try:
            full_path = self.base_path / folder_path
            full_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created folder: {folder_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to create folder {folder_path}: {e}")
            return False
    
    def delete_item(self, item_path: str) -> bool:
        """Delete a file or folder"""
        try:
            full_path = self.base_path / item_path
            if not full_path.exists():
                return False
                
            if full_path.is_file():
                full_path.unlink()
                logger.info(f"Deleted file: {item_path}")
            else:
                shutil.rmtree(full_path)
                logger.info(f"Deleted folder: {item_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete {item_path}: {e}")
            return False
    
    def rename_item(self, old_path: str, new_name: str) -> bool:
        """Rename a file or folder"""
        try:
            old_full_path = self.base_path / old_path
            if not old_full_path.exists():
                return False
            
            new_full_path = old_full_path.parent / new_name
            old_full_path.rename(new_full_path)
            logger.info(f"Renamed {old_path} to {new_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to rename {old_path} to {new_name}: {e}")
            return False
    
    def save_uploaded_file(self, content: bytes, filename: str, folder_path: str = "") -> bool:
        """Save an uploaded file to the specified folder"""
        try:
            target_dir = self.base_path / folder_path
            target_dir.mkdir(parents=True, exist_ok=True)
            
            file_path = target_dir / filename
            with open(file_path, 'wb') as f:
                f.write(content)
            
            logger.info(f"Saved uploaded file: {folder_path}/{filename}")
            return True
        except Exception as e:
            logger.error(f"Failed to save uploaded file {filename}: {e}")
            return False
    
    def get_file_path(self, relative_path: str) -> Path:
        """Get the absolute path for a relative file path"""
        return self.base_path / relative_path
    
    def file_exists(self, relative_path: str) -> bool:
        """Check if a file exists"""
        return (self.base_path / relative_path).exists()


class PrintQueueManager:
    """Manages print queues for printers"""
    
    def __init__(self):
        self.queues: Dict[str, List[models.QueueItem]] = {}
    
    def add_to_queue(self, printer_name: str, file_path: str, file_name: str) -> str:
        """Add a file to a printer's queue"""
        if printer_name not in self.queues:
            self.queues[printer_name] = []
        
        queue_item = models.QueueItem(
            id=str(uuid.uuid4()),
            file_path=file_path,
            file_name=file_name,
            added_at=datetime.now().isoformat()
        )
        
        self.queues[printer_name].append(queue_item)
        logger.info(f"Added {file_name} to {printer_name} queue")
        return queue_item.id
    
    def remove_from_queue(self, printer_name: str, queue_item_id: str) -> bool:
        """Remove an item from a printer's queue"""
        if printer_name not in self.queues:
            return False
        
        original_length = len(self.queues[printer_name])
        self.queues[printer_name] = [
            item for item in self.queues[printer_name] 
            if item.id != queue_item_id
        ]
        
        success = len(self.queues[printer_name]) < original_length
        if success:
            logger.info(f"Removed queue item {queue_item_id} from {printer_name}")
        return success
    
    def get_queue(self, printer_name: str) -> List[models.QueueItem]:
        """Get the queue for a specific printer"""
        return self.queues.get(printer_name, [])
    
    def get_next_file(self, printer_name: str) -> Optional[models.QueueItem]:
        """Get the next file in the queue for a printer"""
        queue = self.get_queue(printer_name)
        return queue[0] if queue else None
    
    def clear_queue(self, printer_name: str) -> bool:
        """Clear all items from a printer's queue"""
        if printer_name in self.queues:
            self.queues[printer_name] = []
            logger.info(f"Cleared queue for {printer_name}")
            return True
        return False
    
    def reorder_queue(self, printer_name: str, item_ids: List[str]) -> bool:
        """Reorder items in a printer's queue"""
        if printer_name not in self.queues:
            return False
        
        current_queue = self.queues[printer_name]
        id_to_item = {item.id: item for item in current_queue}
        
        # Verify all IDs exist
        if not all(item_id in id_to_item for item_id in item_ids):
            return False
        
        # Reorder
        self.queues[printer_name] = [id_to_item[item_id] for item_id in item_ids]
        logger.info(f"Reordered queue for {printer_name}")
        return True


# Global instances
file_manager = FileManager()
queue_manager = PrintQueueManager()
