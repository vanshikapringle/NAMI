import io
import logging
from PIL import Image
import piexif
from models.schemas import MetadataSchema

logger = logging.getLogger(__name__)

class ExifService:
    """
    Service responsible for extracting EXIF metadata including GPS tags,
    capture timestamp, and camera make/model from raw image bytes.
    """
    @staticmethod
    def extract_metadata(image_bytes: bytes) -> MetadataSchema:
        lat, lng = None, None
        timestamp = None
        camera = None
        
        try:
            img = Image.open(io.BytesIO(image_bytes))
            raw_exif = img.info.get("exif", b"")
            if not raw_exif:
                logger.info("No EXIF metadata block found inside image.")
                return MetadataSchema(latitude=None, longitude=None, timestamp=None, camera=None)
                
            exif_dict = piexif.load(raw_exif)
            
            # Extract GPS tags
            gps_info = exif_dict.get("GPS", {})
            if piexif.GPSIFD.GPSLatitude in gps_info and piexif.GPSIFD.GPSLongitude in gps_info:
                lat_raw = gps_info[piexif.GPSIFD.GPSLatitude]
                lng_raw = gps_info[piexif.GPSIFD.GPSLongitude]
                lat_ref = gps_info.get(piexif.GPSIFD.GPSLatitudeRef, b'N').decode('utf-8', errors='ignore')
                lng_ref = gps_info.get(piexif.GPSIFD.GPSLongitudeRef, b'E').decode('utf-8', errors='ignore')
                
                def convert_to_degrees(value) -> float:
                    d, m, s = value
                    return (d[0] / d[1]) + ((m[0] / m[1]) / 60.0) + ((s[0] / s[1]) / 3600.0)
                
                lat = convert_to_degrees(lat_raw)
                lng = convert_to_degrees(lng_raw)
                
                if lat_ref != 'N':
                    lat = -lat
                if lng_ref != 'E':
                    lng = -lng
            
            # Extract Timestamp
            ifd_0th = exif_dict.get("0th", {})
            if piexif.ImageIFD.DateTime in ifd_0th:
                timestamp = ifd_0th[piexif.ImageIFD.DateTime].decode('utf-8', errors='ignore')
                
            # Extract Camera Make and Model
            make = ifd_0th.get(piexif.ImageIFD.Make, b'').decode('utf-8', errors='ignore').strip()
            model = ifd_0th.get(piexif.ImageIFD.Model, b'').decode('utf-8', errors='ignore').strip()
            if make or model:
                camera = f"{make} {model}".strip()
                
        except Exception as e:
            logger.warning(f"Error encountered while extracting EXIF metadata: {e}")
            
        return MetadataSchema(
            latitude=lat,
            longitude=lng,
            timestamp=timestamp,
            camera=camera
        )
