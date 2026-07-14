"use client";

import { useState, useEffect } from "react";
import { CloudRain, Wind, Thermometer, Droplets, AlertTriangle, ShieldCheck, MapPin, Map, Navigation } from "lucide-react";
import { motion } from "framer-motion";

type WeatherData = {
  temp: number;
  humidity: number;
  windSpeed: number;
  rain: number;
  condition: string;
  locationName: string;
};

export default function CommunityRiskPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
          
          if (!API_KEY) {
            throw new Error("Weather API Key not configured");
          }

          const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`);
          const data = await res.json();
          
          setWeather({
            temp: data.main.temp,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            rain: data.rain ? data.rain["1h"] || 0 : 0,
            condition: data.weather[0].main,
            locationName: data.name || "Unknown Community",
          });
        } catch (err: any) {
          setError(err.message || "Failed to fetch weather data");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError("Please enable location services to view local risk intelligence.");
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Acquiring local hazard intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!weather) return null;

  // Simple heuristic risk engine
  const floodRisk = weather.rain > 5 ? "Critical" : weather.rain > 0 ? "Moderate" : "Low";
  const fireRisk = weather.temp > 35 && weather.humidity < 30 ? "High" : weather.temp > 30 ? "Moderate" : "Low";
  const stormRisk = weather.windSpeed > 20 ? "Critical" : weather.windSpeed > 10 ? "High" : "Low";
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Critical": return "bg-destructive text-destructive-foreground";
      case "High": return "bg-orange-500 text-white";
      case "Moderate": return "bg-yellow-500 text-white";
      default: return "bg-green-500 text-white";
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Community Risk Intelligence
        </h1>
        <p className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          Live telemetry for <span className="font-semibold text-foreground">{weather.locationName}, Ghana</span>
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Weather Metrics */}
        {[
          { label: "Temperature", value: `${Math.round(weather.temp)}°C`, icon: Thermometer },
          { label: "Rainfall (1h)", value: `${weather.rain} mm`, icon: CloudRain },
          { label: "Wind Speed", value: `${weather.windSpeed} m/s`, icon: Wind },
          { label: "Humidity", value: `${weather.humidity}%`, icon: Droplets },
        ].map((item, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={item.label} 
            className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Risk Assessment */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Hazard Assessment
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { type: "Flood Risk", level: floodRisk, icon: Waves },
              { type: "Fire Risk", level: fireRisk, icon: Flame },
              { type: "Storm Risk", level: stormRisk, icon: Wind },
            ].map((risk, i) => {
               // mock lucide icons for Waves and Flame to standard ones we already imported
               const Icon = risk.icon === Waves ? CloudRain : risk.icon === Flame ? Thermometer : Wind;
               return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  key={risk.type} 
                  className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getRiskColor(risk.level)}`}>
                      {risk.level}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground">{risk.type}</h3>
                </motion.div>
               )
            })}
          </div>

          <div className="rounded-xl border border-border/50 bg-secondary/30 p-6">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Safety Recommendations
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              {floodRisk !== "Low" && <li>• Move to higher ground. Avoid walking or driving through flood waters.</li>}
              {fireRisk !== "Low" && <li>• Avoid outdoor burning. Clear dry vegetation around properties.</li>}
              {stormRisk !== "Low" && <li>• Secure loose objects outdoors. Stay away from windows.</li>}
              {floodRisk === "Low" && fireRisk === "Low" && stormRisk === "Low" && <li>• Conditions are currently stable. Remain vigilant and report any hazards.</li>}
            </ul>
          </div>
        </div>

        {/* Local Areas */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Area Intelligence
          </h2>
          
          <div className="rounded-xl border border-border/50 bg-card/40 p-5">
            <h3 className="font-semibold text-foreground mb-4 text-sm text-muted-foreground uppercase tracking-wider">Nearby Safe Zones</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Navigation className="h-4 w-4 mt-1 text-green-500" />
                <div>
                  <p className="font-medium text-sm text-foreground">Community Center</p>
                  <p className="text-xs text-muted-foreground">2.4 km away • Elevated ground</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Navigation className="h-4 w-4 mt-1 text-green-500" />
                <div>
                  <p className="font-medium text-sm text-foreground">Municipal Hospital</p>
                  <p className="text-xs text-muted-foreground">4.1 km away • Medical support</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
            <h3 className="font-semibold text-foreground mb-4 text-sm text-destructive uppercase tracking-wider">Known Risk Areas</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 mt-1 text-orange-500" />
                <div>
                  <p className="font-medium text-sm text-foreground">Lower Valley Road</p>
                  <p className="text-xs text-muted-foreground">Prone to flash flooding</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
