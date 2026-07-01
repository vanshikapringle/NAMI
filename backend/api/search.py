import logging
from fastapi import APIRouter, Depends
from models.schemas import SearchRequestSchema, SearchResponseSchema
from models.responses import APIResponse
from services.semantic_search_service import SemanticSearchService
from utils.validators import Validators

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/search", tags=["Semantic Search"])

@router.post("", response_model=APIResponse[SearchResponseSchema])
async def search_memories(request: SearchRequestSchema) -> APIResponse[SearchResponseSchema]:
    """
    Execute semantic natural language search across archived travel photos,
    captions, and EXIF/GPS metadata using embedding vector similarity.
    """
    logger.info(f"API route /v1/search invoked with query: '{request.query}'")
    Validators.validate_query_string(request.query)
    
    result = SemanticSearchService.search_memories(request)
    return APIResponse(success=True, message="Semantic search executed successfully.", data=result)
