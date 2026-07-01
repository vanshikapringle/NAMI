import logging
from models.schemas import ChatMessageSchema, ChatResponseSchema
from rag.retriever import RAGRetriever
from rag.prompt_builder import PromptBuilder
from rag.llm import LLMInterface

logger = logging.getLogger(__name__)

class ChatService:
    """
    Service orchestrating RAG (Retrieval-Augmented Generation) conversational AI chat
    grounded in the user's travel archives.
    """
    @staticmethod
    def process_chat_message(request: ChatMessageSchema) -> ChatResponseSchema:
        """Process user inquiry using RAG pipeline: retrieve -> prompt -> LLM inference."""
        logger.info(f"Processing conversational chat inquiry: '{request.message}'")
        
        # Step 1: Retrieve context-relevant memory archives
        contexts = RAGRetriever.retrieve_context(request.message)
        
        # Step 2: Build grounded LLM prompt
        prompt = PromptBuilder.build_prompt(request.message, contexts)
        
        # Step 3: Execute LLM generative inference
        reply = LLMInterface.generate_response(prompt)
        
        # Extract cited sources
        sources = [ctx.get("location", ctx.get("memory_id", "")) for ctx in contexts if ctx.get("location")]
        
        return ChatResponseSchema(reply=reply, sources=sources)
