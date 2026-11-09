import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface WeatherMapProps {
  latitude: number;
  longitude: number;
  cityName: string;
  temperature: number;
  condition: string;
}

export const WeatherMap: React.FC<WeatherMapProps> = ({
  latitude,
  longitude,
  cityName,
  temperature,
  condition
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([latitude, longitude], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([latitude, longitude], 12);
    }

    const customIcon = L.divIcon({
      className: 'custom-weather-pin',
      html: `
        <div style="background: #0284c7; color: white; border-radius: 9999px; padding: 4px 10px; font-weight: 700; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 4px; white-space: nowrap; border: 2px solid white; transform: translate(-50%, -50%);">
          <span>📍</span>
          <span>${temperature.toFixed(0)}°C</span>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setIcon(customIcon);
    } else {
      markerRef.current = L.marker([latitude, longitude], { icon: customIcon }).addTo(mapInstanceRef.current);
    }

    const popupHtml = `
      <div style="padding: 4px; font-family: sans-serif;">
        <h4 style="margin: 0 0 4px 0; font-weight: 700; font-size: 14px; color: #0f172a;">${cityName}</h4>
        <p style="margin: 0; font-size: 13px; color: #475569;">${condition} • <b>${temperature.toFixed(1)}°C</b></p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">📍 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°</p>
      </div>
    `;
    markerRef.current.bindPopup(popupHtml);

    // Invalidate size after layout renders
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [latitude, longitude, cityName, temperature, condition]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-700/60 shadow-inner relative z-0">
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
};
