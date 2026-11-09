"""
Service for interacting with Open-Meteo Geocoding and Forecast APIs.
Features in-memory TTL caching, WMO weather translation, and error resiliency.
"""

import httpx
import time
from typing import Dict, Any, Tuple, List, Optional
from fastapi import HTTPException
from backend.app.schemas.weather import (
    LocationInfo,
    CurrentWeatherData,
    HourlyForecastItem,
    DailyForecastItem,
    ForecastResponse,
    LocationSuggestion
)
from backend.app.utils.wmo_codes import get_weather_description

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# In-memory cache: {key: (timestamp, data)}
_CACHE: Dict[str, Tuple[float, Any]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes

class WeatherService:
    @staticmethod
    def _get_from_cache(key: str):
        if key in _CACHE:
            ts, data = _CACHE[key]
            if time.time() - ts < CACHE_TTL_SECONDS:
                return data
            else:
                del _CACHE[key]
        return None

    @staticmethod
    def _save_to_cache(key: str, data: Any):
        _CACHE[key] = (time.time(), data)

    @classmethod
    async def geocode_city(cls, city: str) -> LocationInfo:
        city_clean = city.strip().lower()
        cache_key = f"geo:{city_clean}"
        cached = cls._get_from_cache(cache_key)
        if cached:
            return cached

        # Parse city and possible comma-separated hints (e.g. "Azara, India" or "Ahomgaon, Assam")
        parts = [p.strip() for p in city.split(",") if p.strip()]
        main_name = parts[0] if parts else city.strip()
        hints = [p.lower() for p in parts[1:]]

        params = {
            "name": main_name,
            "count": 10,
            "language": "en",
            "format": "json"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(GEOCODING_URL, params=params)
                res.raise_for_status()
                data = res.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"External geocoding service error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Geocoding request failed: {str(e)}")

        results = data.get("results")
        if not results or len(results) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Location '{city}' could not be resolved. Please verify spelling or specify country."
            )

        # If user provided hints (e.g. "India", "Assam"), filter candidates by matching country or admin area
        if hints:
            filtered = []
            for r in results:
                target_text = f"{r.get('country', '')} {r.get('admin1', '')} {r.get('admin2', '')}".lower()
                if any(h in target_text for h in hints):
                    filtered.append(r)
            if filtered:
                results = filtered

        # Prioritize exact name matches and sort by population descending to prefer major cities over small villages
        exact_matches = [r for r in results if r.get("name", "").strip().lower() == main_name.lower()]
        pool_to_sort = exact_matches if exact_matches else results
        sorted_results = sorted(pool_to_sort, key=lambda x: x.get("population", 0) or 0, reverse=True)

        top = sorted_results[0]
        location = LocationInfo(
            name=top.get("name", main_name.title()),
            country=top.get("country", "Unknown"),
            latitude=float(top["latitude"]),
            longitude=float(top["longitude"]),
            timezone=top.get("timezone", "UTC"),
            elevation=top.get("elevation")
        )

        cls._save_to_cache(cache_key, location)
        return location

    @classmethod
    async def get_forecast_data(
        cls,
        city: str,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        name: Optional[str] = None,
        country: Optional[str] = None
    ) -> Tuple[LocationInfo, dict]:
        # If precise GPS coordinates are supplied, use them directly without ambiguous name search
        if lat is not None and lon is not None:
            cache_key = f"forecast_raw:{round(lat, 4)}:{round(lon, 4)}"
            cached = cls._get_from_cache(cache_key)

            loc_name = name or city or "Current Location"
            loc_country = country or "Unknown"
            if loc_country == "Unknown":
                try:
                    rev = await cls.reverse_geocode(lat, lon)
                    loc_name = rev.name
                    loc_country = rev.country
                except Exception:
                    pass

            location = LocationInfo(
                name=loc_name,
                country=loc_country,
                latitude=lat,
                longitude=lon,
                timezone="auto"
            )

            if cached:
                return location, cached

            params = {
                "latitude": lat,
                "longitude": lon,
                "current": [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "is_day",
                    "precipitation",
                    "rain",
                    "weather_code",
                    "surface_pressure",
                    "wind_speed_10m",
                    "wind_direction_10m"
                ],
                "hourly": [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "precipitation_probability",
                    "precipitation",
                    "weather_code",
                    "wind_speed_10m"
                ],
                "daily": [
                    "weather_code",
                    "temperature_2m_max",
                    "temperature_2m_min",
                    "precipitation_sum",
                    "precipitation_probability_max",
                    "wind_speed_10m_max"
                ],
                "timezone": "auto"
            }

            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get(FORECAST_URL, params=params)
                    res.raise_for_status()
                    data = res.json()
            except httpx.HTTPError as e:
                raise HTTPException(status_code=502, detail=f"Open-Meteo Forecast API error: {str(e)}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to fetch forecast: {str(e)}")

            cls._save_to_cache(cache_key, data)
            if "timezone" in data:
                location.timezone = data["timezone"]
            if "elevation" in data:
                location.elevation = data.get("elevation")
            return location, data

        location = await cls.geocode_city(city)
        cache_key = f"forecast_raw:{location.latitude}:{location.longitude}"
        cached = cls._get_from_cache(cache_key)
        if cached:
            return location, cached

        params = {
            "latitude": location.latitude,
            "longitude": location.longitude,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "is_day",
                "precipitation",
                "rain",
                "weather_code",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m"
            ],
            "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation_probability",
                "precipitation",
                "weather_code",
                "wind_speed_10m"
            ],
            "daily": [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "precipitation_probability_max",
                "wind_speed_10m_max"
            ],
            "timezone": location.timezone or "auto"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(FORECAST_URL, params=params)
                res.raise_for_status()
                data = res.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Open-Meteo Forecast API error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch forecast: {str(e)}")

        cls._save_to_cache(cache_key, data)
        return location, data

    @classmethod
    async def get_current_weather(
        cls,
        city: str,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        name: Optional[str] = None,
        country: Optional[str] = None
    ) -> CurrentWeatherData:
        location, raw = await cls.get_forecast_data(city, lat=lat, lon=lon, name=name, country=country)
        cur = raw.get("current", {})
        code = int(cur.get("weather_code", 0))
        meta = get_weather_description(code)

        return CurrentWeatherData(
            location=location,
            temperature=float(cur.get("temperature_2m", 0.0)),
            apparent_temperature=float(cur.get("apparent_temperature", 0.0)),
            relative_humidity=float(cur.get("relative_humidity_2m", 0.0)),
            surface_pressure=float(cur.get("surface_pressure", 1013.25)),
            wind_speed=float(cur.get("wind_speed_10m", 0.0)),
            wind_direction=float(cur.get("wind_direction_10m", 0.0)),
            precipitation=float(cur.get("precipitation", 0.0)),
            rain=float(cur.get("rain", 0.0)),
            weather_code=code,
            condition=meta["condition"],
            icon=meta["icon"],
            is_day=int(cur.get("is_day", 1)),
            observation_time=str(cur.get("time", ""))
        )

    @classmethod
    async def get_forecast(
        cls,
        city: str,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        name: Optional[str] = None,
        country: Optional[str] = None
    ) -> ForecastResponse:
        location, raw = await cls.get_forecast_data(city, lat=lat, lon=lon, name=name, country=country)
        current = await cls.get_current_weather(city, lat=lat, lon=lon, name=name, country=country)

        # Process Hourly (provide 48 hours to cover today and next day for seamless midnight boundary transitions)
        hourly_raw = raw.get("hourly", {})
        hourly_times = hourly_raw.get("time", [])
        hourly_items = []
        limit = min(48, len(hourly_times))

        for i in range(limit):
            code = int(hourly_raw.get("weather_code", [0])[i])
            meta = get_weather_description(code)
            hourly_items.append(
                HourlyForecastItem(
                    time=str(hourly_times[i]),
                    temperature=float(hourly_raw.get("temperature_2m", [0.0])[i]),
                    relative_humidity=float(hourly_raw.get("relative_humidity_2m", [0.0])[i]),
                    precipitation_probability=float(hourly_raw.get("precipitation_probability", [0.0])[i]),
                    precipitation=float(hourly_raw.get("precipitation", [0.0])[i]),
                    weather_code=code,
                    condition=meta["condition"],
                    icon=meta["icon"],
                    wind_speed=float(hourly_raw.get("wind_speed_10m", [0.0])[i])
                )
            )

        # Process Daily (next 7 days)
        daily_raw = raw.get("daily", {})
        daily_times = daily_raw.get("time", [])
        daily_items = []
        day_limit = min(7, len(daily_times))

        for i in range(day_limit):
            code = int(daily_raw.get("weather_code", [0])[i])
            meta = get_weather_description(code)
            daily_items.append(
                DailyForecastItem(
                    date=str(daily_times[i]),
                    max_temperature=float(daily_raw.get("temperature_2m_max", [0.0])[i]),
                    min_temperature=float(daily_raw.get("temperature_2m_min", [0.0])[i]),
                    precipitation_sum=float(daily_raw.get("precipitation_sum", [0.0])[i]),
                    precipitation_probability_max=float(daily_raw.get("precipitation_probability_max", [0.0])[i]),
                    max_wind_speed=float(daily_raw.get("wind_speed_10m_max", [0.0])[i]),
                    weather_code=code,
                    condition=meta["condition"],
                    icon=meta["icon"]
                )
            )

        return ForecastResponse(
            location=location,
            current=current,
            hourly=hourly_items,
            daily=daily_items
        )

    @classmethod
    async def search_locations(
        cls,
        query: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        limit: int = 8
    ) -> List[LocationSuggestion]:
        query_clean = (query or "").strip()

        # If query is empty, return real suggested cities near the reference lat/lon
        if not query_clean:
            import math
            def haversine(lat1, lon1, lat2, lon2):
                R = 6371.0
                dlat = math.radians(lat2 - lat1)
                dlon = math.radians(lon2 - lon1)
                a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
                return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

            if lat is not None and lon is not None:
                # Filter out the active location itself (within 20km) and sort by distance
                candidates = [c for c in POPULAR_GLOBAL_CITIES if haversine(lat, lon, c["lat"], c["lon"]) > 20]
                sorted_nearby = sorted(candidates, key=lambda c: haversine(lat, lon, c["lat"], c["lon"]))
                pool = sorted_nearby[:limit]
            else:
                pool = POPULAR_GLOBAL_CITIES[:limit]

            suggestions = []
            for c in pool:
                disp = f"{c['name']}, {c['country']}"
                if c.get("admin1"):
                    disp = f"{c['name']}, {c['admin1']}, {c['country']}"
                suggestions.append(
                    LocationSuggestion(
                        name=c["name"],
                        country=c["country"],
                        admin1=c.get("admin1"),
                        latitude=c["lat"],
                        longitude=c["lon"],
                        display_name=disp
                    )
                )
            return suggestions

        suggestions: List[LocationSuggestion] = []
        seen_names = set()

        # 1. First, check curated global major cities, prioritizing prefix matches (starts with)
        q_lower = query_clean.lower()
        prefix_matches = []
        substring_matches = []
        for c in POPULAR_GLOBAL_CITIES:
            c_name_lower = c["name"].lower()
            if c_name_lower.startswith(q_lower):
                prefix_matches.append(c)
            elif q_lower in c_name_lower:
                substring_matches.append(c)

        for c in (prefix_matches + substring_matches):
            key = f"{c['name'].lower()}:{c['country'].lower()}"
            if key not in seen_names:
                seen_names.add(key)
                disp = f"{c['name']}, {c['country']}"
                if c.get("admin1"):
                    disp = f"{c['name']}, {c['admin1']}, {c['country']}"
                suggestions.append(
                    LocationSuggestion(
                        name=c["name"],
                        country=c["country"],
                        admin1=c.get("admin1"),
                        latitude=c["lat"],
                        longitude=c["lon"],
                        display_name=disp
                    )
                )
            if len(suggestions) >= limit:
                break

        # 2. If query has 2 or more characters and we have space, query live Open-Meteo Geocoding API
        if len(query_clean) >= 2 and len(suggestions) < limit:
            try:
                params = {
                    "name": query_clean,
                    "count": limit,
                    "language": "en",
                    "format": "json"
                }
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.get(GEOCODING_URL, params=params)
                    if res.status_code == 200:
                        data = res.json()
                        results = data.get("results", [])
                        for item in results:
                            name = item.get("name")
                            country = item.get("country", "")
                            admin1 = item.get("admin1", "")
                            key = f"{name.lower()}:{country.lower()}"
                            if key not in seen_names:
                                seen_names.add(key)
                                parts = [name]
                                if admin1 and admin1 != name:
                                    parts.append(admin1)
                                if country:
                                    parts.append(country)
                                suggestions.append(
                                    LocationSuggestion(
                                        id=item.get("id"),
                                        name=name,
                                        country=country,
                                        admin1=admin1,
                                        latitude=float(item.get("latitude", 0.0)),
                                        longitude=float(item.get("longitude", 0.0)),
                                        display_name=", ".join(parts)
                                    )
                                )
                            if len(suggestions) >= limit:
                                break
            except Exception:
                # If network or geocoding fails, fallback gracefully to whatever we matched
                pass

        return suggestions[:limit]

    @classmethod
    async def reverse_geocode(cls, lat: float, lon: float) -> LocationSuggestion:
        cache_key = f"rev:{round(lat, 3)}:{round(lon, 3)}"
        cached = cls._get_from_cache(cache_key)
        if cached:
            return cached

        city_name = None
        country_name = "Unknown"
        admin1 = None

        # 1. Try Nominatim reverse geocoding API
        try:
            url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url, headers={"User-Agent": "WeatherIntelAcademicApp/1.0"})
                if res.status_code == 200:
                    data = res.json()
                    addr = data.get("address", {})
                    suburb = addr.get("suburb") or addr.get("neighbourhood") or addr.get("residential") or addr.get("village")
                    city = addr.get("city") or addr.get("town") or addr.get("municipality") or addr.get("county")
                    state = addr.get("state") or addr.get("state_district")
                    country_name = addr.get("country", "Unknown")
                    admin1 = state

                    if suburb and city and suburb.lower() != city.lower():
                        city_name = f"{suburb}, {city}"
                    elif suburb:
                        city_name = f"{suburb}, {state}" if state else suburb
                    elif city:
                        city_name = city
                    elif state:
                        city_name = state
                    else:
                        city_name = "Current Location"

                    disp_parts = []
                    for part in [suburb, city, state, country_name]:
                        if part and part not in disp_parts and part != "Unknown":
                            disp_parts.append(part)
                    display_name = ", ".join(disp_parts) if disp_parts else city_name
        except Exception:
            pass

        # 2. If reverse geocoding is unavailable, find closest major city using Haversine formula
        if not city_name:
            import math
            def haversine(lat1, lon1, lat2, lon2):
                R = 6371.0
                dlat = math.radians(lat2 - lat1)
                dlon = math.radians(lon2 - lon1)
                a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
                return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

            closest = min(POPULAR_GLOBAL_CITIES, key=lambda c: haversine(lat, lon, c["lat"], c["lon"]))
            city_name = closest["name"]
            country_name = closest["country"]
            admin1 = closest.get("admin1")

        disp_parts = [city_name]
        if admin1 and admin1 != city_name:
            disp_parts.append(admin1)
        if country_name and country_name != "Unknown":
            disp_parts.append(country_name)
        display_name = ", ".join(disp_parts)

        result = LocationSuggestion(
            name=city_name,
            country=country_name,
            admin1=admin1,
            latitude=lat,
            longitude=lon,
            display_name=display_name
        )
        cls._save_to_cache(cache_key, result)
        return result

POPULAR_GLOBAL_CITIES = [
    {"name": "Amsterdam", "country": "Netherlands", "admin1": "North Holland", "lat": 52.37, "lon": 4.89},
    {"name": "Athens", "country": "Greece", "admin1": "Attica", "lat": 37.98, "lon": 23.72},
    {"name": "Bangkok", "country": "Thailand", "admin1": "Bangkok", "lat": 13.75, "lon": 100.51},
    {"name": "Barcelona", "country": "Spain", "admin1": "Catalonia", "lat": 41.38, "lon": 2.17},
    {"name": "Beijing", "country": "China", "admin1": "Beijing", "lat": 39.90, "lon": 116.40},
    {"name": "Berlin", "country": "Germany", "admin1": "Berlin", "lat": 52.52, "lon": 13.41},
    {"name": "Bengaluru", "country": "India", "admin1": "Karnataka", "lat": 12.97, "lon": 77.59},
    {"name": "Birmingham", "country": "United Kingdom", "admin1": "England", "lat": 52.48, "lon": -1.89},
    {"name": "Boston", "country": "United States", "admin1": "Massachusetts", "lat": 42.36, "lon": -71.05},
    {"name": "Brussels", "country": "Belgium", "admin1": "Brussels-Capital", "lat": 50.85, "lon": 4.35},
    {"name": "Cairo", "country": "Egypt", "admin1": "Cairo", "lat": 30.04, "lon": 31.23},
    {"name": "Chicago", "country": "United States", "admin1": "Illinois", "lat": 41.87, "lon": -87.62},
    {"name": "Chennai", "country": "India", "admin1": "Tamil Nadu", "lat": 13.08, "lon": 80.27},
    {"name": "Copenhagen", "country": "Denmark", "admin1": "Capital Region", "lat": 55.67, "lon": 12.56},
    {"name": "Delhi", "country": "India", "admin1": "Delhi", "lat": 28.61, "lon": 77.20},
    {"name": "New Delhi", "country": "India", "admin1": "Delhi", "lat": 28.6139, "lon": 77.2090},
    {"name": "Dubai", "country": "United Arab Emirates", "admin1": "Dubai", "lat": 25.20, "lon": 55.27},
    {"name": "Dublin", "country": "Ireland", "admin1": "Leinster", "lat": 53.34, "lon": -6.26},
    {"name": "Edinburgh", "country": "United Kingdom", "admin1": "Scotland", "lat": 55.95, "lon": -3.18},
    {"name": "Frankfurt", "country": "Germany", "admin1": "Hesse", "lat": 50.11, "lon": 8.68},
    {"name": "Geneva", "country": "Switzerland", "admin1": "Geneva", "lat": 46.20, "lon": 6.14},
    {"name": "Glasgow", "country": "United Kingdom", "admin1": "Scotland", "lat": 55.86, "lon": -4.25},
    {"name": "Guangzhou", "country": "China", "admin1": "Guangdong", "lat": 23.12, "lon": 113.26},
    {"name": "Guwahati", "country": "India", "admin1": "Assam", "lat": 26.18, "lon": 91.73},
    {"name": "Helsinki", "country": "Finland", "admin1": "Uusimaa", "lat": 60.16, "lon": 24.93},
    {"name": "Hong Kong", "country": "Hong Kong", "admin1": "Hong Kong", "lat": 22.31, "lon": 114.16},
    {"name": "Hyderabad", "country": "India", "admin1": "Telangana", "lat": 17.38, "lon": 78.48},
    {"name": "Istanbul", "country": "Turkey", "admin1": "Istanbul", "lat": 41.00, "lon": 28.97},
    {"name": "Jaipur", "country": "India", "admin1": "Rajasthan", "lat": 26.91, "lon": 75.78},
    {"name": "Jakarta", "country": "Indonesia", "admin1": "Jakarta", "lat": -6.20, "lon": 106.84},
    {"name": "Johannesburg", "country": "South Africa", "admin1": "Gauteng", "lat": -26.20, "lon": 28.04},
    {"name": "Kolkata", "country": "India", "admin1": "West Bengal", "lat": 22.57, "lon": 88.36},
    {"name": "Kuala Lumpur", "country": "Malaysia", "admin1": "Federal Territory", "lat": 3.13, "lon": 101.68},
    {"name": "Kyoto", "country": "Japan", "admin1": "Kyoto", "lat": 35.01, "lon": 135.76},
    {"name": "Lisbon", "country": "Portugal", "admin1": "Lisbon", "lat": 38.72, "lon": -9.13},
    {"name": "London", "country": "United Kingdom", "admin1": "England", "lat": 51.50, "lon": -0.12},
    {"name": "Los Angeles", "country": "United States", "admin1": "California", "lat": 34.05, "lon": -118.24},
    {"name": "Madrid", "country": "Spain", "admin1": "Madrid", "lat": 40.41, "lon": -3.70},
    {"name": "Manchester", "country": "United Kingdom", "admin1": "England", "lat": 53.48, "lon": -2.24},
    {"name": "Melbourne", "country": "Australia", "admin1": "Victoria", "lat": -37.81, "lon": 144.96},
    {"name": "Mexico City", "country": "Mexico", "admin1": "Federal District", "lat": 19.43, "lon": -99.13},
    {"name": "Miami", "country": "United States", "admin1": "Florida", "lat": 25.76, "lon": -80.19},
    {"name": "Milan", "country": "Italy", "admin1": "Lombardy", "lat": 45.46, "lon": 9.19},
    {"name": "Montreal", "country": "Canada", "admin1": "Quebec", "lat": 45.50, "lon": -73.56},
    {"name": "Mumbai", "country": "India", "admin1": "Maharashtra", "lat": 19.07, "lon": 72.87},
    {"name": "Munich", "country": "Germany", "admin1": "Bavaria", "lat": 48.13, "lon": 11.58},
    {"name": "Nairobi", "country": "Kenya", "admin1": "Nairobi Area", "lat": -1.29, "lon": 36.82},
    {"name": "New York", "country": "United States", "admin1": "New York", "lat": 40.71, "lon": -74.00},
    {"name": "Osaka", "country": "Japan", "admin1": "Osaka", "lat": 34.69, "lon": 135.50},
    {"name": "Oslo", "country": "Norway", "admin1": "Oslo", "lat": 59.91, "lon": 10.75},
    {"name": "Paris", "country": "France", "admin1": "Ile-de-France", "lat": 48.85, "lon": 2.35},
    {"name": "Prague", "country": "Czech Republic", "admin1": "Prague", "lat": 50.07, "lon": 14.43},
    {"name": "Rome", "country": "Italy", "admin1": "Lazio", "lat": 41.90, "lon": 12.49},
    {"name": "San Francisco", "country": "United States", "admin1": "California", "lat": 37.77, "lon": -122.41},
    {"name": "Seoul", "country": "South Korea", "admin1": "Seoul", "lat": 37.56, "lon": 126.97},
    {"name": "Shanghai", "country": "China", "admin1": "Shanghai", "lat": 31.23, "lon": 121.47},
    {"name": "Singapore", "country": "Singapore", "admin1": "Singapore", "lat": 1.35, "lon": 103.81},
    {"name": "Stockholm", "country": "Sweden", "admin1": "Stockholm", "lat": 59.32, "lon": 18.06},
    {"name": "Sydney", "country": "Australia", "admin1": "New South Wales", "lat": -33.86, "lon": 151.20},
    {"name": "Taipei", "country": "Taiwan", "admin1": "Taipei", "lat": 25.03, "lon": 121.56},
    {"name": "Tokyo", "country": "Japan", "admin1": "Tokyo", "lat": 35.67, "lon": 139.65},
    {"name": "Toronto", "country": "Canada", "admin1": "Ontario", "lat": 43.65, "lon": -79.38},
    {"name": "Vancouver", "country": "Canada", "admin1": "British Columbia", "lat": 49.28, "lon": -123.12},
    {"name": "Vienna", "country": "Austria", "admin1": "Vienna", "lat": 48.20, "lon": 16.37},
    {"name": "Warsaw", "country": "Poland", "admin1": "Mazovia", "lat": 52.22, "lon": 21.01},
    {"name": "Zurich", "country": "Switzerland", "admin1": "Zurich", "lat": 47.37, "lon": 8.54}
]

