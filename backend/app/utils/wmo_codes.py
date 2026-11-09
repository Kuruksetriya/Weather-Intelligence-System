"""
WMO (World Meteorological Organization) Weather interpretation codes mapping.
Translates integer weather codes to human-readable condition descriptions and icon identifiers.
"""

WMO_CODE_MAP = {
    0: {"condition": "Clear Sky", "icon": "sun", "is_severe": False},
    1: {"condition": "Mainly Clear", "icon": "sun-cloud", "is_severe": False},
    2: {"condition": "Partly Cloudy", "icon": "cloud-sun", "is_severe": False},
    3: {"condition": "Overcast", "icon": "cloud", "is_severe": False},
    45: {"condition": "Fog", "icon": "cloud-fog", "is_severe": False},
    48: {"condition": "Depositing Rime Fog", "icon": "cloud-fog", "is_severe": False},
    51: {"condition": "Light Drizzle", "icon": "cloud-drizzle", "is_severe": False},
    53: {"condition": "Moderate Drizzle", "icon": "cloud-drizzle", "is_severe": False},
    55: {"condition": "Dense Drizzle", "icon": "cloud-drizzle", "is_severe": False},
    56: {"condition": "Light Freezing Drizzle", "icon": "cloud-snow", "is_severe": True},
    57: {"condition": "Dense Freezing Drizzle", "icon": "cloud-snow", "is_severe": True},
    61: {"condition": "Slight Rain", "icon": "cloud-rain", "is_severe": False},
    63: {"condition": "Moderate Rain", "icon": "cloud-rain", "is_severe": False},
    65: {"condition": "Heavy Rain", "icon": "cloud-rain", "is_severe": True},
    66: {"condition": "Light Freezing Rain", "icon": "cloud-snow", "is_severe": True},
    67: {"condition": "Heavy Freezing Rain", "icon": "cloud-snow", "is_severe": True},
    71: {"condition": "Slight Snow Fall", "icon": "cloud-snow", "is_severe": False},
    73: {"condition": "Moderate Snow Fall", "icon": "cloud-snow", "is_severe": True},
    75: {"condition": "Heavy Snow Fall", "icon": "cloud-snow", "is_severe": True},
    77: {"condition": "Snow Grains", "icon": "cloud-snow", "is_severe": False},
    80: {"condition": "Slight Rain Showers", "icon": "cloud-rain", "is_severe": False},
    81: {"condition": "Moderate Rain Showers", "icon": "cloud-rain", "is_severe": False},
    82: {"condition": "Violent Rain Showers", "icon": "cloud-lightning", "is_severe": True},
    85: {"condition": "Slight Snow Showers", "icon": "cloud-snow", "is_severe": False},
    86: {"condition": "Heavy Snow Showers", "icon": "cloud-snow", "is_severe": True},
    95: {"condition": "Thunderstorm", "icon": "cloud-lightning", "is_severe": True},
    96: {"condition": "Thunderstorm with Slight Hail", "icon": "cloud-lightning", "is_severe": True},
    99: {"condition": "Thunderstorm with Heavy Hail", "icon": "cloud-lightning", "is_severe": True},
}

def get_weather_description(code: int) -> dict:
    return WMO_CODE_MAP.get(code, {
        "condition": "Atmospheric Variation",
        "icon": "cloud",
        "is_severe": False
    })
