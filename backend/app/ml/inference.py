"""
Machine Learning Inference Engine for Weather Prediction.
Loads serialized Random Forest model, runs inference, and generates explainable output.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from datetime import datetime

class WeatherPredictor:
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_path = os.path.join(base_dir, "trained_models", "weather_model.joblib")
        
        self.model_path = model_path
        self.model_data = None
        self.is_loaded = False
        self.load_model()

    def load_model(self):
        try:
            if os.path.exists(self.model_path):
                self.model_data = joblib.load(self.model_path)
                self.model = self.model_data["model"]
                self.scaler = self.model_data["scaler"]
                self.model_name = self.model_data["best_model_name"]
                self.feature_names = self.model_data["feature_names"]
                self.uses_scaled_inputs = self.model_data.get("uses_scaled_inputs", False)
                self.metrics = self.model_data.get("metrics", {})
                self.feature_importances = self.model_data.get("feature_importances", {})
                self.is_loaded = True
                print(f"[+] WeatherPredictor loaded successfully: {self.model_name}")
            else:
                print(f"[!] Warning: Model file not found at {self.model_path}")
                self.is_loaded = False
        except Exception as e:
            print(f"[!] Error loading model from {self.model_path}: {e}")
            self.is_loaded = False

    def predict(self, features_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Accepts dictionary of weather observations, prepares feature vector,
        generates prediction probability and an explainable breakdown.
        """
        if not self.is_loaded:
            return {
                "success": False,
                "error": "ML model is not loaded.",
                "prediction": "Unavailable",
                "probability": None
            }

        now = datetime.now()
        hour = features_dict.get("hour", now.hour)
        month = features_dict.get("month", now.month)

        temp = float(features_dict.get("temperature_2m", 20.0))
        rh = float(features_dict.get("relative_humidity_2m", 60.0))
        apparent_temp = float(features_dict.get("apparent_temperature", temp))
        dew_point = features_dict.get("dew_point_2m", None)
        
        if dew_point is not None:
            dew_point_spread = float(temp - dew_point)
        else:
            # Approximate dew point from Magnus-Tetens formula if missing
            dew_point_spread = float((100 - rh) / 5.0)

        pressure = float(features_dict.get("surface_pressure", 1013.25))
        pressure_trend = float(features_dict.get("pressure_trend_3h", 0.0))
        humidity_trend = float(features_dict.get("humidity_trend_3h", 0.0))
        past_precip = float(features_dict.get("past_precip_3h", features_dict.get("precipitation", 0.0)))
        wind_speed = float(features_dict.get("wind_speed_10m", 10.0))
        wind_direction = float(features_dict.get("wind_direction_10m", 180.0))

        # Vector in exact order of trained features
        vector = [
            temp,
            rh,
            apparent_temp,
            dew_point_spread,
            pressure,
            pressure_trend,
            humidity_trend,
            past_precip,
            wind_speed,
            wind_direction,
            hour,
            month
        ]

        X_input = np.array([vector])

        if self.uses_scaled_inputs and self.scaler is not None:
            X_eval = self.scaler.transform(X_input)
        else:
            X_eval = X_input

        # Probability and prediction
        proba_rain = float(self.model.predict_proba(X_eval)[0, 1])
        prediction_class = int(proba_rain >= 0.5)
        prediction_label = "Rain Likely (Imminent)" if prediction_class == 1 else "No Rain Expected"

        # Determine top contributing drivers for this prediction
        key_factors = []
        if past_precip > 0.2:
            key_factors.append(f"Recent active precipitation ({past_precip:.1f} mm in past 3h)")
        if rh > 80:
            key_factors.append(f"High relative humidity ({rh:.0f}%) creating atmospheric moisture saturation")
        elif rh < 45:
            key_factors.append(f"Low relative humidity ({rh:.0f}%) suppressing condensation")

        if pressure_trend < -1.5:
            key_factors.append(f"Steeply falling barometric pressure ({pressure_trend:+.1f} hPa) indicating approaching frontal system")
        elif pressure_trend > 1.0:
            key_factors.append(f"Rising barometric pressure ({pressure_trend:+.1f} hPa) indicating stabilizing anticyclonic conditions")

        if dew_point_spread < 2.5:
            key_factors.append(f"Narrow dew point spread ({dew_point_spread:.1f}°C) favoring condensation")

        if wind_speed > 25:
            key_factors.append(f"Elevated wind velocity ({wind_speed:.1f} km/h) transporting moist airmass")

        if not key_factors:
            if prediction_class == 1:
                key_factors.append("Combined thermal and moisture thresholds indicate precipitation likelihood")
            else:
                key_factors.append("Atmospheric pressure and humidity balance suggest stable precipitation-free conditions")

        explanation = (
            f"The trained {self.model_name} model predicts a {proba_rain*100:.1f}% likelihood of rainfall "
            f"in the next 1-3 hours. Key contributing parameters: {'; '.join(key_factors[:3])}."
        )

        return {
            "success": True,
            "prediction_class": prediction_class,
            "prediction_label": prediction_label,
            "rain_probability": round(proba_rain, 4),
            "rain_probability_percentage": round(proba_rain * 100, 1),
            "confidence_score": round(max(proba_rain, 1 - proba_rain), 4),
            "model_name": self.model_name,
            "prediction_horizon": "Upcoming 1 to 3 hours",
            "explanation": explanation,
            "top_drivers": key_factors,
            "model_metrics": self.metrics,
            "disclaimer": (
                "Academic ML Model Prediction: This prediction is generated by our trained Scikit-Learn "
                "machine learning model on historical meteorological patterns. It is distinct from and "
                "complements numerical weather prediction (NWP) forecasts provided by national meteorological agencies."
            )
        }

# Global singleton predictor
predictor_instance = WeatherPredictor()
