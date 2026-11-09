"""
Router for Severe Weather Risk Alerts.
"""

from fastapi import APIRouter, Path, Query
from typing import Optional
from backend.app.services.weather_service import WeatherService
from backend.app.alerts.engine import WeatherAlertEngine
from backend.app.schemas.weather import AlertsResponse

router = APIRouter(tags=["Severe Weather Alerts"])

@router.get("/alerts/{city}", response_model=AlertsResponse, summary="Get automated severe weather risk indicators")
async def get_weather_alerts(
    city: str = Path(..., description="Name of the city"),
    lat: Optional[float] = Query(None, description="Optional exact latitude"),
    lon: Optional[float] = Query(None, description="Optional exact longitude"),
    country: Optional[str] = Query(None, description="Optional country")
):
    """
    Evaluates live meteorological parameters against risk thresholds to detect high winds,
    extreme temperatures, intense precipitation, and thunderstorm hazards.
    """
    current = await WeatherService.get_current_weather(city, lat=lat, lon=lon, country=country)
    return WeatherAlertEngine.evaluate_alerts(current.location, current)

