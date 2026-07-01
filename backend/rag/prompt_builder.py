import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class PromptBuilder:
    """
    Constructs well-structured system and context prompts injecting retrieved travel memories
    into Large Language Model prompts.
    """
    @staticmethod
    def build_prompt(user_message: str, retrieved_contexts: List[Dict[str, Any]]) -> str:
        """Format travel memory documents and user inquiry into a consolidated LLM prompt."""
        logger.info(f"Building system prompt with {len(retrieved_contexts)} context documents.")
        context_str = "\n".join([
            f"- [{ctx.get('location', 'Unknown')}] {ctx.get('title')}: {ctx.get('caption')}"
            for ctx in retrieved_contexts
        ])
        
        return (
            "You are NAMI, an AI travel assistant specializing in analyzing user travel memories.\n"
            f"Context Memories:\n{context_str}\n\n"
            f"User Question: {user_message}\n"
            "Response:"
        )
