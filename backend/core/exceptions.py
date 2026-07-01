from fastapi import HTTPException, status

class NAMIException(Exception):
    """Base exception class for all custom NAMI backend domain exceptions."""
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class InvalidImageException(NAMIException):
    """Raised when an uploaded image file is invalid, corrupted, or unsupported."""
    def __init__(self, message: str = "Invalid or corrupted image file."):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST)

class ResourceNotFoundException(NAMIException):
    """Raised when a requested memory or travel resource does not exist."""
    def __init__(self, message: str = "Requested travel memory resource not found."):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)
