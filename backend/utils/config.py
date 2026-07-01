import os
from typing import List, Optional
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Application configuration settings loaded from environment variables or default values.
    Uses model_config with extra='ignore' so any extra env vars in .env are gracefully handled.
    """
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "NAMI V2 - Travel Intelligence Platform API"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"
    
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]
    MAX_FILE_SIZE_MB: int = 20
    
    NOMINATIM_USER_AGENT: str = "NAMI-App/2.0 (local dev)"
    NOMINATIM_TIMEOUT_SECONDS: int = 5
    
    SCENE_MODEL_NAME: str = "openai/clip-vit-base-patch32"
    LANDMARK_MODEL_NAME: str = "google/landmark-recognition-v1"
    CAPTION_MODEL_NAME: str = "Salesforce/blip-image-captioning-base"

    # Optional environment configurations
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

settings = Settings()
