import React from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  LucideProps
} from 'lucide-react';

interface WeatherIconProps extends LucideProps {
  iconName: string;
  className?: string;
  isDay?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  iconName,
  className = "w-6 h-6",
  isDay = 1,
  ...props
}) => {
  const norm = (iconName || '').toLowerCase();

  if (norm.includes('sun') && !norm.includes('cloud')) {
    return <Sun className={`text-amber-400 animate-pulse ${className}`} {...props} />;
  }
  if (norm.includes('cloud-sun') || norm.includes('sun-cloud') || norm.includes('partly')) {
    return <CloudSun className={`text-amber-300 ${className}`} {...props} />;
  }
  if (norm.includes('fog')) {
    return <CloudFog className={`text-slate-400 ${className}`} {...props} />;
  }
  if (norm.includes('drizzle')) {
    return <CloudDrizzle className={`text-cyan-400 ${className}`} {...props} />;
  }
  if (norm.includes('rain')) {
    return <CloudRain className={`text-blue-400 ${className}`} {...props} />;
  }
  if (norm.includes('snow') || norm.includes('hail')) {
    return <CloudSnow className={`text-sky-200 ${className}`} {...props} />;
  }
  if (norm.includes('lightning') || norm.includes('thunder')) {
    return <CloudLightning className={`text-yellow-400 ${className}`} {...props} />;
  }
  if (norm.includes('wind')) {
    return <Wind className={`text-teal-400 ${className}`} {...props} />;
  }

  return <Cloud className={`text-slate-300 ${className}`} {...props} />;
};
