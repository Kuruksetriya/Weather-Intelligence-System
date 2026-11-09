"""
Rule-Based Severe Weather Alert Engine.
Monitors atmospheric parameters against configurable risk thresholds for:
- Gale / High Wind speeds
- Extreme Heat & Frost / Freeze
- Heavy Precipitation & Flooding potential
- Severe Convective WMO codes (Thunderstorms, Hail, Freezing Rain)
"""

from typing import List
from backend.app.schemas.weather import (
    LocationInfo,
    CurrentWeatherData,
    WeatherAlertItem,
    AlertsResponse
)

class WeatherAlertEngine:
    # Configurable meteorological risk thresholds
    WIND_WARNING_KMH = 45.0
    WIND_ADVISORY_KMH = 32.0
    EXTREME_HEAT_C = 35.0
    HIGH_HEAT_C = 30.0
    FREEZE_WARNING_C = 0.0
    FROST_ADVISORY_C = 3.0
    HEAVY_PRECIP_MM = 4.0
    MODERATE_PRECIP_MM = 1.5

    @classmethod
    def evaluate_alerts(
        cls,
        location: LocationInfo,
        current: CurrentWeatherData
    ) -> AlertsResponse:
        alerts: List[WeatherAlertItem] = []

        temp = current.temperature
        wind = current.wind_speed
        precip = current.precipitation
        code = current.weather_code

        # 1. Convective / Severe Storm Alerts
        if code in [95, 96, 99]:
            alerts.append(
                WeatherAlertItem(
                    alert_id=f"alt-storm-{code}",
                    title="Severe Thunderstorm Risk Indicator",
                    severity="critical" if code in [96, 99] else "high",
                    category="Thunderstorm & Lightning",
                    trigger_parameter="WMO Weather Code",
                    measured_value=f"Code {code} ({current.condition})",
                    threshold="Code >= 95",
                    reason="Atmospheric instability has produced active electrical discharges, thunder, and possible hail.",
                    recommended_precautions=[
                        "Seek shelter in an enclosed, substantial building or hardtop vehicle.",
                        "Avoid open bodies of water, hilltops, and isolated trees.",
                        "Disconnect sensitive electronic equipment."
                    ]
                )
            )
        elif code in [66, 67, 56, 57]:
            alerts.append(
                WeatherAlertItem(
                    alert_id="alt-ice-rain",
                    title="Freezing Precipitation Risk",
                    severity="critical",
                    category="Winter Hazard",
                    trigger_parameter="WMO Weather Code",
                    measured_value=f"Code {code} ({current.condition})",
                    threshold="Freezing rain / drizzle detected",
                    reason="Precipitation is supercooled and freezes upon contact with sub-zero surfaces, creating dangerous glaze ice.",
                    recommended_precautions=[
                        "Avoid unnecessary vehicular travel as road friction drops to near-zero.",
                        "Be alert to falling tree limbs and downed utility power lines."
                    ]
                )
            )

        # 2. Wind Hazard Alerts
        if wind >= cls.WIND_WARNING_KMH:
            alerts.append(
                WeatherAlertItem(
                    alert_id="alt-wind-high",
                    title="High Wind Warning Indicator",
                    severity="high",
                    category="Wind Hazard",
                    trigger_parameter="wind_speed_10m",
                    measured_value=f"{wind:.1f} km/h",
                    threshold=f">= {cls.WIND_WARNING_KMH} km/h",
                    reason="Sustained high-velocity winds capable of structural damage, debris displacement, and travel disruption.",
                    recommended_precautions=[
                        "Fasten outdoor furniture, garbage containers, and loose yard objects.",
                        "Exercise caution when driving high-sided vehicles over bridges or open terrain.",
                        "Stay clear of older trees and power lines."
                    ]
                )
            )
        elif wind >= cls.WIND_ADVISORY_KMH:
            alerts.append(
                WeatherAlertItem(
                    alert_id="alt-wind-adv",
                    title="Brisk Wind Advisory Indicator",
                    severity="medium",
                    category="Wind Hazard",
                    trigger_parameter="wind_speed_10m",
                    measured_value=f"{wind:.1f} km/h",
                    threshold=f">= {cls.WIND_ADVISORY_KMH} km/h",
                    reason="Brisk wind gusts may affect lightweight canopies and outdoor activities.",
                    recommended_precautions=[
                        "Secure light outdoor umbrellas and awnings."
                    ]
                )
            )

        # 3. Thermal Extreme Alerts
        if temp >= cls.EXTREME_HEAT_C:
            alerts.append(
                WeatherAlertItem(
                    alert_id="alt-heat-ext",
                    title="Extreme Heat Danger Indicator",
                    severity="high",
                    category="Thermal Extreme",
                    trigger_parameter="temperature_2m",
                    measured_value=f"{temp:.1f} °C (Feels like {current.apparent_temperature:.1f} °C)",
                    threshold=f">= {cls.EXTREME_HEAT_C} °C",
                    reason="Prolonged exposure to extreme heat creates acute risks of heat cramps, exhaustion, and heatstroke.",
                    recommended_precautions=[
                        "Drink water frequently even before feeling thirsty.",
                        "Minimize direct sun exposure between 11:00 and 16:00.",
                        "Check on elderly individuals and never leave pets or children in parked cars."
                    ]
                )
            )
        elif temp <= cls.FREEZE_WARNING_C:
            alerts.append(
                WeatherAlertItem(
                    alert_id="alt-freeze-war",
                    title="Freeze Hazard Indicator",
                    severity="high",
                    category="Thermal Extreme",
                    trigger_parameter="temperature_2m",
                    measured_value=f"{temp:.1f} °C",
                    threshold=f"<= {cls.FREEZE_WARNING_C} °C",
                    reason="Sub-zero freezing temperatures will freeze wet surfaces, burst unprotected exposed plumbing, and damage sensitive vegetation.",
                    recommended_precautions=[
                        "Insulate exposed outdoor water spigots and irrigation valves.",
                        "Watch for invisible black ice on sidewalks and highway road bends.",
                        "Provide warm shelter for domestic animals."
                    ]
                )
            )

        # 4. Precipitation Alerts
        if precip >= cls.HEAVY_PRECIP_MM:
            alerts.append(
                WeatherAlertItem(
                    alert_id="alt-precip-heavy",
                    title="Heavy Precipitation & Ponding Risk",
                    severity="medium",
                    category="Hydrological Risk",
                    trigger_parameter="precipitation",
                    measured_value=f"{precip:.1f} mm/h",
                    threshold=f">= {cls.HEAVY_PRECIP_MM} mm/h",
                    reason="Intense precipitation rate may exceed local storm drain drainage capacities, causing roadway ponding.",
                    recommended_precautions=[
                        "Do not drive into water-covered road dips or underpasses of unknown depth.",
                        "Check basement sump pump operations if prone to water seepage."
                    ]
                )
            )

        # Determine overall severity
        has_alerts = len(alerts) > 0
        severities = [a.severity for a in alerts]
        if "critical" in severities:
            overall = "critical"
        elif "high" in severities:
            overall = "high"
        elif "medium" in severities:
            overall = "medium"
        elif "low" in severities:
            overall = "low"
        else:
            overall = "none"

        return AlertsResponse(
            location=location,
            has_active_alerts=has_alerts,
            active_alerts_count=len(alerts),
            overall_risk_severity=overall,
            disclaimer=(
                "Academic Disclaimer: These alerts are automated, rule-based indicators computed from live meteorological measurements. "
                "They do NOT replace official government emergency alerts or national meteorological bureau bulletins."
            ),
            alerts=alerts
        )
