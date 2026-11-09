# Academic Project Report
# AI-Based Weather Intelligence and Decision Support System

**Academic Level**: Undergraduate Computer Science / Software Engineering Capstone Project  
**Domain**: Applied Machine Learning, Meteorological Informatics, and Full-Stack Web Engineering  

---

## Abstract
Accurate and explainable weather forecasting paired with context-aware decision support is vital for travel safety, outdoor event planning, athletic performance, and agricultural operations. Traditional weather interfaces present fragmented raw meteorological numbers without translating them into actionable domain advice. This project develops a complete, production-grade **AI-Based Weather Intelligence and Decision Support System**. The system integrates real-time global weather observations from Open-Meteo with a custom-trained machine learning model trained on 35,061 chronological hourly observations (2021–2024). We bench-marked Logistic Regression, Decision Trees, and Random Forest architectures using chronological train/test splitting to prevent future-to-past data leakage. The resulting Random Forest model achieved an **80.21% test accuracy**, **87.92% ROC-AUC**, and **80.60% recall** on actual rainfall events. The predictive model is combined with a rule-based Weather Intelligence Engine, an Activity Decision Support System, and a modern React 18 TypeScript dashboard with Recharts visualizations and Leaflet mapping.

---

## 1. Introduction & Motivation
Modern society depends heavily on atmospheric conditions:
- **Transportation**: Heavy rain, black ice, and crosswinds cause transit delays and vehicular accidents.
- **Events**: Marquees, staging, and outdoor gatherings require advanced notice of wind gusts and precipitation.
- **Athletics**: High heat index and saturated turf increase player fatigue and injury risks.
- **Agriculture**: Foliar fertilizer/pesticide spraying requires calm winds ($<15\text{ km/h}$) and rainfast drying windows.

Most consumer applications merely report static forecasts without interpreting them. Furthermore, commercial applications rarely explain why a forecast is likely or how users should adjust their specific activities. This project addresses these shortcomings by synthesizing empirical machine learning with domain-specific decision rules.

---

## 2. Key Academic Distinction: NWP vs. Statistical ML
A core academic tenet of this research is the transparent distinction between:
1. **Numerical Weather Prediction (NWP)**: Physics-based fluid dynamics simulations (e.g. Navier-Stokes equations for conservation of mass, momentum, and moisture) executed on national supercomputers and queried via Open-Meteo.
2. **Empirical Machine Learning**: Statistical pattern recognition (Random Forest) trained on local chronological time-series observations to predict the probability of precipitation in the upcoming 1 to 3 hours based on surface barometric pressure tendencies, humidity gradients, and recent precipitation history.

---

## 3. Dataset Engineering & Data Leakage Prevention

### 3.1 Data Collection
- **Source**: Open-Meteo Historical Weather Archive API (Creative Commons Attribution 4.0 International).
- **Temporal Horizon**: 2021-01-01 to 2024-12-31 (4 full calendar years, 35,064 hourly records).
- **Features Extracted**: `temperature_2m`, `relative_humidity_2m`, `dew_point_2m`, `apparent_temperature`, `precipitation`, `surface_pressure`, `wind_speed_10m`, `wind_direction_10m`, `weather_code`.

### 3.2 Feature Engineering
- **Dew Point Spread**: $\text{Spread} = T_{\text{ambient}} - T_{\text{dewpoint}}$. Low spreads indicate near-saturation and cloud condensation.
- **Pressure Tendency (3-hour change)**: $\Delta P_{3h} = P_t - P_{t-3}$. Falling barometric pressure indicates incoming cyclone or frontal boundaries.
- **Moisture Trend**: $\Delta \text{RH}_{3h} = \text{RH}_t - \text{RH}_{t-3}$.
- **Antecedent Precipitation**: Rolling sum of precipitation over the past 3 hours.

### 3.3 Target Definition & Chronological Splitting
- **Target Variable**: $\text{Target} = \mathbf{1}\left(\sum_{k=1}^{3} \text{Precipitation}_{t+k} > 0.1\text{ mm}\right)$.
- **Zero Leakage**: All predictors $X$ use information from time $\le t$. Future precipitation is never included in $X$.
- **Temporal Partitioning**: 
  - Training Set: First 80% (28,048 samples, Jan 2021 to mid-2024).
  - Holdout Test Set: Final 20% (7,013 samples, mid-2024 to Dec 2024).

---

## 4. Machine Learning Model Benchmark Results

| Model | Test Accuracy | Precision (Rain) | Recall (Rain) | F1-Score | ROC-AUC |
|---|---|---|---|---|---|
| **Logistic Regression (Balanced)** | 77.23% | 46.29% | 73.81% | 56.90% | 0.8419 |
| **Decision Tree (depth=6)** | 75.72% | 44.88% | 84.45% | 58.61% | 0.8631 |
| **Random Forest (100 trees) ⭐** | **80.21%** | **50.88%** | **80.60%** | **62.38%** | **0.8792** |

### Confusion Matrix on Test Split (7,013 records)
- **True Negatives (TN)**: 4,474
- **False Positives (FP)**: 1,111
- **False Negatives (FN)**: 277
- **True Positives (TP)**: 1,151

**Key Finding**: In meteorological safety, False Negatives (unforeseen rain events) carry significantly higher operational penalties than False Positives (over-caution). The selected Random Forest achieved an **80.60% Recall**, ensuring that over 8 out of 10 rain events were identified hours in advance.

---

## 5. System Implementation & Software Architecture
- **Backend**: FastAPI web server with RESTful endpoints (`/weather/{city}`, `/forecast/{city}`, `/prediction/{city}`, `/intelligence/{city}`, `/recommendation`, `/alerts/{city}`).
- **Model Ingestion**: Serialized via Joblib and pre-loaded during application startup lifespan.
- **Frontend**: Single-Page Application (SPA) developed with React 18, TypeScript, Tailwind CSS, Lucide icons, Recharts, and Leaflet interactive map rendering.
- **Automated Verification**: Comprehensive Pytest suite covering all 8 endpoints and ML unit inference logic (100% pass rate).

---

## 6. Conclusion
The AI-Based Weather Intelligence & Decision Support System successfully fulfills all academic requirements: combining real-time API telemetry, multi-year historical dataset engineering, rigorous machine learning training with chronological temporal validation, explainable inference reasoning, and an intuitive, professional web dashboard.
