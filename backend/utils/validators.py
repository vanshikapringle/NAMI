import logging
from typing import Any
from core.exceptions import NAMIException

logger = logging.getLogger(__name__)

class Validators:
    """Input validation helpers verifying string lengths, coordinate bounds, and payload sanity."""
    @staticmethod
    def validate_coordinates(lat: float, lng: float) -> bool:
        """Verify if GPS coordinates fall within valid geographic bounds [-90, 90] and [-180, 180]."""
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lng <= 180.0):
            raise NAMIException("GPS coordinates out of valid geographic bounds.", status_code=400)
        return True

    @staticmethod
    def validate_query_string(query: str, min_length: int = 2) -> bool:
        """Validate natural language input strings against minimum length rules."""
        if not query or len(query.strip()) < min_length:
            raise NAMIException(f"Query string must contain at least {min_length} characters.", status_code=400)
        return True
