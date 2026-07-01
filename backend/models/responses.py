from typing import Any, Generic, TypeVar, Optional
from pydantic import BaseModel

DataT = TypeVar("DataT")

class APIResponse(BaseModel, Generic[DataT]):
    """Standard generic API response wrapper for consistent NAMI V2 payloads."""
    success: bool = True
    message: Optional[str] = None
    data: Optional[DataT] = None

class ErrorResponse(BaseModel):
    """Standard error payload schema returned on HTTP exceptions."""
    success: bool = False
    error_code: str
    detail: str
