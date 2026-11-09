"""
Weather Intelligence Engine.
Synthesizes real-time observations, numerical forecasts, and machine learning predictions
into structured meteorological intelligence and risk assessments.
"""

from typing import Dict, Any, List
from backend.app.schemas.weather import (
    LocationInfo,
    CurrentWeatherData,
    ForecastResponse,
    MLPredictionResponse,
    WeatherIntelligenceResponse
)

class WeatherIntelligenceEngine:
    @classmethod
    def analyze(
        cls,
        location: LocationInfo,
        current: CurrentWeatherData,
        forecast: ForecastResponse,
        prediction: MLPredictionResponse
    ) -> WeatherIntelligenceResponse:
        insights: List[str] = []
        risks: List[str] = []
        favorable: List[str] = []

        temp = current.temperature
        rh = current.relative_humidity
        wind = current.wind_speed
        pressure = current.surface_pressure
        condition = current.condition
        rain_prob = prediction.rain_probability_percentage

        # 1. Temperature Analysis
        if temp >= 32.0:
            insights.append(f"Elevated thermal stress: Ambient temperature is {temp:.1f}°C (perceived as {current.apparent_temperature:.1f}°C).")
            risks.append("Risk of heat fatigue, dehydration, and increased cooling energy demand.")
        elif temp <= 3.0:
            insights.append(f"Near-freezing temperature ({temp:.1f}°C) observed. Potential for frost crystallization.")
            risks.append("Risk of black ice on road surfaces and cold exposure discomfort.")
        elif 18.0 <= temp <= 26.0:
            insights.append(f"Optimal thermal comfort zone: Mild ambient temperature ({temp:.1f}°C).")
            favorable.append("Ideal thermal comfort for general outdoor movement and recreation.")
        else:
            insights.append(f"Moderate ambient temperature ({temp:.1f}°C).")

        # 2. Moisture & Precipitation Analysis
        if current.precipitation > 0.0 or current.rain > 0.0:
            insights.append(f"Active precipitation occurring ({current.precipitation:.1f} mm/h). Current condition: {condition}.")
            risks.append("Slick road surfaces, reduced pavement traction, and lowered visibility.")
        elif rh >= 85.0:
            insights.append(f"Atmosphere is near water vapor saturation with relative humidity at {rh:.0f}%.")
            risks.append("High humidity suppresses sweat evaporation and promotes condensation/mist formation.")
        elif rh <= 30.0:
            insights.append(f"Very dry airmass detected ({rh:.0f}% RH).")
            favorable.append("Low humidity prevents mugginess and enhances convective cooling.")

        # 3. Wind Dynamic Analysis
        if wind >= 40.0:
            insights.append(f"High wind velocity detected: Sustained gusts at {wind:.1f} km/h.")
            risks.append("Hazardous crosswinds for high-profile vehicles, light structures, and airborne activities.")
        elif wind <= 12.0:
            favorable.append(f"Gentle air movement ({wind:.1f} km/h) provides stable, calm conditions.")
        else:
            insights.append(f"Moderate breezes ({wind:.1f} km/h).")

        # 4. Barometric Pressure Dynamics
        if pressure < 1005.0:
            insights.append(f"Depressed surface pressure ({pressure:.1f} hPa) indicates an active low-pressure trough.")
            risks.append("Barometric instability typically accompanies cloudy, turbulent, and wet weather patterns.")
        elif pressure > 1022.0:
            insights.append(f"High barometric pressure ({pressure:.1f} hPa) reflects a stable anticyclone.")
            favorable.append("Anticyclonic conditions suppress widespread cloud development and precipitation.")

        # 5. Plain-Language Weather Synthesis
        if rain_prob >= 70.0:
            ml_synthesis = (
                f"Rain is very likely in the near term, with a {rain_prob:.1f}% chance. "
                f"Atmospheric conditions favor precipitation."
            )
            risks.append(f"Imminent rain likelihood estimated at {rain_prob:.1f}%.")
        elif rain_prob >= 50.0:
            ml_synthesis = (
                f"Rain is likely in the near term, with a {rain_prob:.1f}% chance. "
                f"Atmospheric conditions favor precipitation."
            )
            risks.append(f"Imminent rain likelihood estimated at {rain_prob:.1f}%.")
        elif rain_prob <= 25.0:
            ml_synthesis = (
                f"Rain is unlikely in the near term, with a {rain_prob:.1f}% chance. "
                f"Atmospheric conditions remain stable."
            )
            favorable.append("Imminent precipitation unlikely based on atmospheric patterns.")
        else:
            ml_synthesis = (
                f"Rain is unlikely in the near term, with a {rain_prob:.1f}% chance. "
                f"Atmospheric conditions are changing."
            )

        # 6. Overall Risk Level Assessment
        if wind >= 50.0 or temp >= 38.0 or temp <= -5.0 or current.weather_code in [82, 86, 95, 96, 99]:
            overall_risk = "Severe"
        elif wind >= 35.0 or rain_prob >= 70.0 or current.precipitation >= 2.5 or temp >= 33.0 or temp <= 0.0:
            overall_risk = "High"
        elif wind >= 25.0 or rain_prob >= 40.0 or rh >= 85.0:
            overall_risk = "Moderate"
        else:
            overall_risk = "Low"

        # Summary narrative
        summary = (
            f"Currently in {location.name}, conditions are {condition.lower()} at {temp:.1f}°C with {rh:.0f}% humidity "
            f"and winds at {wind:.1f} km/h from {current.wind_direction:.0f}°. "
            f"Atmospheric stability is evaluated as {overall_risk.lower()} risk."
        )

        condition_analysis = (
            f"Analysis of current surface parameters indicates a {condition.lower()} state with barometric pressure "
            f"at {pressure:.1f} hPa. Dew point and moisture levels reflect {'saturated/near-saturated' if rh >= 80 else 'unsaturated'} air. "
            f"Upcoming 24-hour forecast projects precipitation probability peaking at {max([h.precipitation_probability for h in forecast.hourly[:24]] or [0]):.0f}%."
        )

        return WeatherIntelligenceResponse(
            location=location,
            meteorological_summary=summary,
            condition_analysis=condition_analysis,
            ml_synthesis=ml_synthesis,
            overall_risk_level=overall_risk,
            key_insights=insights[:5],
            potential_risks=risks if risks else ["No significant meteorological hazards identified at present."],
            favorable_conditions=favorable if favorable else ["Stable baseline atmospheric parameters."],
            atmospheric_parameters={
                "temperature_c": temp,
                "feels_like_c": current.apparent_temperature,
                "relative_humidity_pct": rh,
                "surface_pressure_hpa": pressure,
                "wind_speed_kmh": wind,
                "wind_direction_deg": current.wind_direction,
                "rain_prob_ml_pct": rain_prob,
                "is_day": bool(current.is_day)
            }
        )
