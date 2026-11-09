import React, { useState, useEffect } from 'react';
import {
  RecommendationResponse,
  ActivityType,
  CurrentWeather
} from '../types/weather';
import { fetchRecommendation } from '../services/api';
import {
  Plane,
  PartyPopper,
  Dumbbell,
  Sprout,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  ShieldAlert,
  Loader2,
  Sliders,
  ChevronRight
} from 'lucide-react';

interface DecisionSupportPageProps {
  currentWeather: CurrentWeather;
}

export const DecisionSupportPage: React.FC<DecisionSupportPageProps> = ({
  currentWeather
}) => {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('Travel');
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const activities: { id: ActivityType; label: string; icon: any; desc: string }[] = [
    {
      id: 'Travel',
      label: 'Travel & Commuting',
      icon: Plane,
      desc: 'Highway driving, road surface friction, crosswinds, and visibility'
    },
    {
      id: 'Outdoor Events',
      label: 'Outdoor Events & Festivals',
      icon: PartyPopper,
      desc: 'Marquees, attendee thermal comfort, precipitation risk, and staging'
    },
    {
      id: 'Sports',
      label: 'Sports & Athletics',
      icon: Dumbbell,
      desc: 'Field traction, heat exertion index, wind trajectory, and lightning safety'
    },
    {
      id: 'Agriculture',
      label: 'Agriculture & Farming',
      icon: Sprout,
      desc: 'Foliar spray drift windows, soil compaction, frost risks, and harvesting'
    }
  ];

  const loadRecommendation = async (act: ActivityType) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRecommendation(
        currentWeather.location.name,
        act,
        currentWeather.location.latitude,
        currentWeather.location.longitude,
        currentWeather.location.country
      );
      setRecommendation(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommendation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendation(selectedActivity);
  }, [selectedActivity, currentWeather.location.name]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Favorable':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Suitable with Precautions':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Caution Required':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Unfavorable / Postpone':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Activity Suitability & Advisory for {currentWeather.location.name}
        </h1>
      </div>

      {/* Activity Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activities.map((act) => {
          const Icon = act.icon;
          const isSelected = selectedActivity === act.id;
          return (
            <button
              key={act.id}
              onClick={() => setSelectedActivity(act.id)}
              className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-brand-600/25 border-brand-500 shadow-lg shadow-brand-500/10'
                  : 'bg-slate-800/70 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  isSelected ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base">{act.label}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{act.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-xs font-semibold">
                <span className={isSelected ? 'text-brand-300' : 'text-slate-400'}>
                  {isSelected ? 'Active Selection' : 'Evaluate Activity'}
                </span>
                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-brand-400' : 'text-slate-500'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Advisory & Assessment Output */}
      {loading ? (
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin mb-3" />
          <p className="text-sm text-slate-300 font-medium">
            Computing decision thresholds for {selectedActivity}...
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-3xl p-6 text-rose-200">
          <p className="font-bold text-sm">Failed to generate recommendation</p>
          <p className="text-xs text-rose-300 mt-1">{error}</p>
        </div>
      ) : recommendation ? (
        <div className="space-y-6">
          {/* Hero Result Banner */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-700/50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Domain: {recommendation.activity}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {recommendation.primary_recommendation}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Suitability Score</span>
                  <span className="text-2xl font-black text-white">{recommendation.suitability_score}/100</span>
                </div>
                <span className={`px-4 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider border shadow-sm ${getStatusColor(recommendation.suitability_status)}`}>
                  {recommendation.suitability_status}
                </span>
              </div>
            </div>

            {/* Suitability Score Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden my-6">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  recommendation.suitability_score >= 80
                    ? 'bg-emerald-500'
                    : recommendation.suitability_score >= 55
                    ? 'bg-cyan-500'
                    : recommendation.suitability_score >= 35
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${recommendation.suitability_score}%` }}
              />
            </div>

            {/* Decision Rationale */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-brand-400" />
                  <span>Explainable Decision Criteria & Triggered Rationale</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 leading-relaxed">
                  {recommendation.reason}
                </p>
              </div>

              {/* Recommended Precautions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Recommended Operational Precautions</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {recommendation.recommended_precautions.map((prec, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-slate-800"
                    >
                      <CheckCircle className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                      <span>{prec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Advice */}
              <div className="bg-brand-950/20 border border-brand-500/30 rounded-2xl p-4 text-xs text-brand-200 flex items-start gap-3">
                <span className="text-lg">💡</span>
                <div>
                  <strong className="font-bold text-white block">Actionable Protocol:</strong>
                  <span className="mt-0.5 block leading-relaxed">{recommendation.actionable_advice}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
