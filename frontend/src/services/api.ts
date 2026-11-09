import {
  CurrentWeather,
  ForecastResponse,
  MLPredictionResponse,
  WeatherIntelligenceResponse,
  RecommendationResponse,
  AlertsResponse,
  LocationSuggestion,
  ActivityType
} from '../types/weather';

const API_BASE_URL = 'http://localhost:8000';

function buildQuery(lat?: number, lon?: number, country?: string): string {
  const p = new URLSearchParams();
  if (lat !== undefined && lon !== undefined) {
    p.append('lat', lat.toString());
    p.append('lon', lon.toString());
  }
  if (country) {
    p.append('country', country);
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export async function fetchCurrentWeather(
  city: string,
  lat?: number,
  lon?: number,
  country?: string
): Promise<CurrentWeather> {
  const qStr = buildQuery(lat, lon, country);
  const res = await fetch(`${API_BASE_URL}/weather/${encodeURIComponent(city)}${qStr}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch weather data' }));
    throw new Error(err.detail || `Error ${res.status}: Failed to fetch weather`);
  }
  return res.json();
}

export async function fetchForecast(
  city: string,
  lat?: number,
  lon?: number,
  country?: string
): Promise<ForecastResponse> {
  const qStr = buildQuery(lat, lon, country);
  const res = await fetch(`${API_BASE_URL}/forecast/${encodeURIComponent(city)}${qStr}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch forecast' }));
    throw new Error(err.detail || `Error ${res.status}: Failed to fetch forecast`);
  }
  return res.json();
}

export async function fetchMLPrediction(
  city: string,
  lat?: number,
  lon?: number,
  country?: string
): Promise<MLPredictionResponse> {
  const qStr = buildQuery(lat, lon, country);
  const res = await fetch(`${API_BASE_URL}/prediction/${encodeURIComponent(city)}${qStr}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch ML prediction' }));
    throw new Error(err.detail || `Error ${res.status}: Failed to fetch ML prediction`);
  }
  return res.json();
}

export async function fetchWeatherIntelligence(
  city: string,
  lat?: number,
  lon?: number,
  country?: string
): Promise<WeatherIntelligenceResponse> {
  const qStr = buildQuery(lat, lon, country);
  const res = await fetch(`${API_BASE_URL}/intelligence/${encodeURIComponent(city)}${qStr}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch weather intelligence' }));
    throw new Error(err.detail || `Error ${res.status}: Failed to fetch intelligence`);
  }
  return res.json();
}

export async function fetchRecommendation(
  city: string,
  activity: ActivityType,
  lat?: number,
  lon?: number,
  country?: string
): Promise<RecommendationResponse> {
  const res = await fetch(`${API_BASE_URL}/recommendation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ city, activity, lat, lon, country })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to generate recommendation' }));
    throw new Error(err.detail || `Error ${res.status}: Failed to generate recommendation`);
  }
  return res.json();
}

export async function fetchAlerts(
  city: string,
  lat?: number,
  lon?: number,
  country?: string
): Promise<AlertsResponse> {
  const qStr = buildQuery(lat, lon, country);
  const res = await fetch(`${API_BASE_URL}/alerts/${encodeURIComponent(city)}${qStr}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch weather alerts' }));
    throw new Error(err.detail || `Error ${res.status}: Failed to fetch alerts`);
  }
  return res.json();
}

export async function searchLocations(
  query: string = '',
  lat?: number,
  lon?: number,
  limit: number = 8
): Promise<LocationSuggestion[]> {
  const q = query.trim();
  const params = new URLSearchParams();
  if (q) params.set('query', q);
  if (lat !== undefined && lon !== undefined) {
    params.set('lat', lat.toString());
    params.set('lon', lon.toString());
  }
  params.set('limit', limit.toString());

  try {
    const res = await fetch(`${API_BASE_URL}/search/locations?${params.toString()}`);
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    console.warn("Location search error:", err);
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<LocationSuggestion> {
  const res = await fetch(`${API_BASE_URL}/reverse-geocode?lat=${lat}&lon=${lon}`);
  if (!res.ok) {
    throw new Error('Failed to reverse geocode device coordinates');
  }
  return res.json();
}
