"""
Router for Machine Learning Weather Prediction endpoints.
"""

from fastapi import APIRouter, Path, Query, HTTPException
from typing import Optional
from backend.app.services.weather_service import WeatherService
from backend.app.ml.inference import predictor_instance
from backend.app.schemas.weather import MLPredictionResponse

router = APIRouter(tags=["AI / ML Weather Prediction"])

@router.get("/prediction/{city}", response_model=MLPredictionResponse, summary="Get AI/ML rainfall prediction and atmospheric drivers")
async def get_ml_prediction(
    city: str = Path(..., description="Name of the city"),
    lat: Optional[float] = Query(None, description="Optional exact latitude"),
    lon: Optional[float] = Query(None, description="Optional exact longitude"),
    country: Optional[str] = Query(None, description="Optional country")
):
    """
    Feeds real-time local meteorological observations into our trained Machine Learning model
    to forecast rainfall probability for the immediate upcoming 1 to 3 hours, along with
    explainable key atmospheric drivers.
    """
    current = await WeatherService.get_current_weather(city, lat=lat, lon=lon, country=country)

    # Derive pressure trend if possible from forecast, or neutral baseline
    features = {
        "temperature_2m": current.temperature,
        "relative_humidity_2m": current.relative_humidity,
        "apparent_temperature": current.apparent_temperature,
        "surface_pressure": current.surface_pressure,
        "wind_speed_10m": current.wind_speed,
        "wind_direction_10m": current.wind_direction,
        "precipitation": current.precipitation,
        "past_precip_3h": current.precipitation,
        "pressure_trend_3h": -0.5 if current.weather_code >= 51 else 0.2,
        "humidity_trend_3h": 5.0 if current.weather_code >= 51 else -2.0
    }

    result = predictor_instance.predict(features)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "ML prediction failure"))

    return MLPredictionResponse(
        location=current.location,
        prediction_class=result["prediction_class"],
        prediction_label=result["prediction_label"],
        rain_probability=result["rain_probability"],
        rain_probability_percentage=result["rain_probability_percentage"],
        confidence_score=result["confidence_score"],
        model_name=result["model_name"],
        prediction_horizon=result["prediction_horizon"],
        explanation=result["explanation"],
        top_drivers=result["top_drivers"],
        model_metrics=result["model_metrics"],
        disclaimer=result["disclaimer"]
    )
