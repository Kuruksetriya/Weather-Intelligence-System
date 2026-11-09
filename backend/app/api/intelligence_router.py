"""
Router for Weather Intelligence endpoints.
"""

from fastapi import APIRouter, Path, Query
from typing import Optional
from backend.app.services.weather_service import WeatherService
from backend.app.intelligence.engine import WeatherIntelligenceEngine
from backend.app.api.prediction_router import get_ml_prediction
from backend.app.schemas.weather import WeatherIntelligenceResponse

router = APIRouter(tags=["Weather Intelligence"])

@router.get("/intelligence/{city}", response_model=WeatherIntelligenceResponse, summary="Synthesized weather intelligence and risk analysis")
async def get_weather_intelligence(
    city: str = Path(..., description="Name of the city"),
    lat: Optional[float] = Query(None, description="Optional exact latitude"),
    lon: Optional[float] = Query(None, description="Optional exact longitude"),
    country: Optional[str] = Query(None, description="Optional country")
):
    """
    Synthesizes live weather conditions, 24h numerical forecasts, and ML predictions
    to produce comprehensive meteorological intelligence, risks, and favorable conditions.
    """
    forecast = await WeatherService.get_forecast(city, lat=lat, lon=lon, country=country)
    prediction = await get_ml_prediction(city, lat=lat, lon=lon, country=country)

    return WeatherIntelligenceEngine.analyze(
        location=forecast.location,
        current=forecast.current,
        forecast=forecast,
        prediction=prediction
    )
