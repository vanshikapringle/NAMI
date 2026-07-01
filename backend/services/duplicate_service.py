import io
import os
import json
import logging
from PIL import Image
from models.schemas import DuplicateSchema

logger = logging.getLogger(__name__)

ARCHIVE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "image_archive.json")

class DuplicateService:
    """
    Perceptual Image Embedding & Duplicate Detection Service.
    Computes difference hash (dHash) embeddings to detect near-duplicate travel images.
    """
    @classmethod
    def _ensure_archive_dir(cls):
        data_dir = os.path.dirname(ARCHIVE_PATH)
        if not os.path.exists(data_dir):
            os.makedirs(data_dir, exist_ok=True)
        if not os.path.exists(ARCHIVE_PATH):
            with open(ARCHIVE_PATH, "w", encoding="utf-8") as f:
                json.dump({}, f)

    @staticmethod
    def compute_dhash(image_bytes: bytes) -> str:
        """Generate a 64-bit difference hash (dHash) embedding from image bytes."""
        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                img = img.convert("L").resize((9, 8), Image.Resampling.LANCZOS)
                pixels = list(img.getdata())
                bits = []
                for y in range(8):
                    for x in range(8):
                        bits.append("1" if pixels[y * 9 + x] > pixels[y * 9 + x + 1] else "0")
                bit_string = "".join(bits)
                return hex(int(bit_string, 2))[2:].zfill(16)
        except Exception as e:
            logger.error(f"Error computing dHash: {e}")
            return ""

    @staticmethod
    def hamming_distance(hash1: str, hash2: str) -> int:
        """Calculate bitwise Hamming distance between two 64-bit hex strings."""
        try:
            val1 = int(hash1, 16)
            val2 = int(hash2, 16)
            return bin(val1 ^ val2).count("1")
        except Exception:
            return 64

    @classmethod
    def check_duplicate(cls, image_bytes: bytes, filename: str = None) -> DuplicateSchema:
        logger.info("Generating image embedding and checking for duplicates...")
        cls._ensure_archive_dir()

        dhash = cls.compute_dhash(image_bytes)
        if not dhash:
            return DuplicateSchema(is_duplicate=False, matched_image=None, similarity_score=0.0)

        archive = {}
        try:
            with open(ARCHIVE_PATH, "r", encoding="utf-8") as f:
                archive = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load archive: {e}")

        best_match = None
        min_distance = 64

        for archived_name, archived_hash in archive.items():
            if filename and archived_name == filename:
                continue
            dist = cls.hamming_distance(dhash, archived_hash)
            if dist < min_distance:
                min_distance = dist
                best_match = archived_name

        # If Hamming distance <= 5 out of 64 bits (approx >92% visual similarity)
        if min_distance <= 5 and best_match:
            similarity = round(1.0 - (min_distance / 64.0), 2)
            logger.info(f"Duplicate match found: {best_match} (similarity: {similarity})")
            return DuplicateSchema(
                is_duplicate=True,
                matched_image=best_match,
                similarity_score=similarity
            )

        similarity = round(1.0 - (min_distance / 64.0), 2) if min_distance < 64 else 0.0
        return DuplicateSchema(
            is_duplicate=False,
            matched_image=None,
            similarity_score=similarity
        )

    @classmethod
    def register_image(cls, image_bytes: bytes, filename: str) -> bool:
        """Register image embedding into archive after successful upload."""
        cls._ensure_archive_dir()
        dhash = cls.compute_dhash(image_bytes)
        if not dhash or not filename:
            return False

        try:
            with open(ARCHIVE_PATH, "r", encoding="utf-8") as f:
                archive = json.load(f)
            archive[filename] = dhash
            with open(ARCHIVE_PATH, "w", encoding="utf-8") as f:
                json.dump(archive, f, indent=2)
            logger.info(f"Registered image embedding for '{filename}' ({dhash})")
            return True
        except Exception as e:
            logger.error(f"Failed to register image embedding: {e}")
            return False
