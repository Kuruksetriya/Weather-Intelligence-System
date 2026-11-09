# System Architecture Specification

## 1. Architectural Overview
The **AI-Based Weather Intelligence & Decision Support System** follows a decoupled multi-tier architecture separating presentation, server-side orchestration, data engineering, statistical machine learning, and external meteorological data ingestion.

```
+-------------------------------------------------------------------------------+
|                       React + TypeScript Frontend Client                      |
| (6 Responsive Views: Dashboard, Forecast, ML Prediction, Intel, Decision, Viva)|
+-------------------------------------------------------------------------------+
                                      ▲
                                      │ REST (HTTP/JSON + CORS)
                                      ▼
+-------------------------------------------------------------------------------+
|                         FastAPI Application Server                            |
|                                                                               |
|  +-------------------+  +-------------------+  +----------------------------+ |
|  | /weather &        |  | /prediction/{city}|  | /recommendation &          | |
|  | /forecast/{city}  |  | Inference Router  |  | /alerts/{city}             | |
|  +-------------------+  +-------------------+  +----------------------------+ |
|            │                      │                          │                |
|            ▼                      ▼                          ▼                |
|  +-------------------+  +-------------------+  +----------------------------+ |
|  | WeatherService    |  | WeatherPredictor  |  | Decision & Intelligence    | |
|  | (Cache + WMO map) |  | (Joblib Pipeline) |  | Rule-Based Engines         | |
|  +-------------------+  +-------------------+  +----------------------------+ |
+-------------------------------------------------------------------------------+
         ▲                                   ▲
         │ HTTPS                             │ Serialized Model (.joblib)
         ▼                                   ▼
+--------------------+            +--------------------------------------------+
| Open-Meteo Cloud   |            | Trained Scikit-Learn Random Forest Model   |
| Forecast API       |            | Trained on 35,061 hourly records           |
+--------------------+            +--------------------------------------------+
```

---

## 2. Core Architectural Components

### A. Presentation Layer (Frontend)
- **Framework**: React 18 with TypeScript and Vite bundler.
- **Styling**: Tailwind CSS configured with custom brand palettes and dark-mode defaults.
- **Visualizations**: Recharts (`AreaChart`, `BarChart`) for 24-hour temperature and rain probability curves.
- **Geographic Mapping**: Leaflet interactive map rendering open-source CartoDB Voyager tiles with dynamic DOM pin overlays.

### B. Application Server Layer (Backend)
- **Framework**: FastAPI (Asynchronous Python 3.13 web framework).
- **Validation**: Pydantic models for strict data contracts.
- **Caching**: In-memory time-to-live (TTL) cache (5-minute expiration) to avoid redundant Open-Meteo external API calls.
- **Resilience**: Asynchronous non-blocking HTTP client (`httpx`) with 10-second timeout handling and graceful fallbacks.

### C. Machine Learning Inference Engine
- **Model**: Scikit-Learn `RandomForestClassifier` (100 estimators, max depth 10, balanced class weights).
- **Features (12)**: `temperature_2m`, `relative_humidity_2m`, `apparent_temperature`, `dew_point_spread`, `surface_pressure`, `pressure_trend_3h`, `humidity_trend_3h`, `past_precip_3h`, `wind_speed_10m`, `wind_direction_10m`, `hour`, `month`.
- **Target**: `target_rain_next_3h` (Rainfall > 0.1mm occurring in upcoming 1 to 3 hours).
- **Explainability Layer**: Extracts real-time feature contributions (e.g. falling pressure, humidity saturation, antecedent rain) to provide natural-language reasoning alongside probability percentages.

### D. Weather Intelligence Engine
- Synthesizes live telemetry, 24-hour forecast trends, and the ML rainfall prediction into structured meteorological intelligence (summary, atmospheric stability, risk observations, and favorable environmental conditions).

### E. Activity Decision Support Engine
- Evaluates four operational domains (**Travel**, **Outdoor Events**, **Sports**, and **Agriculture**) against explicit physical thresholds.
- Produces a 0–100 suitability score, qualitative status (`Favorable`, `Suitable with Precautions`, `Caution Required`, `Unfavorable / Postpone`), decision rationale, and operational precautions.
