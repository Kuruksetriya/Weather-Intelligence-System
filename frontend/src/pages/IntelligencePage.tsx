import React from 'react';
import { WeatherIntelligenceResponse, AlertsResponse } from '../types/weather';
import {
  ShieldAlert,
  Compass,
  AlertTriangle,
  CheckCircle2,
  ThumbsUp,
  Cpu,
  BarChart2,
  Wind,
  Droplets,
  Gauge,
  Thermometer,
  ShieldCheck
} from 'lucide-react';

interface IntelligencePageProps {
  intelligence: WeatherIntelligenceResponse;
  alerts: AlertsResponse;
}

export const IntelligencePage: React.FC<IntelligencePageProps> = ({
  intelligence,
  alerts
}) => {
  const p = intelligence.atmospheric_parameters;

  // Generate clean, plain-language synthesis if raw string contains legacy model terminology
  const getSynthesisText = () => {
    const raw = intelligence.ml_synthesis;
    if (raw && !raw.toLowerCase().includes('random forest') && !raw.toLowerCase().includes('model')) {
      return raw;
    }

    const rainProb = p?.rain_prob_ml_pct ?? 0;
    const isVeryLikely = rainProb >= 70;
    const isLikely = rainProb >= 50;
    const isTransitional = rainProb >= 25 && rainProb < 50;

    let likelihoodText = 'Rain is unlikely in the near term';
    if (isVeryLikely) {
      likelihoodText = 'Rain is very likely in the near term';
    } else if (isLikely) {
      likelihoodText = 'Rain is likely in the near term';
    }

    let conditionText = 'Atmospheric conditions remain stable.';
    if (intelligence.overall_risk_level === 'High' || intelligence.overall_risk_level === 'Severe') {
      conditionText = 'Atmospheric conditions are active and unsettled.';
    } else if (isLikely) {
      conditionText = 'Atmospheric conditions favor precipitation.';
    } else if (isTransitional || intelligence.overall_risk_level === 'Moderate') {
      conditionText = 'Atmospheric conditions are changing.';
    }

    return `${likelihoodText}, with a ${rainProb.toFixed(1)}% chance. ${conditionText}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-purple-950/50 to-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Weather Intelligence & Risk Analysis: {intelligence.location.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Atmospheric Stability:</span>
          <span className={`px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border shadow-sm ${
            intelligence.overall_risk_level === 'Low'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : intelligence.overall_risk_level === 'Moderate'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}>
            {intelligence.overall_risk_level} Risk
          </span>
        </div>
      </div>

      {/* Grid: Meteorological Summary & ML Synthesis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meteorological Overview Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-5 h-5 text-brand-400" />
              <h3 className="font-bold text-white text-base">Meteorological Summary</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 leading-relaxed mb-4">
              {intelligence.meteorological_summary}
            </p>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Thermodynamic & Atmospheric Condition Analysis
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/30 p-3.5 rounded-xl border border-slate-800">
              {intelligence.condition_analysis}
            </p>
          </div>
        </div>

        {/* Machine Learning Synthesis Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white text-base">Machine Learning Synthesis</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 leading-relaxed mb-4">
              {getSynthesisText()}
            </p>
            <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-200">
              💡 <strong>Model Integration Insight:</strong> This forecast combines seasonal rainfall patterns with current pressure trends to complement numerical weather forecasts.
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Key Insights, Potential Risks, and Favorable Factors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Key Insights */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-white text-base">Key Insights</h3>
          </div>
          <div className="space-y-3">
            {intelligence.key_insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                <span className="leading-snug">{insight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Potential Risks */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Potential Risks</h3>
          </div>
          <div className="space-y-3">
            {intelligence.potential_risks.map((risk, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs text-amber-200/90 bg-amber-950/20 p-3 rounded-xl border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span className="leading-snug">{risk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Favorable Conditions */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Favorable Factors</h3>
          </div>
          <div className="space-y-3">
            {intelligence.favorable_conditions.map((fav, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs text-emerald-200/90 bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span className="leading-snug">{fav}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Atmospheric Telemetry Matrix */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-brand-400" />
          <h3 className="font-bold text-white text-base">Atmospheric Telemetry Matrix</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-center">
            <Thermometer className="w-4 h-4 text-rose-400 mx-auto mb-1" />
            <span className="text-[11px] text-slate-400 block">Temperature</span>
            <span className="text-base font-bold text-white">{p.temperature_c.toFixed(1)}°C</span>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-center">
            <Thermometer className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[11px] text-slate-400 block">Feels Like</span>
            <span className="text-base font-bold text-white">{p.feels_like_c.toFixed(1)}°C</span>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-center">
            <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <span className="text-[11px] text-slate-400 block">Humidity</span>
            <span className="text-base font-bold text-white">{p.relative_humidity_pct.toFixed(0)}%</span>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-center">
            <Gauge className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span className="text-[11px] text-slate-400 block">Pressure</span>
            <span className="text-base font-bold text-white">{p.surface_pressure_hpa.toFixed(0)} hPa</span>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-center">
            <Wind className="w-4 h-4 text-teal-400 mx-auto mb-1" />
            <span className="text-[11px] text-slate-400 block">Wind Speed</span>
            <span className="text-base font-bold text-white">{p.wind_speed_kmh.toFixed(1)} km/h</span>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-center">
            <Compass className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <span className="text-[11px] text-slate-400 block">Wind Bearing</span>
            <span className="text-base font-bold text-white">{p.wind_direction_deg.toFixed(0)}°</span>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-center">
            <Cpu className="w-4 h-4 text-brand-400 mx-auto mb-1" />
            <span className="text-[11px] text-slate-400 block">ML Rain Prob</span>
            <span className="text-base font-bold text-brand-300">{p.rain_prob_ml_pct.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
