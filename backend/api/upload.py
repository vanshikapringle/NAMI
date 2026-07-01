import time
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import AnalyzeResponseSchema
from utils.image_utils import validate_and_read_image
from services.exif_service import ExifService
from services.geocode_service import GeocodeService
from services.scene_service import SceneService
from services.landmark_service import LandmarkService
from services.duplicate_service import DuplicateService
from services.caption_service import CaptionService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Smart Upload Pipeline"])

async def execute_smart_upload_pipeline(image: UploadFile) -> AnalyzeResponseSchema:
    """
    Core implementation of the AI Smart Upload Pipeline:
    1. Validate and load image bytes
    2. Extract EXIF metadata (Timestamp, Camera make/model)
    3. Extract GPS coordinates (Latitude, Longitude)
    4. Perform reverse geocoding via OpenStreetMap Nominatim
    5. Classify travel scene (pluggable interface)
    6. Recognize famous landmarks (pluggable interface)
    7. Detect near/exact duplicates (pluggable interface)
    8. Generate descriptive image caption (pluggable interface)
    """
    start_time = time.time()
    logger.info(f"Starting Smart Upload Pipeline processing for file: '{image.filename}'")
    
    try:
        # Step 1: Validate file format, size, and verify image integrity
        image_bytes = await validate_and_read_image(image)
        
        # Step 2 & 3: Extract EXIF metadata and GPS coordinates
        metadata = ExifService.extract_metadata(image_bytes)
        logger.info(f"EXIF extraction complete - GPS: ({metadata.latitude}, {metadata.longitude})")
        
        # Step 4: Reverse Geocoding
        location = GeocodeService.reverse_geocode(metadata.latitude, metadata.longitude)
        logger.info(f"Geocoding resolved to: {location.formatted_address}")
        
        # Step 5: Scene Classification
        scene = SceneService.classify_scene(image_bytes)
        
        # Step 6: Landmark Recognition
        landmark = LandmarkService.recognize_landmark(image_bytes)
        
        # Step 7: Duplicate Detection
        duplicate = DuplicateService.check_duplicate(image_bytes, filename=image.filename)
        
        # Step 8: Caption Generation
        caption = CaptionService.generate_caption(image_bytes)
        
        processing_time = round(time.time() - start_time, 4)
        logger.info(f"Smart Upload Pipeline completed successfully in {processing_time}s")
        
        return AnalyzeResponseSchema(
            success=True,
            metadata=metadata,
            location=location,
            scene=scene,
            landmark=landmark,
            duplicate=duplicate,
            caption=caption,
            processing_time=processing_time
        )
    except HTTPException as he:
        logger.warning(f"Pipeline HTTP exception: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Unhandled internal error during pipeline execution: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal AI Smart Upload Pipeline Error")


@router.post("/v1/memories/process", response_model=AnalyzeResponseSchema)
async def process_memory(image: UploadFile = File(...)) -> AnalyzeResponseSchema:
    """Primary NAMI V2 endpoint: Process travel memory image through AI pipeline."""
    return await execute_smart_upload_pipeline(image)


@router.post("/upload/analyze", response_model=AnalyzeResponseSchema)
async def analyze_image(image: UploadFile = File(...)) -> AnalyzeResponseSchema:
    """Alternative alias route for image analysis pipeline."""
    return await execute_smart_upload_pipeline(image)


@router.post("/register-duplicate")
@router.post("/v1/memories/register-duplicate")
async def register_duplicate(file: UploadFile = File(...)):
    """Register uploaded image embedding into the AI duplicate detection archive."""
    image_bytes = await validate_and_read_image(file)
    success = DuplicateService.register_image(image_bytes, file.filename)
    return {"success": success, "filename": file.filename}
