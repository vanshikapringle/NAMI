import logging
from typing import Optional
from models.schemas import LocationSchema
from services.location_service import LocationService

logger = logging.getLogger(__name__)

class GeocodeService:
    """
    Service responsible for converting GPS coordinates (latitude, longitude)
    into geographical address strings. Delegates to LocationService.
    """
    @staticmethod
    def reverse_geocode(lat: Optional[float], lng: Optional[float]) -> LocationSchema:
        return LocationService.reverse_geocode(lat, lng, source="exif")
