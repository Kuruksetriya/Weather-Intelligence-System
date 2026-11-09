"""
Pydantic schemas for request validation and standardized API responses.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal

class LocationInfo(BaseModel):
    name: str
    country: str
    latitude: float
    longitude: float
    timezone: str = "UTC"
    elevation: Optional[float] = None

class CurrentWeatherData(BaseModel):
    location: LocationInfo
    temperature: float = Field(..., description="Temperature at 2m in Celsius")
    apparent_temperature: float = Field(..., description="Perceived temperature in Celsius")
    relative_humidity: float = Field(..., description="Relative humidity percentage")
    surface_pressure: float = Field(..., description="Surface atmospheric pressure in hPa")
    wind_speed: float = Field(..., description="Wind speed at 10m in km/h")
    wind_direction: float = Field(..., description="Wind direction in degrees")
    precipitation: float = Field(..., description="Current precipitation in mm")
    rain: float = Field(..., description="Rain amount in mm")
    weather_code: int = Field(..., description="WMO weather code")
    condition: str = Field(..., description="Human readable weather description")
    icon: str = Field(..., description="Weather icon identifier")
    is_day: int = Field(..., description="1 for day, 0 for night")
    observation_time: str

class HourlyForecastItem(BaseModel):
    time: str
    temperature: float
    relative_humidity: float
    precipitation_probability: float
    precipitation: float
    weather_code: int
    condition: str
    icon: str
    wind_speed: float

class DailyForecastItem(BaseModel):
    date: str
    max_temperature: float
    min_temperature: float
    precipitation_sum: float
    precipitation_probability_max: float
    max_wind_speed: float
    weather_code: int
    condition: str
    icon: str

class ForecastResponse(BaseModel):
    location: LocationInfo
    current: CurrentWeatherData
    hourly: List[HourlyForecastItem]
    daily: List[DailyForecastItem]

class MLPredictionResponse(BaseModel):
    location: LocationInfo
    prediction_class: int
    prediction_label: str
    rain_probability: float
    rain_probability_percentage: float
    confidence_score: float
    model_name: str
    prediction_horizon: str
    explanation: str
    top_drivers: List[str]
    model_metrics: Dict[str, Any]
    disclaimer: str

class WeatherIntelligenceResponse(BaseModel):
    location: LocationInfo
    meteorological_summary: str
    condition_analysis: str
    ml_synthesis: str
    overall_risk_level: Literal["Low", "Moderate", "High", "Severe"]
    key_insights: List[str]
    potential_risks: List[str]
    favorable_conditions: List[str]
    atmospheric_parameters: Dict[str, Any]

class RecommendationRequest(BaseModel):
    city: str = Field(..., description="Target city name")
    activity: Literal["Travel", "Outdoor Events", "Sports", "Agriculture"]
    lat: Optional[float] = None
    lon: Optional[float] = None
    country: Optional[str] = None


class RecommendationResponse(BaseModel):
    activity: str
    location: LocationInfo
    suitability_status: Literal["Favorable", "Suitable with Precautions", "Caution Required", "Unfavorable / Postpone"]
    suitability_score: int = Field(..., description="Score from 0 (very poor) to 100 (ideal)")
    primary_recommendation: str
    reason: str
    weather_factors: Dict[str, Any]
    recommended_precautions: List[str]
    actionable_advice: str

class WeatherAlertItem(BaseModel):
    alert_id: str
    title: str
    severity: Literal["low", "medium", "high", "critical"]
    category: str
    trigger_parameter: str
    measured_value: str
    threshold: str
    reason: str
    recommended_precautions: List[str]

class AlertsResponse(BaseModel):
    location: LocationInfo
    has_active_alerts: bool
    active_alerts_count: int
    overall_risk_severity: Literal["none", "low", "medium", "high", "critical"]
    disclaimer: str
    alerts: List[WeatherAlertItem]

class LocationSuggestion(BaseModel):
    id: Optional[int] = None
    name: str
    country: str
    admin1: Optional[str] = None
    latitude: float
    longitude: float
    display_name: str

