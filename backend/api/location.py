import logging
from typing import List, Optional
from fastapi import APIRouter, Query
from models.schemas import LocationSchema, LocationSearchResultItemSchema
from models.responses import APIResponse
from services.location_service import LocationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/location", tags=["Geographical Location Service"])

@router.get("/reverse", response_model=APIResponse[LocationSchema])
async def reverse_geocode_endpoint(
    lat: float = Query(..., description="Latitude coordinate"),
    lng: float = Query(..., description="Longitude coordinate"),
    source: str = Query("manual_map", description="Location selection source")
) -> APIResponse[LocationSchema]:
    """Reverse geocode latitude and longitude into structured geographical address metadata."""
    logger.info(f"API route /v1/location/reverse invoked for coordinates: ({lat}, {lng}) source={source}")
    location = LocationService.reverse_geocode(lat, lng, source=source)
    return APIResponse(success=True, message="Coordinates reverse geocoded successfully.", data=location)

@router.get("/search", response_model=APIResponse[List[LocationSearchResultItemSchema]])
async def search_location_endpoint(
    query: str = Query(..., min_length=1, description="Place search query string"),
    limit: int = Query(5, ge=1, le=20, description="Maximum suggestions to return")
) -> APIResponse[List[LocationSearchResultItemSchema]]:
    """Search for places by text query returning autocomplete suggestions with coordinates."""
    logger.info(f"API route /v1/location/search invoked for query: '{query}'")
    results = LocationService.search_places(query, limit=limit)
    return APIResponse(success=True, message="Place suggestions retrieved successfully.", data=results)
