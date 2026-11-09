"""
Explainable Activity-Based Decision Support Engine.
Evaluates weather parameters against explicit meteorological thresholds for:
- Travel (road conditions, crosswinds, visibility, precipitation)
- Outdoor Events (temperature comfort, rain risk, wind interference)
- Sports (heat stress, wet field friction, ball aerodynamics)
- Agriculture (spraying drift, harvesting suitability, soil moisture advisory)
"""

from typing import Dict, Any, List
from backend.app.schemas.weather import (
    LocationInfo,
    CurrentWeatherData,
    ForecastResponse,
    MLPredictionResponse,
    RecommendationResponse
)

class ActivityDecisionEngine:
    @classmethod
    def evaluate(
        cls,
        activity: str,
        location: LocationInfo,
        current: CurrentWeatherData,
        forecast: ForecastResponse,
        prediction: MLPredictionResponse
    ) -> RecommendationResponse:
        activity_lower = activity.strip().lower()

        if activity_lower == "travel":
            return cls._evaluate_travel(location, current, forecast, prediction)
        elif activity_lower in ["outdoor events", "outdoor event", "events"]:
            return cls._evaluate_outdoor_events(location, current, forecast, prediction)
        elif activity_lower in ["sports", "outdoor sports"]:
            return cls._evaluate_sports(location, current, forecast, prediction)
        elif activity_lower in ["agriculture", "farming"]:
            return cls._evaluate_agriculture(location, current, forecast, prediction)
        else:
            # Fallback for unrecognized activity
            return cls._evaluate_travel(location, current, forecast, prediction)

    @classmethod
    def _evaluate_travel(
        cls,
        location: LocationInfo,
        current: CurrentWeatherData,
        forecast: ForecastResponse,
        prediction: MLPredictionResponse
    ) -> RecommendationResponse:
        score = 100
        penalties = []
        precautions = []

        temp = current.temperature
        wind = current.wind_speed
        precip = current.precipitation
        code = current.weather_code
        rain_prob = prediction.rain_probability_percentage

        # Severe WMO codes
        if code in [95, 96, 99]:  # Thunderstorm
            score -= 50
            penalties.append("Active thunderstorm activity present.")
            precautions.append("Delay non-essential highway travel until electrical storm cells pass.")
        elif code in [45, 48]:  # Fog
            score -= 30
            penalties.append("Dense fog restricting horizontal visibility.")
            precautions.append("Use low-beam fog headlights, increase following distance, and reduce cruising speed.")
        elif code in [71, 73, 75, 85, 86]:  # Snow
            score -= 40
            penalties.append("Active snowfall creates low friction and icy road conditions.")
            precautions.append("Verify winter tire suitability, carry emergency traction equipment.")

        # Rain & Precipitation
        if precip >= 5.0 or rain_prob >= 80:
            score -= 35
            penalties.append(f"Heavy precipitation or high rain probability ({rain_prob:.0f}%, {precip:.1f} mm/h).")
            precautions.append("Watch for surface hydroplaning risk and standing water in low-lying roadways.")
        elif precip > 0.5 or rain_prob >= 50:
            score -= 15
            penalties.append(f"Wet roadway surface conditions ({precip:.1f} mm/h, {rain_prob:.0f}% rain chance).")
            precautions.append("Maintain extended braking buffers on wet asphalt.")

        # Wind
        if wind >= 45:
            score -= 30
            penalties.append(f"Strong crosswinds ({wind:.1f} km/h).")
            precautions.append("High-profile vehicles, trailers, and motorcycles should reduce speed on exposed bridges.")
        elif wind >= 30:
            score -= 10
            penalties.append(f"Moderate gusty winds ({wind:.1f} km/h).")

        # Freezing road risk
        if temp <= 0:
            score -= 25
            penalties.append(f"Sub-zero temperature ({temp:.1f}°C) poses black ice hazard.")
            precautions.append("Treat bridges, overpasses, and shaded roadway bends with extreme caution.")

        score = max(0, min(100, score))

        if score >= 80:
            status = "Favorable"
            rec = "Favorable weather for road, rail, and air travel."
        elif score >= 55:
            status = "Suitable with Precautions"
            rec = "Travel with caution. Pavement conditions and minor gusts require alertness."
        elif score >= 35:
            status = "Caution Required"
            rec = "Challenging travel conditions. Expect travel delays and reduced transit speeds."
        else:
            status = "Unfavorable / Postpone"
            rec = "Unfavorable weather for travel. Consider rescheduling non-urgent travel."

        reason = " | ".join(penalties) if penalties else "Clear atmospheric conditions, good roadway visibility, and stable wind parameters."
        advice = "Ensure windshield wipers and tires are in good order; monitor real-time navigation for weather-related route slowdowns."

        return RecommendationResponse(
            activity="Travel",
            location=location,
            suitability_status=status,
            suitability_score=score,
            primary_recommendation=rec,
            reason=reason,
            weather_factors={
                "temperature_c": temp,
                "wind_speed_kmh": wind,
                "precipitation_mm": precip,
                "rain_prob_ml_pct": rain_prob,
                "weather_code": code
            },
            recommended_precautions=precautions if precautions else ["Standard safe driving protocols apply."],
            actionable_advice=advice
        )

    @classmethod
    def _evaluate_outdoor_events(
        cls,
        location: LocationInfo,
        current: CurrentWeatherData,
        forecast: ForecastResponse,
        prediction: MLPredictionResponse
    ) -> RecommendationResponse:
        score = 100
        penalties = []
        precautions = []

        temp = current.temperature
        rh = current.relative_humidity
        wind = current.wind_speed
        precip = current.precipitation
        code = current.weather_code
        rain_prob = prediction.rain_probability_percentage

        # Severe weather
        if code in [95, 96, 99]:
            score -= 60
            penalties.append("Severe lightning and convective storms pose direct safety hazards to open-air gatherings.")
            precautions.append("Designate grounded lightning-safe indoor shelter spaces immediately.")
        elif precip > 2.0 or rain_prob >= 75:
            score -= 40
            penalties.append(f"High rain probability ({rain_prob:.0f}%) and active wet weather.")
            precautions.append("Deploy waterproof event canopies, ground tarps, and covered stages for equipment.")
        elif rain_prob >= 40:
            score -= 20
            penalties.append(f"Moderate rainfall probability ({rain_prob:.0f}%) within the next 3 hours.")
            precautions.append("Have umbrellas and ponchos accessible for attendees.")

        # Wind impacts on canopies/tents
        if wind >= 38:
            score -= 35
            penalties.append(f"High wind speeds ({wind:.1f} km/h) threaten lightweight marquees, canopies, and stage scrims.")
            precautions.append("Secure all temporary structures with heavy ballast weights; anchor signage.")
        elif wind >= 25:
            score -= 15
            penalties.append(f"Noticeable breezes ({wind:.1f} km/h).")

        # Thermal comfort
        if temp >= 33 or current.apparent_temperature >= 35:
            score -= 30
            penalties.append(f"Excessive heat ({temp:.1f}°C, feels like {current.apparent_temperature:.1f}°C).")
            precautions.append("Set up shaded hydration stations and misting cooling fans.")
        elif temp <= 5:
            score -= 25
            penalties.append(f"Cold ambient temperature ({temp:.1f}°C).")
            precautions.append("Provide patio heaters, hot beverage stations, and windbreak panels.")

        score = max(0, min(100, score))

        if score >= 80:
            status = "Favorable"
            rec = "Suitable for outdoor events. Weather conditions are welcoming and stable."
        elif score >= 55:
            status = "Suitable with Precautions"
            rec = "Suitable with precautions. Implement rain/wind contingency measures."
        elif score >= 35:
            status = "Caution Required"
            rec = "Challenging conditions for outdoor events. Guest comfort will be significantly impacted."
        else:
            status = "Unfavorable / Postpone"
            rec = "Consider postponing or moving to an indoor alternative venue."

        reason = " | ".join(penalties) if penalties else "Pleasant thermal conditions, dry air, and gentle breeze support successful gatherings."
        advice = "Monitor 1-hour radar updates and verify anchor integrity for all open-air sound and seating equipment."

        return RecommendationResponse(
            activity="Outdoor Events",
            location=location,
            suitability_status=status,
            suitability_score=score,
            primary_recommendation=rec,
            reason=reason,
            weather_factors={
                "temperature_c": temp,
                "apparent_temperature_c": current.apparent_temperature,
                "wind_speed_kmh": wind,
                "precipitation_mm": precip,
                "rain_prob_ml_pct": rain_prob
            },
            recommended_precautions=precautions if precautions else ["Ensure general crowd comfort and basic shade."],
            actionable_advice=advice
        )

    @classmethod
    def _evaluate_sports(
        cls,
        location: LocationInfo,
        current: CurrentWeatherData,
        forecast: ForecastResponse,
        prediction: MLPredictionResponse
    ) -> RecommendationResponse:
        score = 100
        penalties = []
        precautions = []

        temp = current.temperature
        wind = current.wind_speed
        precip = current.precipitation
        rh = current.relative_humidity
        rain_prob = prediction.rain_probability_percentage
        code = current.weather_code

        # Lightning
        if code in [95, 96, 99]:
            score = 0
            penalties.append("Immediate lightning hazard: outdoor athletics must cease under standard safety protocols.")
            precautions.append("Enforce 30/30 lightning rule: suspend play and seek permanent indoor shelter.")
            return RecommendationResponse(
                activity="Sports",
                location=location,
                suitability_status="Unfavorable / Postpone",
                suitability_score=0,
                primary_recommendation="Unfavorable conditions. Suspend all outdoor sporting activities due to lightning.",
                reason="Active thunderstorm detected.",
                weather_factors={"temperature_c": temp, "weather_code": code},
                recommended_precautions=precautions,
                actionable_advice="Cease field play immediately until 30 minutes after last observed thunder."
            )

        # Rain & Field Slippery
        if precip >= 1.5 or rain_prob >= 75:
            score -= 40
            penalties.append(f"Active or imminent rain ({rain_prob:.0f}% prob) will waterlog grass fields and make courts slick.")
            precautions.append("Wear molded cleats on turf; monitor ball traction and player deceleration slipping.")
        elif precip > 0 or rain_prob >= 40:
            score -= 15
            penalties.append("Damp surface conditions reduce shoe-ground frictional grip.")

        # Wind
        if wind >= 35:
            score -= 30
            penalties.append(f"High winds ({wind:.1f} km/h) disrupt ball trajectories in tennis, golf, archery, and soccer.")
            precautions.append("Adjust tactical play for strong headwind/tailwind resistance.")
        elif wind >= 20:
            score -= 10
            penalties.append(f"Moderate wind speed ({wind:.1f} km/h).")

        # Heat Index
        if temp >= 32:
            score -= 35
            penalties.append(f"High heat index ({temp:.1f}°C, {rh:.0f}% RH) poses exertion heatstroke risks.")
            precautions.append("Mandate 10-minute hydration pauses every 25 minutes of continuous exercise.")
        elif temp <= 2:
            score -= 25
            penalties.append(f"Cold air temperature ({temp:.1f}°C) heightens muscle strain and respiratory irritation.")
            precautions.append("Extend dynamic warm-up drills and wear moisture-wicking thermal base layers.")

        score = max(0, min(100, score))

        if score >= 80:
            status = "Favorable"
            rec = "Suitable for outdoor sports. Excellent athletic performance window."
        elif score >= 55:
            status = "Suitable with Precautions"
            rec = "Suitable with precautions. Hydrate properly and account for field grip."
        elif score >= 35:
            status = "Caution Required"
            rec = "Marginal sports conditions. Heightened risk of slipping, ball deflection, or thermal strain."
        else:
            status = "Unfavorable / Postpone"
            rec = "Unfavorable conditions for outdoor sports. Consider indoor facility alternatives."

        reason = " | ".join(penalties) if penalties else "Optimal air temperature, firm footing, and calm winds support peak physical activity."
        advice = "Maintain pre-game dynamic mobility routines and check playing surfaces for puddles or ice patches."

        return RecommendationResponse(
            activity="Sports",
            location=location,
            suitability_status=status,
            suitability_score=score,
            primary_recommendation=rec,
            reason=reason,
            weather_factors={
                "temperature_c": temp,
                "wind_speed_kmh": wind,
                "relative_humidity_pct": rh,
                "rain_prob_ml_pct": rain_prob
            },
            recommended_precautions=precautions if precautions else ["Stay adequately hydrated throughout activity."],
            actionable_advice=advice
        )

    @classmethod
    def _evaluate_agriculture(
        cls,
        location: LocationInfo,
        current: CurrentWeatherData,
        forecast: ForecastResponse,
        prediction: MLPredictionResponse
    ) -> RecommendationResponse:
        score = 100
        penalties = []
        precautions = []

        temp = current.temperature
        wind = current.wind_speed
        precip = current.precipitation
        rain_prob = prediction.rain_probability_percentage
        code = current.weather_code

        # Spraying Drift Risk (Wind > 15 km/h causes pesticide/fertilizer drift; Wind < 3 km/h causes inversion)
        if wind >= 25:
            score -= 30
            penalties.append(f"High wind velocity ({wind:.1f} km/h) causes excessive pesticide/fertilizer chemical drift.")
            precautions.append("Halt foliar spraying operations until wind speeds drop below 15 km/h.")
        elif wind <= 3:
            score -= 10
            penalties.append("Very low wind speed may accompany temperature inversion layers.")

        # Rain Washout Risk (Rain wash off applied crop chemicals or delays field tractor access)
        if precip >= 1.0 or rain_prob >= 70:
            score -= 35
            penalties.append(f"Imminent rain probability ({rain_prob:.0f}%, {precip:.1f} mm) risks chemical wash-off and soil compaction.")
            precautions.append("Postpone spraying and soil tilling to prevent heavy machinery rutting wet soil.")
        elif rain_prob >= 40:
            score -= 15
            penalties.append(f"Moderate rain probability ({rain_prob:.0f}%).")
            precautions.append("Ensure any applied foliar treatments have at least a 2-4 hour rainfast drying window.")

        # Frost / Freeze
        if temp <= 1.0:
            score -= 40
            penalties.append(f"Near-freezing temperature ({temp:.1f}°C) poses frost damage to tender blooms or seedlings.")
            precautions.append("Activate frost protection methods (sprinklers, row covers, or smudge heating).")
        elif temp >= 35:
            score -= 25
            penalties.append(f"High heat ({temp:.1f}°C) causes crop evapotranspiration stress.")
            precautions.append("Schedule irrigation during early dawn or post-sunset to minimize evaporation losses.")

        score = max(0, min(100, score))

        if score >= 80:
            status = "Favorable"
            rec = "Favorable conditions for routine agricultural fieldwork, tilling, and planting."
        elif score >= 55:
            status = "Suitable with Precautions"
            rec = "Monitor weather closely. Fieldwork manageable but verify wind and rain intervals."
        elif score >= 35:
            status = "Caution Required"
            rec = "Potential weather concerns. Weather factors restrict chemical application and machinery operations."
        else:
            status = "Unfavorable / Postpone"
            rec = "Unfavorable agricultural conditions. Avoid spraying or field tractor transit."

        reason = " | ".join(penalties) if penalties else "Calm winds, balanced moisture, and moderate temperatures provide a productive agricultural operations window."
        advice = "Note: These rule-based indicators assist general scheduling and do not substitute certified local agronomic or soil extension advice."

        return RecommendationResponse(
            activity="Agriculture",
            location=location,
            suitability_status=status,
            suitability_score=score,
            primary_recommendation=rec,
            reason=reason,
            weather_factors={
                "temperature_c": temp,
                "wind_speed_kmh": wind,
                "precipitation_mm": precip,
                "rain_prob_ml_pct": rain_prob
            },
            recommended_precautions=precautions if precautions else ["Maintain standard operational field monitoring."],
            actionable_advice=advice
        )
