"""
AI-Based Weather Intelligence & Decision Support System
Main FastAPI Application Entry Point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from backend.app.ml.inference import predictor_instance
from backend.app.api.weather_router import router as weather_router
from backend.app.api.prediction_router import router as prediction_router
from backend.app.api.intelligence_router import router as intelligence_router
from backend.app.api.recommendation_router import router as recommendation_router
from backend.app.api.alerts_router import router as alerts_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure ML model is loaded
    if not predictor_instance.is_loaded:
        predictor_instance.load_model()
    yield
    # Teardown logic if needed

app = FastAPI(
    title="AI-Based Weather Intelligence & Decision Support System",
    description=(
        "Full-Stack Academic Meteorological Platform integrating Open-Meteo live observations, "
        "numerical weather prediction, trained Scikit-Learn machine learning rainfall forecasting, "
        "rule-based Weather Intelligence, Activity Decision Support, and Severe Weather Risk Alerts."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(weather_router)
app.include_router(prediction_router)
app.include_router(intelligence_router)
app.include_router(recommendation_router)
app.include_router(alerts_router)

@app.get("/", tags=["System Information"])
async def root():
    return {
        "application": "AI-Based Weather Intelligence and Decision Support System",
        "academic_level": "Undergraduate Academic Engineering Project",
        "backend_framework": "FastAPI",
        "status": "operational",
        "version": "1.0.0",
        "docs_url": "/docs",
        "endpoints": {
            "health": "/health",
            "weather": "/weather/{city}",
            "forecast": "/forecast/{city}",
            "prediction": "/prediction/{city}",
            "intelligence": "/intelligence/{city}",
            "recommendation": "POST /recommendation",
            "alerts": "/alerts/{city}"
        }
    }

@app.get("/health", tags=["System Information"])
async def health():
    return {
        "status": "healthy",
        "backend": "online",
        "ml_model_loaded": predictor_instance.is_loaded,
        "active_model_name": predictor_instance.model_name if predictor_instance.is_loaded else "None",
        "model_metrics": predictor_instance.metrics if predictor_instance.is_loaded else {},
        "external_api": "Open-Meteo (Geocoding & Forecast)"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Processing Error",
            "detail": str(exc),
            "path": request.url.path
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
