import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class FileUtils:
    """Utility helper class for safe filesystem operations and path validation."""
    @staticmethod
    def get_file_extension(filename: str) -> str:
        """Extract lowercase file extension from filename string."""
        return os.path.splitext(filename)[1].lower() if filename else ""

    @staticmethod
    def ensure_directory(path: str) -> bool:
        """Create directory structure if it does not already exist."""
        try:
            os.makedirs(path, exist_ok=True)
            return True
        except Exception as e:
            logger.error(f"Failed to create directory '{path}': {e}")
            return False
