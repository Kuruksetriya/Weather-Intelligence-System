import React, { useState } from 'react';
import { ForecastResponse } from '../types/weather';
import { WeatherIcon } from '../components/WeatherIcon';
import {
  Calendar,
  Clock,
  Droplets,
  Wind,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Thermometer
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

interface ForecastPageProps {
  forecast: ForecastResponse;
}

export const ForecastPage: React.FC<ForecastPageProps> = ({ forecast }) => {
  const [chartView, setChartView] = useState<'temp' | 'rain' | 'wind'>('temp');

  const hourlyData = forecast.hourly.map((item) => {
    const rawTime = item.time.includes('T') ? item.time.split('T')[1] : item.time;
    return {
      time: rawTime,
      temperature: Math.round(item.temperature),
      precipitation_probability: Math.round(item.precipitation_probability),
      precipitation: parseFloat(item.precipitation.toFixed(1)),
      wind_speed: Math.round(item.wind_speed),
      condition: item.condition
    };
  });

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/60 p-6 rounded-3xl border border-slate-700/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            <span>24-Hour & 7-Day Forecast :</span>{' '}
            <span className="text-xl sm:text-2xl font-normal text-brand-300">
              {forecast.location.name}
            </span>
          </h1>
        </div>

        {/* Chart View Toggle Switch */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700">
          <button
            onClick={() => setChartView('temp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              chartView === 'temp' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temperature</span>
          </button>

          <button
            onClick={() => setChartView('rain')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              chartView === 'rain' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Rain Prob %</span>
          </button>

          <button
            onClick={() => setChartView('wind')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              chartView === 'wind' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind Speed</span>
          </button>
        </div>
      </div>

      {/* Chart Display Section */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              {chartView === 'temp' && '24-Hour Temperature Trajectory (°C)'}
              {chartView === 'rain' && 'Precipitation Probability & Rain Volume (%)'}
              {chartView === 'wind' && 'Sustained Wind Speed Progression (km/h)'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">Hourly Intervals</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'temp' ? (
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartTempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
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
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#chartTempGrad)"
                />
              </AreaChart>
            ) : chartView === 'rain' ? (
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
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
                <Bar
                  dataKey="precipitation_probability"
                  name="Rain Probability (%)"
                  fill="#818cf8"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            ) : (
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartWindGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
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
                  dataKey="wind_speed"
                  name="Wind Speed (km/h)"
                  stroke="#2dd4bf"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#chartWindGrad)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Timeline Cards (Horizontal Scroll) */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-brand-400" />
          <h3 className="font-bold text-white text-base">24-Hour Timeline Breakdown</h3>
        </div>

        <div className="flex space-x-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
          {forecast.hourly.map((h, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 rounded-2xl min-w-[95px] text-center transition-all shrink-0"
            >
              <span className="text-xs font-semibold text-slate-400">
                {h.time.includes('T') ? h.time.split('T')[1] : h.time}
              </span>

              <div className="my-2.5">
                <WeatherIcon iconName={h.icon} className="w-8 h-8" />
              </div>

              <span className="text-base font-extrabold text-white">
                {Math.round(h.temperature)}°C
              </span>

              <div className="flex items-center gap-1 text-[11px] text-blue-300 mt-2 font-medium">
                <Droplets className="w-3 h-3 text-blue-400" />
                <span>{Math.round(h.precipitation_probability)}%</span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                <Wind className="w-2.5 h-2.5 text-slate-500" />
                <span>{Math.round(h.wind_speed)} km/h</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Extended Forecast Section */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-brand-400" />
          <h3 className="font-bold text-white text-base">7-Day Extended Outlook</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {forecast.daily.map((d, index) => (
            <div
              key={index}
              className={`p-4 rounded-2xl border flex flex-col justify-between text-center transition-all ${
                index === 0
                  ? 'bg-brand-950/20 border-brand-500/40 shadow-md shadow-brand-500/5'
                  : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-900/80'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-white block">
                  {index === 0 ? 'Today' : getDayName(d.date)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {d.date}
                </span>

                <div className="my-3 flex justify-center">
                  <WeatherIcon iconName={d.icon} className="w-10 h-10" />
                </div>

                <span className="text-xs text-slate-300 font-medium block h-8 overflow-hidden line-clamp-2">
                  {d.condition}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 mt-3 space-y-1.5">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="font-bold text-rose-300 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" />{Math.round(d.max_temperature)}°
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="font-bold text-cyan-300 flex items-center">
                    <TrendingDown className="w-3 h-3 mr-0.5" />{Math.round(d.min_temperature)}°
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span className="flex items-center gap-1 text-blue-300">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    {Math.round(d.precipitation_probability_max)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="w-3 h-3 text-slate-500" />
                    {Math.round(d.max_wind_speed)}k
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
