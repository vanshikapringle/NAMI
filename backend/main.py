import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from utils.config import settings
from core.logging import setup_logging
from core.exceptions import NAMIException
from api.upload import router as upload_router, analyze_image
from api.search import router as search_router
from api.analytics import router as analytics_router
from api.chat import router as chat_router
from api.location import router as location_router

# Initialize Global Structured Logging
setup_logging()
logger = logging.getLogger("nami_backend")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Scalable Production AI Backend Architecture for NAMI V2 (AI-powered Travel Intelligence Platform)"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handler for Custom Domain Exceptions
@app.exception_handler(NAMIException)
async def nami_exception_handler(request: Request, exc: NAMIException):
    logger.warning(f"Domain exception raised on {request.url.path}: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error_code": exc.__class__.__name__, "detail": exc.message}
    )

# Register API Routers
app.include_router(upload_router, prefix=settings.API_PREFIX)
app.include_router(search_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)
app.include_router(chat_router, prefix=settings.API_PREFIX)
app.include_router(location_router, prefix=settings.API_PREFIX)

@app.get("/")
def health_check():
    """Service health check endpoint."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational"
    }

@app.post("/upload-photo", tags=["Legacy Compatibility"])
async def legacy_upload_photo(file: UploadFile = File(...)):
    """
    Backward-compatible wrapper route ensuring existing UploadModal frontend functions seamlessly.
    Delegates execution to the new Smart Upload Pipeline and formats the response for legacy clients.
    """
    try:
        analysis = await analyze_image(image=file)
        location_name = analysis.location.formatted_address
        if analysis.location.city != "Unknown City":
            location_name = f"{analysis.location.city}, {analysis.location.country}"
            
        return {
            "filename": file.filename,
            "lat": analysis.metadata.latitude,
            "lng": analysis.metadata.longitude,
            "location_name": location_name,
            "duplicate": {
                "is_duplicate": analysis.duplicate.is_duplicate,
                "matched_image": analysis.duplicate.matched_image,
                "similarity_score": analysis.duplicate.similarity_score
            },
            "timestamp": analysis.metadata.timestamp
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Legacy upload error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Legacy Upload Execution Failed")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
