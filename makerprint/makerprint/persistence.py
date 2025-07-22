"""
Persistence layer for queue management
"""
import json
import sqlite3
from pathlib import Path
from typing import List
from datetime import datetime

from . import models, utils
from .utils import logger


class JSONQueuePersistence:
    """Simple JSON-based queue persistence"""
    
    def __init__(self, file_path: str = "queue.json"):
        self.file_path = Path(file_path)
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
    
    def save_queue(self, queue: List[models.QueueItem]) -> bool:
        """Save queue to JSON file"""
        try:
            queue_data = [item.model_dump() for item in queue]
            with open(self.file_path, 'w') as f:
                json.dump(queue_data, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Failed to save queue: {e}")
            return False
    
    def load_queue(self) -> List[models.QueueItem]:
        """Load queue from JSON file"""
        try:
            if not self.file_path.exists():
                return []
            
            with open(self.file_path, 'r') as f:
                queue_data = json.load(f)
            
            return [models.QueueItem(**item) for item in queue_data]
        except Exception as e:
            logger.error(f"Failed to load queue: {e}")
            return []


class SQLiteDatabase:
    """SQLite database for queue persistence"""
    
    def __init__(self, db_path: str = "makerprint.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_database()
    
    def _init_database(self):
        """Initialize database schema"""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                -- Print queue table
                CREATE TABLE IF NOT EXISTS print_queue (
                    id TEXT PRIMARY KEY,
                    file_path TEXT NOT NULL,
                    file_name TEXT NOT NULL,
                    added_at TEXT NOT NULL,
                    tags TEXT NOT NULL,  -- JSON array
                    order_index INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                -- Create indexes for better performance
                CREATE INDEX IF NOT EXISTS idx_queue_order ON print_queue(order_index);
            """)
    
    # Queue operations
    def save_queue(self, queue: List[models.QueueItem]) -> bool:
        """Save entire queue to database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Clear existing queue
                conn.execute("DELETE FROM print_queue")
                
                # Insert new queue items
                for i, item in enumerate(queue):
                    conn.execute("""
                        INSERT INTO print_queue 
                        (id, file_path, file_name, added_at, tags, order_index)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        item.id, item.file_path, item.file_name, 
                        item.added_at, json.dumps(item.tags), i
                    ))
                
                conn.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to save queue to database: {e}")
            return False
    
    def load_queue(self) -> List[models.QueueItem]:
        """Load queue from database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT id, file_path, file_name, added_at, tags
                    FROM print_queue 
                    ORDER BY order_index
                """)
                
                queue = []
                for row in cursor.fetchall():
                    queue.append(models.QueueItem(
                        id=row[0],
                        file_path=row[1],
                        file_name=row[2],
                        added_at=row[3],
                        tags=json.loads(row[4])
                    ))
                
                return queue
        except Exception as e:
            logger.error(f"Failed to load queue from database: {e}")
            return []
