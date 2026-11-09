"""
Script to collect multi-year historical hourly meteorological data
from the Open-Meteo Historical Weather Archive API.
"""

import os
import sys
import json
import argparse
import httpx
import pandas as pd
from datetime import datetime

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

def collect_historical_data(
    latitude: float = 51.5074,
    longitude: float = -0.1278,
    location_name: str = "London",
    start_date: str = "2021-01-01",
    end_date: str = "2024-12-31",
    output_dir: str = None
):
    if output_dir is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_dir = os.path.join(base_dir, "datasets", "raw")
    
    os.makedirs(output_dir, exist_ok=True)
    raw_csv_path = os.path.join(output_dir, "historical_weather_raw.csv")
    metadata_path = os.path.join(output_dir, "collection_metadata.json")

    print(f"[*] Initiating historical weather data collection...")
    print(f"    Location: {location_name} (Lat: {latitude}, Lon: {longitude})")
    print(f"    Date Range: {start_date} to {end_date}")
    print(f"    Source: Open-Meteo Historical Weather Archive API (Creative Commons Attribution 4.0 International)")

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": [
            "temperature_2m",
            "relative_humidity_2m",
            "dew_point_2m",
            "apparent_temperature",
            "precipitation",
            "rain",
            "surface_pressure",
            "wind_speed_10m",
            "wind_direction_10m",
            "weather_code"
        ],
        "timezone": "UTC"
    }

    try:
        with httpx.Client(timeout=60.0) as client:
            print("[*] Requesting data from Open-Meteo Archive API...")
            response = client.get(OPEN_METEO_ARCHIVE_URL, params=params)
            response.raise_for_status()
            data = response.json()
    except Exception as e:
        print(f"[!] Error fetching from Open-Meteo API: {e}")
        # If raw CSV exists, don't overwrite with error
        if os.path.exists(raw_csv_path):
            print(f"[+] Found existing cached dataset at {raw_csv_path}. Using existing file.")
            return raw_csv_path
        raise

    if "hourly" not in data or "time" not in data["hourly"]:
        raise ValueError("Unexpected response format: 'hourly' data not found in response.")

    hourly_data = data["hourly"]
    df = pd.DataFrame(hourly_data)

    print(f"[+] Retrieved {len(df)} hourly meteorological records.")
    print(f"    Columns retrieved: {list(df.columns)}")

    # Add metadata columns
    df["location_name"] = location_name
    df["latitude"] = latitude
    df["longitude"] = longitude

    # Save to CSV
    df.to_csv(raw_csv_path, index=False)
    print(f"[+] Successfully saved raw historical dataset to: {raw_csv_path}")

    # Save metadata
    metadata = {
        "source": "Open-Meteo Historical Weather API",
        "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
        "location": location_name,
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
        "record_count": len(df),
        "collected_at_utc": datetime.utcnow().isoformat(),
        "columns": list(df.columns)
    }
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[+] Saved collection metadata to: {metadata_path}")

    return raw_csv_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Collect historical weather data")
    parser.add_argument("--lat", type=float, default=51.5074)
    parser.add_argument("--lon", type=float, default=-0.1278)
    parser.add_argument("--location", type=str, default="London")
    parser.add_argument("--start", type=str, default="2021-01-01")
    parser.add_argument("--end", type=str, default="2024-12-31")
    args = parser.parse_args()

    collect_historical_data(
        latitude=args.lat,
        longitude=args.lon,
        location_name=args.location,
        start_date=args.start,
        end_date=args.end
    )
