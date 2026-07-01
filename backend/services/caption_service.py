import logging
from utils.config import settings

logger = logging.getLogger(__name__)

class CaptionService:
    """
    Interface for Image Caption Generation.
    Can be upgraded to BLIP-2 / Florence-2 without altering public API.
    """
    @staticmethod
    def generate_caption(image_bytes: bytes) -> str:
        logger.info(f"Invoking Caption Generation interface using model: {settings.CAPTION_MODEL_NAME}")
        
        # Placeholder caption implementation adhering to interface contract
        return "A scenic travel photograph capturing memorable moments and vibrant landscapes."
