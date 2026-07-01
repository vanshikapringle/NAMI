from typing import Optional
from fastapi import Header, HTTPException, status
from utils.config import settings

async def verify_api_key(x_api_key: Optional[str] = Header(None)) -> bool:
    """
    Security dependency placeholder for API Key verification.
    For local development, allows unauthenticated requests unless API_KEY is strictly configured.
    """
    if getattr(settings, "ENFORCE_API_KEY", False):
        if not x_api_key or x_api_key != getattr(settings, "API_KEY", ""):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing API Key"
            )
    return True
