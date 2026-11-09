# AI-Based Weather Intelligence & Decision Support System

An undergraduate academic software engineering and machine learning capstone project that combines **real-time global meteorological data**, **historical meteorological dataset engineering**, **machine-learning-based rainfall forecasting**, **weather intelligence synthesis**, and **activity-based decision support**.

---

## 🌟 Key Features

1. **Real-Time Global Weather Observations**:
   - Geocodes any city worldwide via Open-Meteo.
   - Live temperature, perceived feels-like temperature, relative humidity, surface pressure, wind velocity & direction, precipitation rate, and WMO weather codes.
2. **Comprehensive Weather Forecasting**:
   - 24-hour hourly trajectory with interactive Recharts area and bar charts.
   - 7-day extended forecast with daily temperature ranges, precipitation probabilities, and condition icons.
3. **Machine-Learning Weather Prediction Module**:
   - Predicts rainfall occurrence in the upcoming 1 to 3 hour window ($t+1 \dots t+3$).
   - Trained on 35,061 chronological hourly meteorological observations (2021–2024).
   - Random Forest model achieves **80.21% test accuracy**, **87.92% ROC-AUC**, and **80.60% recall**.
   - Generates prediction probability percentages, confidence scores, and natural-language explanations of contributing atmospheric drivers.
4. **Weather Intelligence Engine**:
   - Synthesizes live telemetry, numerical forecasting physics, and ML predictions.
   - Classifies overall atmospheric stability (Low, Moderate, High, Severe risk).
   - Generates plain-language meteorological summaries, thermodynamic analyses, potential risks, and favorable conditions.
5. **Activity-Based Decision Support System**:
   - Explainable, threshold-based advisories for **Travel**, **Outdoor Events**, **Sports**, and **Agriculture**.
   - Computes an objective 0–100 suitability score and categorizes status into *Favorable*, *Suitable with Precautions*, *Caution Required*, or *Unfavorable / Postpone*.
   - Transparently states the exact physical measurements that triggered the recommendation.
6. **Severe Weather Risk Indicator Module**:
   - Rule-based detection of gale-force winds, extreme heat index, freezing conditions, heavy rainfall, and thunderstorm hazards.
7. **Interactive Professional Dashboard**:
   - Built with React 18, TypeScript, Tailwind CSS, Recharts, and Leaflet interactive mapping.
   - 6 dedicated views: Dashboard, Forecast, AI Prediction, Weather Intelligence, Decision Support, and About Project & Viva Defense Guide.

---

## 🏛️ Project Architecture

```
USER / BROWSER
     │
     ▼
FRONTEND (React 18 + TypeScript + Vite + Tailwind CSS + Recharts + Leaflet)
     │
     ▼  REST API (HTTP/JSON + CORS)
FASTAPI BACKEND (Python 3.13 + Uvicorn + Pydantic)
     │
     ├── Open-Meteo Geocoding & Forecast APIs (External Telemetry)
     │
     ├── Serialized ML Model (Scikit-Learn Random Forest via Joblib)
     │   └── Trained on 35,061 Chronological Hourly Records (2021–2024)
     │
     ├── Weather Intelligence Engine (Meteorological Synthesis)
     │
     ├── Activity Decision Support Engine (Travel, Events, Sports, Agriculture)
     │
     └── Severe Weather Risk Alerts Engine
```

> **Important Academic Distinction**:  
> - **Open-Meteo Forecast**: Derived from Numerical Weather Prediction (NWP) atmospheric physics simulations.  
> - **AI/ML Prediction**: Our empirical Scikit-Learn statistical model trained on historical observations.  
> The system distinctly separates and synthesizes both components.

---

## 📁 Project Directory Structure

```
weather-intelligence-system/
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, WeatherMap (Leaflet), WeatherIcon
│   │   ├── pages/              # Dashboard, Forecast, Prediction, Intelligence, Decision, About
│   │   ├── services/           # API client for FastAPI backend
│   │   ├── types/              # TypeScript interfaces matching backend models
│   │   ├── App.tsx             # Main application state & router
│   │   ├── main.tsx            # React entry point
│   │   └── index.css           # Tailwind directives & Leaflet styling
│   ├── package.json            # Node dependencies
│   ├── vite.config.ts          # Vite bundler configuration
│   └── tailwind.config.js      # Tailwind theme configuration
│
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entry point & lifespan handler
│   │   ├── api/                # Route handlers (weather, prediction, intelligence, etc.)
│   │   ├── services/           # Open-Meteo API integration & caching
│   │   ├── ml/                 # Inference engine & explainability logic
│   │   ├── intelligence/       # Meteorological synthesis layer
│   │   ├── recommendation/     # Explainable activity decision engine
│   │   ├── alerts/             # Severe weather risk alerts module
│   │   ├── schemas/            # Pydantic data schemas
│   │   └── utils/              # WMO weather codes mapping
│   ├── datasets/
│   │   ├── raw/                # 35,064 raw hourly records (Open-Meteo Archive)
│   │   ├── processed/          # Engineered features & forward target
│   │   └── README.md           # Dataset documentation & variable dictionaries
│   ├── scripts/
│   │   ├── collect_dataset.py  # Dataset collector script
│   │   ├── preprocess_dataset.py # Data cleaning & feature engineering script
│   │   └── train_models.py     # ML training & benchmark evaluation script
│   ├── trained_models/
│   │   ├── weather_model.joblib # Serialized Random Forest model & scaler
│   │   └── evaluation_results.json # Full benchmark comparison metrics
│   ├── tests/
│   │   └── test_api.py         # Pytest test suite (100% pass rate)
│   ├── requirements.txt        # Python backend dependencies
│   └── .env.example            # Environment variables template
│
├── docs/
│   ├── architecture/           # System architecture diagrams & specifications
│   ├── ml/
│   │   └── MODEL_REPORT.md     # Experimental ML benchmark report
│   └── project-report/
│       ├── ACADEMIC_REPORT.md  # Full undergraduate academic project report
│       └── VIVA_PREPARATION.md # Oral defense and viva questions & answers
│
├── PROJECT_PLAN.md             # Implementation phases & roadmap
├── .gitignore
└── README.md
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- **Python**: 3.10+ (tested on Python 3.13)
- **Node.js**: v18+ (tested on Node v22)
- **npm**: v9+ (tested on npm 10.9)

### 2. Backend Setup
Open a terminal in the project root:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. (Optional) Re-run dataset collection, preprocessing, or ML training:
# python scripts/collect_dataset.py
# python scripts/preprocess_dataset.py
# python scripts/train_models.py

# 4. Start the FastAPI backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will be available at `http://localhost:8000`.  
Interactive Swagger API documentation: `http://localhost:8000/docs`.

### 3. Frontend Setup
Open a second terminal window:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install npm packages
npm install

# 3. Start the Vite development server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 📊 Machine Learning Experimental Benchmark

The model was trained on 35,061 chronological hourly observations (2021–2024) using a strict chronological split (first 80% train, last 20% test) to prevent future-to-past data leakage:

| Model Architecture | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Status |
|---|---|---|---|---|---|---|
| **Logistic Regression (Balanced)** | 77.23% | 46.29% | 73.81% | 56.90% | 0.8419 | Baseline |
| **Decision Tree (depth=6)** | 75.72% | 44.88% | 84.45% | 58.61% | 0.8631 | Single Tree |
| **Random Forest (100 trees) ⭐** | **80.21%** | **50.88%** | **80.60%** | **62.38%** | **0.8792** | Selected Model |

### Confusion Matrix (Test Split — 7,013 samples)
- **True Negatives (TN)**: 4,474 (Correctly predicted No Rain)
- **False Positives (FP)**: 1,111 (False alarm)
- **False Negatives (FN)**: 277 (Missed rain)
- **True Positives (TP)**: 1,151 (Correctly predicted Rain)

### Top Feature Importances (Gini Gain)
1. `past_precip_3h`: 41.37% (Short-range rain autocorrelation)
2. `surface_pressure`: 18.68% (Low barometric pressure marks cyclonic troughs)
3. `pressure_trend_3h`: 8.39% (Falling pressure indicates frontal boundaries)
4. `wind_direction_10m`: 4.89%
5. `wind_speed_10m`: 4.73%
6. `temperature_2m`: 4.10%

---

## 🧪 Testing & Verification

Run the automated backend test suite using `pytest`:

```bash
cd backend
pytest tests/ -v
```

**Test Coverage**:
- `test_root_endpoint`: Verifies application name and status.
- `test_health_endpoint`: Verifies backend health and ML model loading status.
- `test_weather_endpoint`: Tests real-time weather retrieval for a city.
- `test_forecast_endpoint`: Tests 24h hourly and 7d daily forecast structures.
- `test_prediction_endpoint`: Tests ML rainfall inference, probability bounds, and driver explanations.
- `test_intelligence_endpoint`: Tests synthesized intelligence and risk level assignment.
- `test_recommendations_all_activities`: Tests Travel, Outdoor Events, Sports, and Agriculture decision paths.
- `test_alerts_endpoint`: Tests automated rule-based risk alert evaluation.
- `test_invalid_city_404`: Verifies graceful 404 handling for unknown cities.
- `test_ml_inference_unit_logic`: Verifies that wet/saturated features yield significantly higher rain probability than dry/anticyclonic features.

---

## 🎓 Academic Defense & Viva Highlights

- **Chronological Temporal Split**: Explains why standard random train/test split causes catastrophic data leakage in meteorological time-series.
- **Zero Data Leakage**: Future precipitation is used strictly to compute the binary prediction target and is never an input feature.
- **NWP vs Statistical ML**: Explains why empirical models complement physical fluid dynamic simulations rather than replacing them.
- **Explainable AI (XAI)**: Predictions provide natural-language reasoning derived from live feature weights rather than acting as a black-box.

---

## 📄 License
- **Source Code**: MIT License.
- **Meteorological Data**: [Open-Meteo](https://open-meteo.com) licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).
