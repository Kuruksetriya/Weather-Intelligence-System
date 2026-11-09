"""
Dataset preprocessing, cleaning, and feature engineering pipeline.
Constructs forward prediction target and temporal features without data leakage.
"""

import os
import json
import pandas as pd
import numpy as np

def preprocess_weather_dataset():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_path = os.path.join(base_dir, "datasets", "raw", "historical_weather_raw.csv")
    processed_dir = os.path.join(base_dir, "datasets", "processed")
    os.makedirs(processed_dir, exist_ok=True)
    processed_path = os.path.join(processed_dir, "historical_weather_processed.csv")
    report_path = os.path.join(processed_dir, "preprocessing_report.json")

    print(f"[*] Loading raw dataset from: {raw_path}")
    df = pd.read_csv(raw_path)
    initial_rows = len(df)
    print(f"    Initial rows: {initial_rows}")

    # 1. Parse and sort chronologically
    df["time"] = pd.to_datetime(df["time"])
    df = df.sort_values("time").reset_index(drop=True)

    # 2. Check duplicates
    duplicate_count = df.duplicated(subset=["time"]).sum()
    if duplicate_count > 0:
        print(f"    Found {duplicate_count} duplicate timestamps. Dropping duplicates.")
        df = df.drop_duplicates(subset=["time"]).reset_index(drop=True)
    else:
        print("    [+] Zero duplicate timestamps detected.")

    # 3. Missing Value Analysis
    missing_counts = df.isnull().sum().to_dict()
    print(f"    Missing values per column: {missing_counts}")
    # Numerical interpolation / forward fill for minor gaps if any
    num_cols = df.select_dtypes(include=[np.number]).columns
    df[num_cols] = df[num_cols].interpolate(method='linear', limit_direction='forward').ffill().bfill()

    # 4. Outlier & Sanity Checks
    # Valid physical ranges:
    # Temperature: -40C to 50C
    # Relative humidity: 0% to 100%
    # Surface pressure: 850 hPa to 1080 hPa
    # Wind speed: 0 to 150 km/h
    # Precipitation: >= 0 mm
    df["relative_humidity_2m"] = df["relative_humidity_2m"].clip(0.0, 100.0)
    df["precipitation"] = df["precipitation"].clip(lower=0.0)
    df["rain"] = df["rain"].clip(lower=0.0)
    df["wind_speed_10m"] = df["wind_speed_10m"].clip(lower=0.0)

    # 5. Feature Engineering
    # A. Dew Point Depression (spread): smaller spread indicates near-saturation / fog / rain likelihood
    df["dew_point_spread"] = df["temperature_2m"] - df["dew_point_2m"]

    # B. Atmospheric Pressure Trend (3-hour change): negative pressure tendency indicates incoming fronts/lows
    df["pressure_trend_3h"] = df["surface_pressure"] - df["surface_pressure"].shift(3)
    df["humidity_trend_3h"] = df["relative_humidity_2m"] - df["relative_humidity_2m"].shift(3)

    # C. Rolling past precipitation (past 3 hours)
    df["past_precip_3h"] = df["precipitation"].rolling(window=3, min_periods=1).sum()

    # D. Temporal & Seasonal Features
    df["hour"] = df["time"].dt.hour
    df["month"] = df["time"].dt.month
    df["day_of_year"] = df["time"].dt.dayofyear

    # 6. Target Generation (Prediction Problem: Rainfall in the next 1-3 hours)
    # Target period: t+1, t+2, t+3
    # Future precipitation sum over next 3 hours
    future_precip_next_3h = (
        df["precipitation"].shift(-1) +
        df["precipitation"].shift(-2) +
        df["precipitation"].shift(-3)
    )
    # Binary classification target: 1 if future precip > 0.1 mm, else 0
    df["target_rain_next_3h"] = (future_precip_next_3h > 0.1).astype(int)

    # 7. Clean Initial Lags & Final Shifts (drop rows where lag or shift creates NaN)
    # First 3 rows have NaN for 3h lag, last 3 rows have NaN for future shift
    valid_df = df.dropna().reset_index(drop=True)
    valid_rows = len(valid_df)
    print(f"[+] After feature engineering and dropna: {valid_rows} rows retained.")

    # 8. Class Imbalance Inspection
    target_counts = valid_df["target_rain_next_3h"].value_counts().to_dict()
    rain_ratio = target_counts.get(1, 0) / valid_rows
    print(f"[+] Target Distribution (Rain in Next 3 Hours):")
    print(f"    Class 0 (No Rain): {target_counts.get(0, 0)} ({100 - rain_ratio*100:.2f}%)")
    print(f"    Class 1 (Rain Likely): {target_counts.get(1, 0)} ({rain_ratio*100:.2f}%)")

    # 9. Save processed dataset
    valid_df.to_csv(processed_path, index=False)
    print(f"[+] Processed dataset saved to: {processed_path}")

    # 10. Save Preprocessing Metadata Report
    report = {
        "initial_rows": initial_rows,
        "final_rows": valid_rows,
        "features_created": [
            "dew_point_spread",
            "pressure_trend_3h",
            "humidity_trend_3h",
            "past_precip_3h",
            "hour",
            "month",
            "day_of_year"
        ],
        "target_variable": "target_rain_next_3h",
        "target_definition": "Precipitation > 0.1mm occurring within the upcoming 1 to 3 hour window (t+1 to t+3)",
        "target_distribution": {
            "no_rain_count": int(target_counts.get(0, 0)),
            "rain_count": int(target_counts.get(1, 0)),
            "rain_percentage": round(float(rain_ratio * 100), 2)
        },
        "time_range_start": str(valid_df["time"].min()),
        "time_range_end": str(valid_df["time"].max())
    }

    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"[+] Preprocessing report saved to: {report_path}")

    return processed_path

if __name__ == "__main__":
    preprocess_weather_dataset()
