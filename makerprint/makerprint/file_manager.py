import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import uuid

from . import models, utils
from .utils import logger
from .persistence import SQLiteDatabase


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

    def move_item(self, item_path: str, new_folder_path: str) -> bool:
        """Move a file or folder to a new location"""
        try:
            source_path = self.base_path / item_path
            if not source_path.exists():
                return False
            
            # Handle empty folder path (root)
            if new_folder_path.strip() == "":
                target_folder = self.base_path
            else:
                target_folder = self.base_path / new_folder_path
            
            # Create target folder if it doesn't exist
            target_folder.mkdir(parents=True, exist_ok=True)
            
            # Build the full target path
            target_path = target_folder / source_path.name
            
            # Check if target already exists
            if target_path.exists():
                logger.error(f"Target path already exists: {target_path}")
                return False
            
            # Move the item
            source_path.rename(target_path)
            logger.info(f"Moved {item_path} to {new_folder_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to move {item_path} to {new_folder_path}: {e}")
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
    """Manages a print queue for all printers with SQLite persistence"""
    
    def __init__(self, db_path: str = "/data/makerprint.db"):
        self.db = SQLiteDatabase(db_path)
        self._queue: List[models.QueueItem] = []
        self._load_queue()
    
    def _load_queue(self):
        """Load queue from database on startup"""
        self._queue = self.db.load_queue()
        logger.info(f"Loaded {len(self._queue)} items from queue database")
    
    def _save_queue(self):
        """Save current queue to database"""
        success = self.db.save_queue(self._queue)
        if not success:
            logger.error("Failed to save queue to database")
        return success
    
    def add_to_queue(self, file_path: str, file_name: str, tags: List[str] = None) -> str:
        """Add a file to the queue"""
        if tags is None:
            tags = []
            
        queue_item = models.QueueItem(
            id=str(uuid.uuid4()),
            file_path=file_path,
            file_name=file_name,
            added_at=datetime.now().isoformat(),
            tags=tags
        )
        
        self._queue.append(queue_item)
        self._save_queue()
        logger.info(f"Added {file_name} to queue with tags: {tags}")
        return queue_item.id
    
    def remove_from_queue(self, queue_item_id: str) -> bool:
        """Remove an item from the queue"""
        original_length = len(self._queue)
        self._queue = [
            item for item in self._queue 
            if item.id != queue_item_id
        ]
        
        success = len(self._queue) < original_length
        if success:
            self._save_queue()
            logger.info(f"Removed queue item {queue_item_id} from queue")
        return success
    
    def get_queue(self, tag_filter: List[str] = None) -> List[models.QueueItem]:
        """Get the queue, optionally filtered by tags"""
        if not tag_filter:
            return self._queue.copy()
        
        # Filter by tags - item must have at least one of the specified tags
        filtered_queue = []
        for item in self._queue:
            if any(tag in item.tags for tag in tag_filter):
                filtered_queue.append(item)
        
        return filtered_queue
    
    def get_next_file(self, tag_filter: List[str] = None) -> Optional[models.QueueItem]:
        """Get the next file in the queue, optionally filtered by tags"""
        queue = self.get_queue(tag_filter)
        return queue[0] if queue else None
    
    def clear_queue(self, tag_filter: List[str] = None) -> bool:
        """Clear all items from the queue, optionally filtered by tags"""
        if not tag_filter:
            # Clear entire queue
            self._queue = []
            self._save_queue()
            logger.info("Cleared entire queue")
            return True
        else:
            # Clear only items matching tags
            original_length = len(self._queue)
            self._queue = [
                item for item in self._queue
                if not any(tag in item.tags for tag in tag_filter)
            ]
            removed_count = original_length - len(self._queue)
            if removed_count > 0:
                self._save_queue()
            logger.info(f"Cleared {removed_count} items with tags {tag_filter} from queue")
            return removed_count > 0
    
    def reorder_queue(self, item_ids: List[str]) -> bool:
        """Reorder items in the queue"""
        id_to_item = {item.id: item for item in self._queue}
        
        # Verify all IDs exist
        if not all(item_id in id_to_item for item_id in item_ids):
            return False
        
        # Keep items not in reorder list at the end
        items_not_in_reorder = [item for item in self._queue if item.id not in item_ids]
        
        # Reorder specified items
        reordered_items = [id_to_item[item_id] for item_id in item_ids]
        
        # Combine reordered items with remaining items
        self._queue = reordered_items + items_not_in_reorder
        self._save_queue()
        logger.info("Reordered queue")
        return True
    
    def get_all_tags(self) -> List[str]:
        """Get all unique tags used in the queue"""
        all_tags = set()
        for item in self._queue:
            all_tags.update(item.tags)
        return sorted(list(all_tags))


# Global instances
file_manager = FileManager()
default_db_path = os.environ.get("DATABASE_PATH", "/data/makerprint.db")
queue_manager = PrintQueueManager(default_db_path)
