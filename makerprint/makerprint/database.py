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
            # First, create the table with basic schema if it doesn't exist
            conn.execute("""
                CREATE TABLE IF NOT EXISTS print_queue (
                    id TEXT PRIMARY KEY,
                    file_path TEXT NOT NULL,
                    file_name TEXT NOT NULL,
                    added_at TEXT NOT NULL,
                    tags TEXT NOT NULL,  -- JSON array
                    order_index INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Check if new columns exist, add them if they don't
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(print_queue)")
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'status' not in columns:
                conn.execute("ALTER TABLE print_queue ADD COLUMN status TEXT DEFAULT 'todo'")
            if 'printer_name' not in columns:
                conn.execute("ALTER TABLE print_queue ADD COLUMN printer_name TEXT")
            if 'started_at' not in columns:
                conn.execute("ALTER TABLE print_queue ADD COLUMN started_at TEXT")
            if 'finished_at' not in columns:
                conn.execute("ALTER TABLE print_queue ADD COLUMN finished_at TEXT")
            if 'error_message' not in columns:
                conn.execute("ALTER TABLE print_queue ADD COLUMN error_message TEXT")
                
            # Create indexes after ensuring columns exist
            conn.execute("CREATE INDEX IF NOT EXISTS idx_queue_order ON print_queue(order_index)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_queue_status ON print_queue(status)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_queue_printer ON print_queue(printer_name)")
                
            conn.commit()
    
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
                        (id, file_path, file_name, added_at, tags, order_index, 
                         status, printer_name, started_at, finished_at, error_message)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        item.id, item.file_path, item.file_name, 
                        item.added_at, json.dumps(item.tags), i,
                        item.status, item.printer_name, item.started_at,
                        item.finished_at, item.error_message
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
                    SELECT id, file_path, file_name, added_at, tags,
                           status, printer_name, started_at, finished_at, error_message
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
                        tags=json.loads(row[4]),
                        status=row[5] or "todo",
                        printer_name=row[6],
                        started_at=row[7],
                        finished_at=row[8],
                        error_message=row[9]
                    ))
                
                return queue
        except Exception as e:
            logger.error(f"Failed to load queue from database: {e}")
            return []

    def update_queue_item_status(self, item_id: str, status: str, printer_name: str = None, 
                                started_at: str = None, finished_at: str = None, 
                                error_message: str = None) -> bool:
        """Update the status and related fields of a specific queue item"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    UPDATE print_queue 
                    SET status = ?, printer_name = ?, started_at = ?, 
                        finished_at = ?, error_message = ?
                    WHERE id = ?
                """, (status, printer_name, started_at, finished_at, error_message, item_id))
                
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to update queue item {item_id}: {e}")
            return False

    def get_queue_item_by_id(self, item_id: str) -> models.QueueItem:
        """Get a specific queue item by ID"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT id, file_path, file_name, added_at, tags,
                           status, printer_name, started_at, finished_at, error_message
                    FROM print_queue 
                    WHERE id = ?
                """, (item_id,))
                
                row = cursor.fetchone()
                if row:
                    return models.QueueItem(
                        id=row[0],
                        file_path=row[1],
                        file_name=row[2],
                        added_at=row[3],
                        tags=json.loads(row[4]),
                        status=row[5] or "todo",
                        printer_name=row[6],
                        started_at=row[7],
                        finished_at=row[8],
                        error_message=row[9]
                    )
                return None
        except Exception as e:
            logger.error(f"Failed to get queue item {item_id}: {e}")
            return None
