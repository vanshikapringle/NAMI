import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def create_test_image_bytes() -> bytes:
    """Helper generating a valid JPEG image buffer for unit testing."""
    img = Image.new('RGB', (100, 100), color='blue')
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    return buffer.read()

def test_health_check():
    """Verify application health endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "operational"

def test_process_memory():
    """Verify NAMI V2 Smart Upload Pipeline endpoint POST /api/v1/memories/process."""
    image_bytes = create_test_image_bytes()
    files = {"image": ("test_photo.jpg", image_bytes, "image/jpeg")}
    
    response = client.post("/api/v1/memories/process", files=files)
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "metadata" in data
    assert "location" in data
    assert "scene" in data
    assert "landmark" in data
    assert "duplicate" in data
    assert "caption" in data
    assert "processing_time" in data
    
    assert data["scene"]["label"] == "Scenic Travel Landscape"
    assert data["duplicate"]["is_duplicate"] is False

def test_invalid_file_type():
    """Verify error handling on non-image upload."""
    files = {"image": ("document.txt", b"not an image", "text/plain")}
    response = client.post("/api/v1/memories/process", files=files)
    assert response.status_code == 400
