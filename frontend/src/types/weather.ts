export interface LocationInfo {
  name: string;
  country: string;
  latitude: float;
  longitude: float;
  timezone: string;
  elevation?: number;
}

export type float = number;

export interface CurrentWeather {
  location: LocationInfo;
  temperature: number;
  apparent_temperature: number;
  relative_humidity: number;
  surface_pressure: number;
  wind_speed: number;
  wind_direction: number;
  precipitation: number;
  rain: number;
  weather_code: number;
  condition: string;
  icon: string;
  is_day: number;
  observation_time: string;
}

export interface HourlyForecastItem {
  time: string;
  temperature: number;
  relative_humidity: number;
  precipitation_probability: number;
  precipitation: number;
  weather_code: number;
  condition: string;
  icon: string;
  wind_speed: number;
}

export interface DailyForecastItem {
  date: string;
  max_temperature: number;
  min_temperature: number;
  precipitation_sum: number;
  precipitation_probability_max: number;
  max_wind_speed: number;
  weather_code: number;
  condition: string;
  icon: string;
}

export interface ForecastResponse {
  location: LocationInfo;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}

export interface MLPredictionResponse {
  location: LocationInfo;
  prediction_class: number;
  prediction_label: string;
  rain_probability: number;
  rain_probability_percentage: number;
  confidence_score: number;
  model_name: string;
  prediction_horizon: string;
  explanation: string;
  top_drivers: string[];
  model_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: number[][];
  };
  disclaimer: string;
}

export interface WeatherIntelligenceResponse {
  location: LocationInfo;
  meteorological_summary: string;
  condition_analysis: string;
  ml_synthesis: string;
  overall_risk_level: 'Low' | 'Moderate' | 'High' | 'Severe';
  key_insights: string[];
  potential_risks: string[];
  favorable_conditions: string[];
  atmospheric_parameters: {
    temperature_c: number;
    feels_like_c: number;
    relative_humidity_pct: number;
    surface_pressure_hpa: number;
    wind_speed_kmh: number;
    wind_direction_deg: number;
    rain_prob_ml_pct: number;
    is_day: boolean;
  };
}

export type ActivityType = 'Travel' | 'Outdoor Events' | 'Sports' | 'Agriculture';

export interface RecommendationResponse {
  activity: string;
  location: LocationInfo;
  suitability_status: 'Favorable' | 'Suitable with Precautions' | 'Caution Required' | 'Unfavorable / Postpone';
  suitability_score: number;
  primary_recommendation: string;
  reason: string;
  weather_factors: Record<string, any>;
  recommended_precautions: string[];
  actionable_advice: string;
}

export interface WeatherAlertItem {
  alert_id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  trigger_parameter: string;
  measured_value: string;
  threshold: string;
  reason: string;
  recommended_precautions: string[];
}

export interface AlertsResponse {
  location: LocationInfo;
  has_active_alerts: boolean;
  active_alerts_count: number;
  overall_risk_severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  disclaimer: string;
  alerts: WeatherAlertItem[];
}

export interface LocationSuggestion {
  id?: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  display_name: string;
}

