import React from 'react';
import {
  CurrentWeather,
  ForecastResponse,
  MLPredictionResponse,
  WeatherIntelligenceResponse,
  AlertsResponse
} from '../types/weather';
import { WeatherIcon } from '../components/WeatherIcon';
import { WeatherMap } from '../components/WeatherMap';
import {
  Droplets,
  Wind,
  Gauge,
  Thermometer,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DashboardPageProps {
  weather: CurrentWeather;
  forecast: ForecastResponse;
  prediction: MLPredictionResponse;
  intelligence: WeatherIntelligenceResponse;
  alerts: AlertsResponse;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  weather,
  forecast,
  prediction,
  intelligence,
  alerts,
  onNavigateTab
}) => {
  // Chart data: 12 consecutive hourly forecast points starting at the current hour rounded down to the hour
  // Calculated using the selected location's specific timezone and observation timestamp
  const miniChartData = React.useMemo(() => {
    if (!forecast || !forecast.hourly || forecast.hourly.length === 0) {
      return [];
    }

    const timezone = forecast.location?.timezone || weather?.location?.timezone;
    const observationTime = weather?.observation_time;

    let targetPrefix = '';

    // 1. Resolve current local date and hour (rounded down) in the selected location's timezone
    if (timezone && timezone !== 'auto') {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          hourCycle: 'h23',
          hour12: false
        });
        const parts = formatter.formatToParts(now).reduce<Record<string, string>>((acc, p) => {
          acc[p.type] = p.value;
          return acc;
        }, {});

        if (parts.year && parts.month && parts.day && parts.hour !== undefined) {
          const hourNum = parseInt(parts.hour, 10) % 24;
          const hourStr = String(hourNum).padStart(2, '0');
          targetPrefix = `${parts.year}-${parts.month}-${parts.day}T${hourStr}`;
        }
      } catch (err) {
        // Fallback to observation timestamp if timezone formatting fails
      }
    }

    // 2. Fallback to API observation time (already in the location's local timezone)
    if (!targetPrefix && observationTime && observationTime.includes('T')) {
      const [datePart, timePart] = observationTime.split('T');
      const hourStr = (timePart.split(':')[0] || '00').padStart(2, '0');
      targetPrefix = `${datePart}T${hourStr}`;
    }

    // 3. Fallback to UTC if neither is available
    if (!targetPrefix) {
      const now = new Date();
      const yyyy = now.getUTCFullYear();
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(now.getUTCDate()).padStart(2, '0');
      const hh = String(now.getUTCHours()).padStart(2, '0');
      targetPrefix = `${yyyy}-${mm}-${dd}T${hh}`;
    }

    // Find the starting index matching the rounded-down local hour
    let startIndex = forecast.hourly.findIndex((item) => item.time.startsWith(targetPrefix));

    // If exact hour is not matched, find the first upcoming point >= targetPrefix
    if (startIndex === -1) {
      startIndex = forecast.hourly.findIndex((item) => item.time >= targetPrefix);
    }

    // If still not matched, fallback to index 0
    if (startIndex === -1) {
      startIndex = 0;
    }

    // Select 12 consecutive hourly points (crossing midnight into the next day when appropriate)
    const selectedPoints = forecast.hourly.slice(startIndex, startIndex + 12);

    return selectedPoints.map((item) => ({
      time: item.time.split('T')[1] || item.time,
      temperature: Math.round(item.temperature),
      rainProb: Math.round(item.precipitation_probability)
    }));
  }, [forecast, weather]);

  const todayForecast = forecast.daily[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Severe Weather Alerts Alert Banner (if any) */}
      {alerts.has_active_alerts && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-500/30 text-amber-200">
                  {alerts.alerts[0].severity} risk
                </span>
                <h3 className="font-bold text-amber-100 text-sm sm:text-base">
                  {alerts.alerts[0].title}
                </h3>
              </div>
              <p className="text-xs text-amber-300/80 mt-1">
                {alerts.alerts[0].reason}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('intelligence')}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold rounded-xl transition-all whitespace-nowrap border border-amber-500/30"
          >
            Review Precautions
          </button>
        </div>
      )}

      {/* Grid: Hero Current Weather & Leaflet Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hero Current Weather Card (2 cols) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Location Title & Status Tag */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <span className="text-xs font-semibold text-brand-400 tracking-wider uppercase">
                  Current Observation • {weather.location.country}
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {weather.location.name}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lat: {weather.location.latitude.toFixed(2)}°, Lon: {weather.location.longitude.toFixed(2)}° • Elev: {weather.location.elevation ?? 0}m
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  WMO {weather.weather_code}
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                  weather.precipitation > 0
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {weather.condition}
                </span>
              </div>
            </div>

            {/* Temperature Hero Display */}
            <div className="flex items-center gap-6 my-6">
              <WeatherIcon iconName={weather.icon} isDay={weather.is_day} className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-lg" />
              <div>
                <div className="flex items-baseline">
                  <span className="text-6xl sm:text-7xl font-extrabold text-white tracking-tighter">
                    {Math.round(weather.temperature)}
                  </span>
                  <span className="text-3xl sm:text-4xl font-light text-slate-400 ml-1">°C</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-400 mt-1">
                  <span>Feels like <strong className="text-slate-200">{Math.round(weather.apparent_temperature)}°C</strong></span>
                  {todayForecast && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-rose-300 font-semibold">
                        <TrendingUp className="w-3.5 h-3.5" /> {Math.round(todayForecast.max_temperature)}°
                      </span>
                      <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                        <TrendingDown className="w-3.5 h-3.5" /> {Math.round(todayForecast.min_temperature)}°
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Meteorological Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-700/50">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>Humidity</span>
              </div>
              <p className="text-lg font-bold text-white">{Math.round(weather.relative_humidity)}%</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                <span>Wind Velocity</span>
              </div>
              <p className="text-lg font-bold text-white">{weather.wind_speed.toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span></p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Gauge className="w-3.5 h-3.5 text-purple-400" />
                <span>Pressure</span>
              </div>
              <p className="text-lg font-bold text-white">{Math.round(weather.surface_pressure)} <span className="text-xs font-normal text-slate-400">hPa</span></p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>Precipitation</span>
              </div>
              <p className="text-lg font-bold text-white">{weather.precipitation.toFixed(1)} <span className="text-xs font-normal text-slate-400">mm</span></p>
            </div>
          </div>
        </div>

        {/* Interactive Location Map (1 col) */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>📍 Geographic Context</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Leaflet Map</span>
            </div>
            <div className="h-60 rounded-2xl overflow-hidden border border-slate-700">
              <WeatherMap
                latitude={weather.location.latitude}
                longitude={weather.location.longitude}
                cityName={weather.location.name}
                temperature={weather.temperature}
                condition={weather.condition}
              />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Timezone: {weather.location.timezone}</span>
            <span>{weather.is_day ? '☀️ Daytime' : '🌙 Nighttime'}</span>
          </div>
        </div>
      </div>

      {/* Row: ML Prediction Card & Weather Intelligence Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weather Predictions Summary Card */}
        <div className="bg-slate-800/80 border border-brand-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Weather Predictions</h3>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700 text-slate-300">
              1-3 Hour Horizon
            </span>
          </div>

          {/* Probability Gauge & Status */}
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700/50 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Rainfall Probability:</span>
              <span className="text-2xl font-black text-white">
                {prediction.rain_probability_percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  prediction.rain_probability >= 0.5 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(100, prediction.rain_probability_percentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                prediction.prediction_class === 1
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {prediction.prediction_label}
              </span>
              <span className="text-xs text-slate-400">
                Confidence: {(prediction.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Short, plain-language prediction and key factors */}
          <div className="text-xs text-slate-300 space-y-1 mb-4 leading-relaxed">
            <p className="font-semibold text-white">
              Rain likelihood: {prediction.rain_probability_percentage.toFixed(1)}% over the next 1–3 hours.
            </p>
            <p className="text-slate-400">
              Key factors: Relative humidity {Math.round(weather.relative_humidity)}%, {weather.precipitation > 0 ? `Precipitation ${weather.precipitation.toFixed(1)} mm` : weather.wind_speed > 0 ? `Wind speed ${weather.wind_speed.toFixed(1)} km/h` : `Pressure ${Math.round(weather.surface_pressure)} hPa`}.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('prediction')}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-xs font-semibold transition-all group"
          >
            <span>View Detailed Predictions & Trends</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Weather Intelligence Summary Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Weather Intelligence</h3>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              intelligence.overall_risk_level === 'Low'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : intelligence.overall_risk_level === 'Moderate'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              {intelligence.overall_risk_level} Risk
            </span>
          </div>

          <div className="space-y-2.5 mb-4">
            {intelligence.key_insights.slice(0, 3).map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{insight}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('intelligence')}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all group"
          >
            <span>Open Intelligence & Risk Analysis</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* 12-Hour Hourly Trend Chart Card */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              Upcoming 12-Hour Temperature & Rain Probability Trend
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('forecast')}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
          >
            Full 24-Hour & 7-Day Forecast →
          </button>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={miniChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff'
                }}
              />
              <Area
                type="monotone"
                dataKey="temperature"
                name="Temperature (°C)"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#tempGradient)"
              />
              <Area
                type="monotone"
                dataKey="rainProb"
                name="Rain Probability (%)"
                stroke="#818cf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#rainGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
