"""
Router for Activity-Based Decision Support recommendations.
"""

from fastapi import APIRouter
from backend.app.services.weather_service import WeatherService
from backend.app.recommendation.engine import ActivityDecisionEngine
from backend.app.api.prediction_router import get_ml_prediction
from backend.app.schemas.weather import RecommendationRequest, RecommendationResponse

router = APIRouter(tags=["Activity Decision Support"])

@router.post("/recommendation", response_model=RecommendationResponse, summary="Generate explainable activity-based weather recommendation")
async def generate_recommendation(request: RecommendationRequest):
    """
    Evaluates current and upcoming atmospheric conditions against meteorological thresholds
    for Travel, Outdoor Events, Sports, or Agriculture to deliver explainable advice and precautions.
    """
    forecast = await WeatherService.get_forecast(request.city, lat=request.lat, lon=request.lon, country=request.country)
    prediction = await get_ml_prediction(request.city, lat=request.lat, lon=request.lon, country=request.country)

    return ActivityDecisionEngine.evaluate(
        activity=request.activity,
        location=forecast.location,
        current=forecast.current,
        forecast=forecast,
        prediction=prediction
    )
