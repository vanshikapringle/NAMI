from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class MetadataSchema(BaseModel):
    """Schema representing EXIF metadata extracted from travel image."""
    latitude: Optional[float] = Field(None, description="Extracted GPS latitude coordinates")
    longitude: Optional[float] = Field(None, description="Extracted GPS longitude coordinates")
    timestamp: Optional[str] = Field(None, description="Image capture timestamp from EXIF")
    camera: Optional[str] = Field(None, description="Camera make and model string")

class LocationSchema(BaseModel):
    """Schema representing reverse geocoded geographical address."""
    city: str = Field("Unknown City", description="Geocoded city or town name")
    country: str = Field("Unknown Country", description="Geocoded country name")
    formatted_address: str = Field("Unknown Location", description="Full readable formatted address")
    location_source: str = Field("exif", description="Source of geographical location coordinates (exif, manual_search, manual_map, none)")

class LocationSearchResultItemSchema(BaseModel):
    """Suggested place item returned by location search autocomplete."""
    lat: float
    lng: float
    city: str
    country: str
    formatted_address: str

class SceneSchema(BaseModel):
    """Schema representing scene classification output."""
    label: str = Field("Scenic Travel Landscape", description="Predicted travel scene label")
    confidence: float = Field(0.92, description="Confidence score between 0.0 and 1.0")

class LandmarkSchema(BaseModel):
    """Schema representing landmark recognition output."""
    name: Optional[str] = Field(None, description="Recognized landmark name if detected")
    confidence: float = Field(0.0, description="Recognition confidence score between 0.0 and 1.0")

class DuplicateSchema(BaseModel):
    """Schema representing duplicate detection output."""
    is_duplicate: bool = Field(False, description="Flag indicating if near/exact duplicate exists")
    matched_image: Optional[str] = Field(None, description="Identifier/URL of matching image")
    similarity_score: float = Field(0.0, description="Cosine similarity or perceptual hash distance score")

class SentimentSchema(BaseModel):
    """Schema representing emotional sentiment evaluation of memory."""
    sentiment: str = Field("Positive", description="Categorized emotional tone (Positive/Neutral/Reflective)")
    score: float = Field(0.88, description="Sentiment intensity score")

class AnalyzeResponseSchema(BaseModel):
    """Top-level response schema returned by POST /api/v1/memories/process."""
    success: bool = Field(True, description="Whether the AI pipeline executed successfully")
    metadata: MetadataSchema
    location: LocationSchema
    scene: SceneSchema
    landmark: LandmarkSchema
    duplicate: DuplicateSchema
    caption: str = Field(..., description="Generated descriptive caption for the image")
    processing_time: float = Field(..., description="Total execution duration in seconds")

# Semantic Search Schemas
class SearchRequestSchema(BaseModel):
    """Request payload schema for semantic travel memory query."""
    query: str = Field(..., description="Natural language search query")
    limit: int = Field(10, description="Max number of results to return")
    filters: Optional[Dict[str, Any]] = Field(None, description="Optional metadata filters")
    memories: Optional[List[Dict[str, Any]]] = Field(None, description="Corpus of memories to search against if DB is decoupled")

class SearchResultItemSchema(BaseModel):
    """Individual item returned in semantic search results."""
    memory_id: str
    title: str
    location: str
    caption: str
    similarity_score: float

class SearchResponseSchema(BaseModel):
    """Response payload for semantic search endpoint."""
    query: str
    total_results: int
    results: List[SearchResultItemSchema]

# Analytics Schemas
class AnalyticsStatsResponseSchema(BaseModel):
    """Response payload for travel archive statistical aggregates."""
    total_memories: int
    countries_visited: int
    cities_visited: int
    top_categories: Dict[str, int]
    insights: List[str]

class HeatmapPointSchema(BaseModel):
    """Individual geographical point for interactive map heatmaps."""
    lat: float
    lng: float
    weight: float
    city: Optional[str] = None

class HeatmapResponseSchema(BaseModel):
    """Response payload containing spatial coordinates for travel heatmap rendering."""
    points: List[HeatmapPointSchema]

# AI Chat Schemas
class ChatMessageSchema(BaseModel):
    """Request payload schema for AI conversational inquiry."""
    message: str = Field(..., description="User message inquiry to NAMI travel assistant")
    history: Optional[List[Dict[str, str]]] = Field(None, description="Previous chat context")

class ChatResponseSchema(BaseModel):
    """Response payload returned by AI travel assistant."""
    reply: str = Field(..., description="Conversational AI answer grounded in travel archives")
    sources: List[str] = Field([], description="List of memory IDs or locations referenced")
