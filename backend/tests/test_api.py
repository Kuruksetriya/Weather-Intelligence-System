"""
Integration and Unit Tests for FastAPI backend endpoints and ML inference engine.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.ml.inference import WeatherPredictor

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.mark.anyio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["application"] == "AI-Based Weather Intelligence and Decision Support System"
        assert data["status"] == "operational"

@pytest.mark.anyio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["ml_model_loaded"] is True
        assert data["active_model_name"] == "Random Forest"
        assert "f1_score" in data["model_metrics"]

@pytest.mark.anyio
async def test_weather_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/weather/London")
        assert response.status_code == 200
        data = response.json()
        assert data["location"]["name"] == "London"
        assert "temperature" in data
        assert "relative_humidity" in data
        assert "condition" in data
        assert "icon" in data

@pytest.mark.anyio
async def test_forecast_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/forecast/London")
        assert response.status_code == 200
        data = response.json()
        assert len(data["hourly"]) >= 24
        assert len(data["daily"]) >= 7
        assert "max_temperature" in data["daily"][0]

@pytest.mark.anyio
async def test_prediction_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/prediction/London")
        assert response.status_code == 200
        data = response.json()
        assert data["model_name"] == "Random Forest"
        assert 0.0 <= data["rain_probability"] <= 1.0
        assert "explanation" in data
        assert len(data["top_drivers"]) > 0
        assert "disclaimer" in data

@pytest.mark.anyio
async def test_intelligence_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/intelligence/London")
        assert response.status_code == 200
        data = response.json()
        assert "meteorological_summary" in data
        assert "ml_synthesis" in data
        assert len(data["key_insights"]) > 0
        assert data["overall_risk_level"] in ["Low", "Moderate", "High", "Severe"]

@pytest.mark.anyio
async def test_recommendations_all_activities():
    activities = ["Travel", "Outdoor Events", "Sports", "Agriculture"]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for act in activities:
            payload = {"city": "London", "activity": act}
            response = await client.post("/recommendation", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["activity"] == act
            assert 0 <= data["suitability_score"] <= 100
            assert "primary_recommendation" in data
            assert len(data["recommended_precautions"]) > 0

@pytest.mark.anyio
async def test_alerts_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/alerts/London")
        assert response.status_code == 200
        data = response.json()
        assert "has_active_alerts" in data
        assert "overall_risk_severity" in data

@pytest.mark.anyio
async def test_search_locations_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/search/locations?query=G")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert "name" in data[0]
        assert "country" in data[0]
        assert "display_name" in data[0]
        # Verify prefix matches like Geneva are prioritized
        names = [item["name"] for item in data]
        assert "Geneva" in names or "Glasgow" in names or "Guangzhou" in names

@pytest.mark.anyio
async def test_reverse_geocode_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/reverse-geocode?lat=28.6139&lon=77.2090")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "country" in data
        assert "display_name" in data
        assert "Delhi" in data["name"] or "Delhi" in data["display_name"]


@pytest.mark.anyio
async def test_invalid_city_404():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/weather/NonExistentFictionalCity999XYZ")
        assert response.status_code == 404

def test_ml_inference_unit_logic():
    predictor = WeatherPredictor()
    assert predictor.is_loaded is True

    # Saturated wet conditions should produce higher rain probability
    wet_input = {
        "temperature_2m": 12.0,
        "relative_humidity_2m": 95.0,
        "past_precip_3h": 2.5,
        "surface_pressure": 1001.0,
        "pressure_trend_3h": -3.0
    }
    wet_res = predictor.predict(wet_input)
    assert wet_res["success"] is True

    # Crisp dry anticyclonic conditions should produce low rain probability
    dry_input = {
        "temperature_2m": 22.0,
        "relative_humidity_2m": 35.0,
        "past_precip_3h": 0.0,
        "surface_pressure": 1025.0,
        "pressure_trend_3h": 1.5
    }
    dry_res = predictor.predict(dry_input)
    assert dry_res["success"] is True

    assert wet_res["rain_probability"] > dry_res["rain_probability"]
