import React, { useState, useEffect, useRef } from 'react';
import {
  CloudSun,
  LayoutDashboard,
  Calendar,
  Sparkles,
  ShieldAlert,
  Compass,
  Search,
  MapPin,
  X,
  Loader2,
  Navigation,
  Crosshair,
  Plus,
  Check
} from 'lucide-react';
import { searchLocations } from '../services/api';
import { LocationSuggestion } from '../types/weather';

export interface SavedCity {
  name: string;
  country?: string;
  lat?: number;
  lon?: number;
  displayName?: string;
}

const STORAGE_KEY = 'weatherintel_my_cities';
const DEFAULT_CITIES: SavedCity[] = [{ name: 'Delhi', country: 'India' }];

const loadSavedCities = (): SavedCity[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CITIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const valid = parsed
        .map((item) => (typeof item === 'string' ? { name: item } : item))
        .filter((item) => item && typeof item.name === 'string' && item.name.trim().length > 0);
      return valid.length > 0 ? valid : DEFAULT_CITIES;
    }
    return DEFAULT_CITIES;
  } catch {
    return DEFAULT_CITIES;
  }
};

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  selectedCity: string;
  selectedCoords?: { lat: number; lon: number };
  onSearchCity: (city: string, suggestion?: LocationSuggestion) => void;
  onDetectLocation: () => void;
  isDetectingLocation?: boolean;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedCity,
  selectedCoords,
  onSearchCity,
  onDetectLocation,
  isDetectingLocation = false,
  isLoading
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isShowingNearby, setIsShowingNearby] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // "My Cities" persistent list with Delhi as the only default
  const [myCities, setMyCities] = useState<SavedCity[]>(loadSavedCities);

  // Sync myCities state to browser localStorage
  useEffect(() => {
    try {
      if (myCities && myCities.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(myCities));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CITIES));
      }
    } catch (e) {
      console.error("Failed to persist cities to localStorage:", e);
    }
  }, [myCities]);

  const isCitySaved = (cityName: string): boolean => {
    return myCities.some((c) => c.name.toLowerCase() === cityName.toLowerCase());
  };

  const handleAddCityFromDropdown = (item: LocationSuggestion) => {
    if (isCitySaved(item.name)) return;

    const newCity: SavedCity = {
      name: item.name,
      country: item.country,
      lat: item.latitude,
      lon: item.longitude,
      displayName: item.display_name
    };

    setMyCities((prev) => [...prev, newCity]);
    // Does NOT change the active location; keeps dropdown open so user can add more cities!
  };

  const handleRemoveCity = (e: React.MouseEvent, cityName: string) => {
    e.stopPropagation();
    const updated = myCities.filter((c) => c.name.toLowerCase() !== cityName.toLowerCase());
    setMyCities(updated.length > 0 ? updated : DEFAULT_CITIES);
  };

  // Open the main search dropdown and focus input when + Add City is clicked in shortcuts row
  const handleOpenAddCityDropdown = async () => {
    setShowDropdown(true);
    inputRef.current?.focus();

    if (!searchInput.trim()) {
      setIsSearching(true);
      try {
        const nearby = await searchLocations('', selectedCoords?.lat, selectedCoords?.lon, 6);
        setSuggestions(nearby);
        setIsShowingNearby(true);
      } catch (err) {
        console.error("Error fetching nearby suggested cities:", err);
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Debounced search for suggestions as user types or nearby suggestions when empty
  useEffect(() => {
    const q = searchInput.trim();
    if (!q) {
      if (showDropdown) {
        setIsSearching(true);
        searchLocations('', selectedCoords?.lat, selectedCoords?.lon, 6)
          .then((nearby) => {
            setSuggestions(nearby);
            setIsShowingNearby(true);
          })
          .catch(() => {})
          .finally(() => setIsSearching(false));
      } else {
        setSuggestions([]);
        setIsShowingNearby(false);
      }
      setHighlightedIndex(-1);
      return;
    }

    setIsShowingNearby(false);
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(q);
        setSuggestions(results);
        setShowDropdown(true);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error("Auto-complete search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchInput, showDropdown, selectedCoords]);

  // Handle clicking outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    onSearchCity(suggestion.name, suggestion);
    setSearchInput('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      handleSelectSuggestion(suggestions[highlightedIndex]);
    } else if (searchInput.trim()) {
      onSearchCity(searchInput.trim());
      setSearchInput('');
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleClear = () => {
    setSearchInput('');
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'forecast', label: 'Forecast', icon: Calendar },
    { id: 'prediction', label: 'AI Weather Prediction', icon: Sparkles },
    { id: 'intelligence', label: 'Weather Intelligence', icon: ShieldAlert },
    { id: 'decision', label: 'Decision Support', icon: Compass }
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <CloudSun className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">WeatherIntel</span>
          </div>

          {/* Interactive Google Maps-Style Auto-Complete Search Box */}
          <div ref={containerRef} className="relative w-full md:w-96">
            <form onSubmit={handleSubmit} className="relative w-full">
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => {
                  if (!searchInput.trim()) {
                    handleOpenAddCityDropdown();
                  } else {
                    setShowDropdown(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={`Search any city worldwide (Current: ${selectedCity})...`}
                className="w-full bg-slate-800/90 text-sm text-slate-100 placeholder-slate-400 rounded-xl pl-9 pr-24 py-2 border border-slate-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

              {/* Clear / Spinner Icon */}
              <div className="absolute right-20 top-2.5 flex items-center gap-1.5">
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                ) : searchInput ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-slate-400 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-1.5 top-1 px-3 py-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {isLoading ? '...' : 'Search'}
              </button>
            </form>

            {/* Google Maps-style Auto-Complete Dropdown with Add (+) buttons */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-800/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3.5 py-1.5 bg-slate-900/80 border-b border-slate-700/50 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{isShowingNearby ? '📍' : '🔍'}</span>
                    <span>
                      {isShowingNearby
                        ? `Suggested Cities Near ${selectedCity.split(',')[0]}`
                        : 'Matching Global Cities'}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Click row to select • Click + to save
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-700/30 scrollbar-thin">
                  {suggestions.map((item, index) => {
                    const isHighlighted = index === highlightedIndex;
                    const saved = isCitySaved(item.name);
                    return (
                      <div
                        key={`${item.name}-${item.country}-${index}`}
                        onClick={() => handleSelectSuggestion(item)}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                          isHighlighted
                            ? 'bg-brand-600/30 text-white'
                            : 'hover:bg-slate-700/50 text-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="p-1.5 rounded-lg bg-slate-700/60 text-brand-400 mt-0.5 shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-white truncate">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                                {item.latitude.toFixed(1)}°, {item.longitude.toFixed(1)}°
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {[item.admin1, item.country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </div>

                        {/* Far right: Add to My Cities button (+) */}
                        <div className="shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                          {saved ? (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold select-none cursor-default"
                              title="Already saved in My Cities"
                            >
                              <Check className="w-3 h-3" />
                              <span>Added</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddCityFromDropdown(item);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/40 hover:border-brand-500 transition-all text-[11px] font-semibold shadow-sm active:scale-95"
                              title={`Add ${item.name} to My Cities without changing active location`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400 px-3">
                  <span>Click row to load weather</span>
                  <span>Click <b>+ Add</b> to save to My Cities</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* "My Cities" Shortcuts Row with Add City (+) Button */}
        <div className="flex items-center justify-between pb-2 text-xs border-t border-slate-800/60 pt-2 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full flex-wrap sm:flex-nowrap scrollbar-thin">
            <span className="text-slate-400 font-medium whitespace-nowrap">My Cities:</span>
            {myCities.map((city) => {
              const isSelected =
                selectedCity.toLowerCase() === city.name.toLowerCase() ||
                selectedCity.toLowerCase().startsWith(city.name.toLowerCase() + ',');
              return (
                <div
                  key={city.name}
                  className={`group inline-flex items-center rounded-md transition-all whitespace-nowrap text-xs ${
                    isSelected
                      ? 'bg-brand-600 text-white font-semibold shadow-sm'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const sug = city.lat && city.lon ? {
                        name: city.name,
                        country: city.country || '',
                        latitude: city.lat,
                        longitude: city.lon,
                        display_name: city.displayName || city.name
                      } : undefined;
                      onSearchCity(city.name, sug);
                    }}
                    className="px-2.5 py-1"
                  >
                    {city.name}
                  </button>
                  {/* Remove city shortcut button if user has multiple cities */}
                  {myCities.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveCity(e, city.name)}
                      className="pr-1.5 pl-0.5 py-1 text-slate-400 hover:text-rose-300 opacity-60 hover:opacity-100 transition-opacity"
                      title={`Remove ${city.name} from My Cities`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Permanent + Add City Button (opens main search dropdown and focuses search input) */}
            <button
              type="button"
              onClick={handleOpenAddCityDropdown}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-brand-300 border border-dashed border-slate-700 hover:border-brand-500/60 transition-all text-xs shadow-sm font-medium whitespace-nowrap"
              title="Add a city to My Cities using the main search bar"
            >
              <Plus className="w-3.5 h-3.5 text-brand-400" />
              <span>Add City</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              type="button"
              onClick={onDetectLocation}
              disabled={isDetectingLocation || isLoading}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-brand-300 border border-slate-700 hover:border-brand-500/50 transition-all shadow-sm group disabled:opacity-50"
              title="Detect your device GPS location and update weather dashboard"
            >
              {isDetectingLocation ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
              ) : (
                <Crosshair className="w-3.5 h-3.5 text-brand-400 group-hover:rotate-45 transition-transform" />
              )}
              <span>{isDetectingLocation ? 'Locating...' : 'Use My Location'}</span>
            </button>

            <div className="flex items-center gap-1.5 text-brand-400 font-medium bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <MapPin className="w-3.5 h-3.5 text-brand-400" />
              <span>Active: <strong className="text-white">{selectedCity}</strong></span>
            </div>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-600/30 text-brand-300 border border-brand-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
