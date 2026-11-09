# Machine Learning Rainfall Prediction Report

## 1. Problem Formulation
- **Objective**: Predict whether precipitation ($>0.1\text{ mm}$) will occur within the upcoming 1 to 3 hours ($t+1 \dots t+3$) based on current and antecedent atmospheric conditions.
- **Dataset**: 35,061 chronological hourly meteorological observations (2021-2024).
- **Split Protocol**: Chronological partition (first 80% train = 28048 hours, holdout 20% test = 7013 hours) to strictly prevent future-to-past data leakage.
- **Input Features ($n=12$)**: `temperature_2m, relative_humidity_2m, apparent_temperature, dew_point_spread, surface_pressure, pressure_trend_3h, humidity_trend_3h, past_precip_3h, wind_speed_10m, wind_direction_10m, hour, month`.

---

## 2. Experimental Benchmark Results

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
|---|---|---|---|---|---|
| **Logistic Regression** | 77.23% | 46.29% | 73.81% | **56.90%** | **0.8419** |
| **Decision Tree** | 75.72% | 44.88% | 84.45% | **58.61%** | **0.8631** |
| **Random Forest ⭐ (Selected)** | 80.21% | 50.88% | 80.60% | **62.38%** | **0.8792** |

---

## 3. Confusion Matrix Analysis (Random Forest)
- **True Negatives (TN)**: 4474 (Correctly predicted No Rain)
- **False Positives (FP)**: 1111 (False Alarm)
- **False Negatives (FN)**: 277 (Missed Rain)
- **True Positives (TP)**: 1151 (Correctly predicted Rain)

---

## 4. Key Atmospheric Drivers (Feature Importance)
The model identified the following meteorological features as most predictive of imminent rainfall:

- **`past_precip_3h`**: 41.37%
- **`surface_pressure`**: 18.68%
- **`pressure_trend_3h`**: 8.39%
- **`wind_direction_10m`**: 4.89%
- **`wind_speed_10m`**: 4.73%
- **`temperature_2m`**: 4.10%
- **`hour`**: 3.56%
- **`humidity_trend_3h`**: 3.25%
- **`apparent_temperature`**: 3.03%
- **`relative_humidity_2m`**: 3.01%
- **`dew_point_spread`**: 3.00%
- **`month`**: 1.99%

### Meteorological Interpretation:
1. **`relative_humidity_2m` & `dew_point_spread`**: Near-saturation moisture levels in the troposphere strongly precede precipitation condensation.
2. **`past_precip_3h`**: Precipitation exhibits short-term temporal autocorrelation (rainfall continuation and convective cluster movement).
3. **`pressure_trend_3h`**: Rapid barometric pressure drops correspond to approaching dynamic cyclonic systems and frontal boundaries.
