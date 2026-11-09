import React from 'react';
import { MLPredictionResponse, CurrentWeather } from '../types/weather';
import {
  Sparkles,
  ShieldCheck,
  Brain,
  Activity,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface PredictionPageProps {
  prediction: MLPredictionResponse;
  weather: CurrentWeather;
}

export const PredictionPage: React.FC<PredictionPageProps> = ({
  prediction,
  weather
}) => {
  // Model feature importances from training
  const featureData = [
    { name: 'Past 3h Precip', importance: 41.4 },
    { name: 'Surface Pressure', importance: 18.7 },
    { name: 'Pressure Trend 3h', importance: 8.4 },
    { name: 'Wind Direction', importance: 4.9 },
    { name: 'Wind Speed', importance: 4.7 },
    { name: 'Temperature', importance: 4.1 },
    { name: 'Hour of Day', importance: 3.6 },
    { name: 'Humidity Trend', importance: 3.3 },
    { name: 'Relative Humidity', importance: 3.0 },
    { name: 'Dew Point Spread', importance: 3.0 }
  ];

  const cm = prediction.model_metrics?.confusion_matrix || [[4474, 1111], [277, 1151]];

  // Generate concise, plain-language key factors based on actual available weather parameters
  const getFactorsText = () => {
    const parts: string[] = [];
    if (weather?.surface_pressure != null) {
      parts.push(`Atmospheric pressure ${Math.round(weather.surface_pressure)} hPa`);
    }
    if (weather?.relative_humidity != null) {
      parts.push(`humidity ${Math.round(weather.relative_humidity)}%`);
    }
    if (weather?.wind_speed != null && weather.wind_speed > 0 && parts.length < 2) {
      parts.push(`wind speed ${weather.wind_speed.toFixed(1)} km/h`);
    }
    if (parts.length === 0) return null;
    if (parts.length === 1) return `Key factors: ${parts[0]}.`;
    if (parts.length === 2) return `Key factors: ${parts[0]} and ${parts[1]}.`;
    return `Key factors: ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}.`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Main Prediction & Probability Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ML Prediction Result (2 cols) */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-brand-400" />
                <h2 className="text-xl font-bold text-white">Live Model Inference: {prediction.location.name}</h2>
              </div>
            </div>

            {/* Probability Gauge & Big Indicator */}
            <div className="bg-slate-900/70 rounded-2xl p-6 border border-slate-700/60 my-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                    Computed Rainfall Likelihood
                  </span>
                  <div className="flex items-baseline mt-1">
                    <span className="text-5xl sm:text-6xl font-black text-white">
                      {prediction.rain_probability_percentage.toFixed(1)}%
                    </span>
                    <span className="text-slate-400 text-sm ml-2">Probability</span>
                  </div>
                  <span className="text-xs text-brand-300 font-medium">
                    Prediction Window: {prediction.prediction_horizon}
                  </span>
                </div>

                <div className="text-center sm:text-right">
                  <span className={`inline-block px-4 py-2 rounded-xl text-sm font-extrabold uppercase tracking-wide border shadow-sm ${
                    prediction.prediction_class === 1
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {prediction.prediction_label}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    Model Confidence: <strong>{(prediction.confidence_score * 100).toFixed(0)}%</strong>
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mt-5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    prediction.rain_probability >= 0.5
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${Math.min(100, prediction.rain_probability_percentage)}%` }}
                />
              </div>
            </div>

            {/* Explanation Narrative */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-400" />
                <span>Why this forecast?</span>
              </h3>
              <div className="text-xs sm:text-sm text-slate-300 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/50 leading-relaxed space-y-1.5">
                <p className="font-semibold text-white">
                  Rain likelihood: {prediction.rain_probability_percentage.toFixed(1)}% over the next 1–3 hours.
                </p>
                {getFactorsText() && (
                  <p className="text-slate-300">
                    {getFactorsText()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Metrics Card (1 col) */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Model Benchmark Metrics</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Evaluated on 7,013 holdout test samples (20% chronological split):
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">ROC-AUC</span>
                <span className="text-xl font-black text-brand-300">
                  {prediction.model_metrics?.roc_auc?.toFixed(4) || '0.8792'}
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Recall (Rain)</span>
                <span className="text-xl font-black text-emerald-300">
                  {prediction.model_metrics?.recall ? (prediction.model_metrics.recall * 100).toFixed(1) : '80.6'}%
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Accuracy</span>
                <span className="text-xl font-black text-white">
                  {prediction.model_metrics?.accuracy ? (prediction.model_metrics.accuracy * 100).toFixed(1) : '80.2'}%
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">F1-Score</span>
                <span className="text-xl font-black text-purple-300">
                  {prediction.model_metrics?.f1_score ? (prediction.model_metrics.f1_score * 100).toFixed(1) : '62.4'}%
                </span>
              </div>
            </div>

            {/* Confusion Matrix Table */}
            <span className="text-xs font-bold text-slate-300 block mb-2">
              Confusion Matrix (Test Split)
            </span>
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/60 text-xs">
              <div className="grid grid-cols-3 gap-1 text-center font-semibold text-slate-400 pb-1 border-b border-slate-800">
                <span></span>
                <span>Pred No Rain</span>
                <span>Pred Rain</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400 text-left font-medium">Actual No</span>
                <span className="text-emerald-400 font-bold">{cm[0][0]} (TN)</span>
                <span className="text-rose-400 font-bold">{cm[0][1]} (FP)</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center pt-1.5">
                <span className="text-slate-400 text-left font-medium">Actual Rain</span>
                <span className="text-amber-400 font-bold">{cm[1][0]} (FN)</span>
                <span className="text-cyan-400 font-bold">{cm[1][1]} (TP)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance Bar Chart */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <Layers className="w-5 h-5 text-brand-400" />
          <h3 className="font-bold text-white text-base">Key Feature Importance (% Gini Gain)</h3>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={featureData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
            >
              <XAxis type="number" unit="%" stroke="#64748b" fontSize={11} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="importance" fill="#0284c7" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
