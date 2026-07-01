import logging
from fastapi import APIRouter
from models.schemas import ChatMessageSchema, ChatResponseSchema
from models.responses import APIResponse
from services.chat_service import ChatService
from utils.validators import Validators

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/chat", tags=["AI Travel Assistant"])

@router.post("", response_model=APIResponse[ChatResponseSchema])
async def ai_travel_chat(request: ChatMessageSchema) -> APIResponse[ChatResponseSchema]:
    """
    Conversational RAG endpoint allowing users to converse with an AI Travel Assistant
    grounded directly in their archived travel memories and locations.
    """
    logger.info(f"API route /v1/chat invoked with message: '{request.message}'")
    Validators.validate_query_string(request.message, min_length=1)
    
    reply = ChatService.process_chat_message(request)
    return APIResponse(success=True, message="AI chat response generated successfully.", data=reply)
