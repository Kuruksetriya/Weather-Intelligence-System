"""
Router for Weather and Forecast API endpoints.
"""

from fastapi import APIRouter, Path, Query
from typing import List, Optional
from backend.app.services.weather_service import WeatherService
from backend.app.schemas.weather import CurrentWeatherData, ForecastResponse, LocationSuggestion

router = APIRouter(tags=["Weather & Forecast"])

@router.get("/search/locations", response_model=List[LocationSuggestion], summary="Search location suggestions with auto-complete")
async def search_locations(
    query: Optional[str] = Query(None, description="Partial search query (e.g. 'G', 'Lon', 'Tokyo')"),
    lat: Optional[float] = Query(None, description="Optional reference latitude for nearby suggested cities"),
    lon: Optional[float] = Query(None, description="Optional reference longitude for nearby suggested cities"),
    limit: int = Query(8, ge=1, le=20)
):
    """
    Returns auto-complete city suggestions as the user types, matching prefix and substring,
    or real nearby suggested cities if query is empty.
    """
    return await WeatherService.search_locations(query=query, lat=lat, lon=lon, limit=limit)

@router.get("/reverse-geocode", response_model=LocationSuggestion, summary="Reverse geocode coordinates into city name")
async def reverse_geocode_location(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude")
):
    """
    Translates device GPS latitude and longitude into an identifiable city name and country.
    """
    return await WeatherService.reverse_geocode(lat, lon)

@router.get("/weather/{city}", response_model=CurrentWeatherData, summary="Get real-time current weather conditions")
async def get_current_weather(
    city: str = Path(..., description="Name of the city (e.g. London, Tokyo, New York)"),
    lat: Optional[float] = Query(None, description="Optional exact latitude"),
    lon: Optional[float] = Query(None, description="Optional exact longitude"),
    country: Optional[str] = Query(None, description="Optional country")
):
    """
    Retrieves real-time atmospheric conditions for the queried city or exact GPS coordinates.
    """
    return await WeatherService.get_current_weather(city, lat=lat, lon=lon, country=country)

@router.get("/forecast/{city}", response_model=ForecastResponse, summary="Get 24-hour hourly and 7-day weather forecast")
async def get_weather_forecast(
    city: str = Path(..., description="Name of the city"),
    lat: Optional[float] = Query(None, description="Optional exact latitude"),
    lon: Optional[float] = Query(None, description="Optional exact longitude"),
    country: Optional[str] = Query(None, description="Optional country")
):
    """
    Retrieves comprehensive 24-hour hourly progression and 7-day extended forecasts.
    """
    return await WeatherService.get_forecast(city, lat=lat, lon=lon, country=country)

