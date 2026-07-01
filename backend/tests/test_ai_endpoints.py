from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"

def test_semantic_search():
    response = client.post("/api/v1/search", json={"query": "temples in Kyoto", "limit": 5})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["query"] == "temples in Kyoto"
    assert len(data["data"]["results"]) >= 1

def test_analytics_stats():
    response = client.get("/api/v1/analytics/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "total_memories" in data["data"]
    assert len(data["data"]["insights"]) > 0

def test_analytics_heatmap():
    response = client.get("/api/v1/analytics/heatmap")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["points"]) >= 1

def test_ai_chat():
    response = client.post("/api/v1/chat", json={"message": "What places did I visit in San Francisco?"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "reply" in data["data"]

def test_location_reverse():
    response = client.get("/api/v1/location/reverse?lat=37.7749&lng=-122.4194&source=manual_map")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["location_source"] == "manual_map"

def test_location_search():
    response = client.get("/api/v1/location/search?query=Paris")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1
