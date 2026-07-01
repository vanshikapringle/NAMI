import io
from PIL import Image
from fastapi import HTTPException, UploadFile
from utils.config import settings

async def validate_and_read_image(file: UploadFile) -> bytes:
    """
    Validate uploaded file content type, file extension, and file size.
    Read bytes and verify image integrity with Pillow.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: '{file.content_type}'. Only image uploads are permitted."
        )
    
    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds allowable limit of {settings.MAX_FILE_SIZE_MB}MB."
        )
    
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Corrupted or unreadable image file data."
        )
        
    return contents
