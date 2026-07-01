import logging
from models.schemas import LandmarkSchema
from utils.config import settings

logger = logging.getLogger(__name__)

class LandmarkService:
    """
    Interface for Landmark Recognition.
    Can be upgraded to Google Landmark Recognition V1/V2 or Grounding DINO without altering API.
    """
    @staticmethod
    def recognize_landmark(image_bytes: bytes) -> LandmarkSchema:
        logger.info(f"Invoking Landmark Recognition interface with model: {settings.LANDMARK_MODEL_NAME}")
        
        # Placeholder implementation returning clean interface contract
        return LandmarkSchema(
            name=None,
            confidence=0.0
        )
