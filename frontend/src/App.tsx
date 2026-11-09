import React, { useState, useEffect } from 'react';
import {
  CurrentWeather,
  ForecastResponse,
  MLPredictionResponse,
  WeatherIntelligenceResponse,
  AlertsResponse,
  LocationSuggestion
} from './types/weather';
import {
  fetchCurrentWeather,
  fetchForecast,
  fetchMLPrediction,
  fetchWeatherIntelligence,
  fetchAlerts,
  reverseGeocode
} from './services/api';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ForecastPage } from './pages/ForecastPage';
import { PredictionPage } from './pages/PredictionPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { DecisionSupportPage } from './pages/DecisionSupportPage';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface LocationTarget {
  name: string;
  country?: string;
  lat?: number;
  lon?: number;
  displayName?: string;
}

const DEFAULT_LOCATION: LocationTarget = {
  name: 'New Delhi',
  country: 'India',
  lat: 28.6139,
  lon: 77.2090,
  displayName: 'New Delhi, India'
};

export const App: React.FC = () => {
  const [target, setTarget] = useState<LocationTarget>(DEFAULT_LOCATION);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [prediction, setPrediction] = useState<MLPredictionResponse | null>(null);
  const [intelligence, setIntelligence] = useState<WeatherIntelligenceResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice("GPS Geolocation is not supported by your current browser.");
      setTimeout(() => setGeoNotice(null), 4000);
      return;
    }

    setIsDetectingLocation(true);
    setGeoNotice("Acquiring GPS coordinates from device...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          setGeoNotice(`GPS locked (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°). Resolving location...`);

          const loc = await reverseGeocode(latitude, longitude);

          setTarget({
            name: loc.name,
            country: loc.country,
            lat: latitude,
            lon: longitude,
            displayName: loc.display_name
          });

          setGeoNotice(`📍 Location updated to ${loc.display_name}`);
          setTimeout(() => setGeoNotice(null), 6000);
        } catch (err: any) {
          console.error("Reverse geocode error:", err);
          // If reverse geocode fails, still use exact GPS coordinates
          setTarget({
            name: "Current Location",
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
          setGeoNotice("Location set directly from device GPS coordinates.");
          setTimeout(() => setGeoNotice(null), 4000);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (geoError) => {
        setIsDetectingLocation(false);
        let msg = "Location detection failed.";
        if (geoError.code === geoError.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access in your browser settings.";
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          msg = "GPS signal unavailable on this device.";
        } else if (geoError.code === geoError.TIMEOUT) {
          msg = "Location request timed out. Please try again.";
        }
        setGeoNotice(msg);
        setTimeout(() => setGeoNotice(null), 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Do not use stale cached location!
      }
    );
  };

  const loadAllWeatherData = async (loc: LocationTarget) => {
    setIsLoading(true);
    setError(null);

    try {
      // Parallel retrieval for fast response with exact coordinates if available
      const [wRes, fRes, pRes, iRes, aRes] = await Promise.all([
        fetchCurrentWeather(loc.name, loc.lat, loc.lon, loc.country),
        fetchForecast(loc.name, loc.lat, loc.lon, loc.country),
        fetchMLPrediction(loc.name, loc.lat, loc.lon, loc.country),
        fetchWeatherIntelligence(loc.name, loc.lat, loc.lon, loc.country),
        fetchAlerts(loc.name, loc.lat, loc.lon, loc.country)
      ]);

      setWeather(wRes);
      setForecast(fRes);
      setPrediction(pRes);
      setIntelligence(iRes);
      setAlerts(aRes);
    } catch (err: any) {
      console.error("Error loading weather data:", err);
      setError(err.message || 'An error occurred while fetching meteorological data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllWeatherData(target);
  }, [target]);

  const handleSearchCity = (city: string, suggestion?: LocationSuggestion) => {
    if (suggestion) {
      setTarget({
        name: suggestion.name,
        country: suggestion.country,
        lat: suggestion.latitude,
        lon: suggestion.longitude,
        displayName: suggestion.display_name
      });
    } else {
      setTarget({ name: city });
    }
  };

  // Active city display string
  const activeDisplayString = weather
    ? `${weather.location.name}${weather.location.country ? `, ${weather.location.country}` : ''}`
    : target.displayName || target.name;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Sticky Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedCity={activeDisplayString}
        selectedCoords={
          weather
            ? { lat: weather.location.latitude, lon: weather.location.longitude }
            : target.lat && target.lon
            ? { lat: target.lat, lon: target.lon }
            : undefined
        }
        onSearchCity={handleSearchCity}
        onDetectLocation={handleDetectLocation}
        isDetectingLocation={isDetectingLocation}
        isLoading={isLoading}
      />

      {/* GPS Geo Notification Toast */}
      {geoNotice && (
        <div className="bg-brand-950/90 border-b border-brand-500/40 px-4 py-2 text-center text-xs text-brand-200 animate-in fade-in duration-200 flex items-center justify-center gap-2 shadow-md">
          <span className="font-semibold">{geoNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {isLoading && !weather ? (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white">Synthesizing Weather Intelligence...</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              Connecting to Open-Meteo telemetry and generating machine learning predictions for {target.name}.
            </p>
          </div>
        ) : error && !weather ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4">
              <AlertCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold text-white">Failed to Retrieve Data</h2>
            <p className="text-sm text-slate-400 mt-1.5 mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => loadAllWeatherData(target)}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Query</span>
              </button>
              <button
                onClick={() => setTarget(DEFAULT_LOCATION)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all border border-slate-700"
              >
                Reset to New Delhi
              </button>
            </div>
          </div>
        ) : weather && forecast && prediction && intelligence && alerts ? (
          <div>
            {currentTab === 'dashboard' && (
              <DashboardPage
                weather={weather}
                forecast={forecast}
                prediction={prediction}
                intelligence={intelligence}
                alerts={alerts}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'forecast' && (
              <ForecastPage forecast={forecast} />
            )}

            {currentTab === 'prediction' && (
              <PredictionPage prediction={prediction} weather={weather} />
            )}

            {currentTab === 'intelligence' && (
              <IntelligencePage intelligence={intelligence} alerts={alerts} />
            )}

            {currentTab === 'decision' && (
              <DecisionSupportPage currentWeather={weather} />
            )}
          </div>
        ) : null}
      </main>

      {/* Application Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-semibold text-slate-300">
              WeatherIntel • AI Weather Intelligence & Decision Support System
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Real-Time Meteorological Observations • Machine Learning Precipitation Engine
            </p>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Data: Open-Meteo API</span>
            <span>•</span>
            <span>AI: Scikit-Learn Random Forest</span>
            <span>•</span>
            <span>Decision Support Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
