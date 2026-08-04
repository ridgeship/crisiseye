"use client"

import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps"
import { 
  AlertTriangle, 
  Loader2, 
  Compass, 
  Layers, 
  Eye, 
  EyeOff, 
  Info, 
  Flame, 
  HeartPulse, 
  ShieldAlert, 
  Car, 
  Zap, 
  Droplet, 
  Building,
  Play,
  Pause,
  SkipForward,
  Clock,
  ShieldCheck,
  X,
  CloudRain,
  Maximize2,
  Minimize2,
  MapPinOff,
  RotateCcw
} from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

// Category styling metadata
const CATEGORY_MAP_META: Record<string, { icon: any; color: string; bg: string }> = {
  "Fire": { icon: Flame, color: "#f87171", bg: "bg-red-950/90 border-red-500/80 text-red-400" },
  "Flood": { icon: CloudRain, color: "#60a5fa", bg: "bg-blue-950/90 border-blue-500/80 text-blue-400" },
  "Medical": { icon: HeartPulse, color: "#34d399", bg: "bg-emerald-950/90 border-emerald-500/80 text-emerald-400" },
  "Police": { icon: ShieldAlert, color: "#818cf8", bg: "bg-indigo-950/90 border-indigo-500/80 text-indigo-400" },
  "Road Accident": { icon: Car, color: "#fb923c", bg: "bg-orange-950/90 border-orange-500/80 text-orange-400" },
  "Power Outage": { icon: Zap, color: "#facc15", bg: "bg-yellow-950/90 border-yellow-500/80 text-yellow-400" },
  "Water Emergency": { icon: Droplet, color: "#22d3ee", bg: "bg-cyan-950/90 border-cyan-500/80 text-cyan-400" },
  "Collapsed Building": { icon: Building, color: "#94a3b8", bg: "bg-slate-900 border-slate-500 text-slate-400" },
  "Other": { icon: AlertTriangle, color: "#cbd5e1", bg: "bg-slate-900 border-slate-500 text-slate-400" },
};

// Tactical dark theme for EOC map
const darkTacticalStyle = [
  { elementType: "geometry", stylers: [{ color: "#0c101d" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0c101d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7489a2" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a5b4fc" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7489a2" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0b2024" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#161b2d" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#222a45" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7489a2" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2d375a" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3e4a7a" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#040b14" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#040b14" }]
  }
];

// Helper camera animation function
function animateCamera(
  map: google.maps.Map,
  target: { lat: number; lng: number; zoom: number; tilt: number; heading: number },
  duration: number,
  onComplete?: () => void
) {
  const startLat = map.getCenter()?.lat() || 0;
  const startLng = map.getCenter()?.lng() || 0;
  const startZoom = map.getZoom() || 1;
  const startTilt = map.getTilt() || 0;
  const startHeading = map.getHeading() || 0;

  const startTime = performance.now();

  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // cubic easing
    const ease = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const lat = startLat + (target.lat - startLat) * ease;
    const lng = startLng + (target.lng - startLng) * ease;
    const zoom = startZoom + (target.zoom - startZoom) * ease;
    const tilt = startTilt + (target.tilt - startTilt) * ease;
    
    let diff = target.heading - startHeading;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const heading = startHeading + diff * ease;

    map.moveCamera({
      center: { lat, lng },
      zoom,
      tilt,
      heading
    });

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      if (onComplete) onComplete();
    }
  }

  requestAnimationFrame(step);
}

// Custom control component for Operations Map camera & fly-in sequences
function OperationsMapController({
  selectedId,
  incidents,
  onArrival
}: {
  selectedId: string | null;
  incidents: any[];
  onArrival?: () => void;
}) {
  const map = useMap();
  const [initSequenceRun, setInitSequenceRun] = useState(false);

  useEffect(() => {
    if (!map) return;

    // Start with globe view centered on Atlantic
    map.moveCamera({
      center: { lat: 25.0, lng: -45.0 },
      zoom: 1.8,
      heading: 10,
      tilt: 0
    });

    // Animate to Ghana center
    const timer = setTimeout(() => {
      animateCamera(map, {
        lat: 7.9465,
        lng: -1.0232,
        zoom: 6.5,
        tilt: 20,
        heading: 180
      }, 2500, () => {
        // Zoom deep to Accra coordination zone
        animateCamera(map, {
          lat: 5.6037,
          lng: -0.1870,
          zoom: 11.5,
          tilt: 45,
          heading: 315
        }, 2200, () => {
          setInitSequenceRun(true);
        });
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [map]);

  // Handle selected incident camera fly-to
  useEffect(() => {
    if (!map || !selectedId || !initSequenceRun) return;
    const item = incidents.find(i => i._id === selectedId);
    if (!item) return;

    const lat = item.location?.lat;
    const lng = item.location?.lng;

    if (lat !== undefined && lng !== undefined) {
      animateCamera(map, {
        lat,
        lng,
        zoom: 15.5,
        tilt: 50,
        heading: 45
      }, 1500, () => {
        if (onArrival) onArrival();
      });
    }
  }, [selectedId, map, initSequenceRun, incidents]);

  return null;
}

export default function ResponderMap() {
  const user = useQuery(api.users.current, {})
  const incidents = useQuery(api.responder.getLiveQueue, {})
  const setIncidentMapVisibility = useMutation(api.responder.setIncidentMapVisibility)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [mapMode, setMapMode] = useState<"operations" | "public">("operations")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [updatingMapVisibility, setUpdatingMapVisibility] = useState(false)
  
  // Tactical Overlays State
  const [overlays, setOverlays] = useState({
    boundaries: false,
    radar: false,
    closures: false,
    units: false,
  })

  // Playback architecture state
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(100)
  const [showArchived, setShowArchived] = useState(false)

  const handleMapVisibilityChange = async (hiddenFromOperationsMap: boolean) => {
    if (!selectedIncident || updatingMapVisibility) return
    setUpdatingMapVisibility(true)
    try {
      await setIncidentMapVisibility({ id: selectedIncident._id, hiddenFromOperationsMap })
    } catch (error) {
      console.error(error)
      alert("Failed to update map marker visibility.")
    } finally {
      setUpdatingMapVisibility(false)
    }
  }

  // Simulation of timeline progress
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime(prev => (prev >= 100 ? 0 : prev + 5))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  if (incidents === undefined) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-xl border border-slate-800 bg-[#0d1424]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // Filter incidents depending on operations vs public mode
  const displayedIncidents = incidents.filter(i => {
    if (mapMode === "public") {
      return i.status === "PUBLISHED" && i.visibility === "PUBLIC";
    }
    // Operations Map filters
    if (i.status === "ARCHIVED" && !showArchived) return false;
    return true;
  });
  const markerIncidents = mapMode === "operations"
    ? displayedIncidents.filter((i) => !i.hiddenFromOperationsMap)
    : displayedIncidents;

  const selectedIncident = incidents.find(i => i._id === selectedId);
  const isKeyConfigured = apiKey && apiKey !== "your_google_maps_api_key_here" && apiKey.trim() !== "";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 overflow-hidden text-slate-200",
        isFullscreen
          ? "fixed inset-0 z-50 h-screen bg-[#070b14] p-3"
          : "h-[calc(100vh-7.5rem)]"
      )}
    >
      
      {/* Top Map Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-2.5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="size-5 text-primary" />
            Tactical Operations Command Map
          </h1>
          <p className="text-xs text-slate-400">WebGL-accelerated Command & Control overlay for real-time mission dispatch.</p>
        </div>

        {/* Map Type Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-primary/50"
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-850">
          <button
            onClick={() => {
              setMapMode("operations");
              setSelectedId(null);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              mapMode === "operations" 
                ? "bg-slate-800 text-white" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Layers className="size-3.5" />
            Operations Map (Dark Tactical)
          </button>
          <button
            onClick={() => {
              setMapMode("public");
              setSelectedId(null);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              mapMode === "public" 
                ? "bg-slate-800 text-white" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Eye className="size-3.5" />
            Public Map Preview
          </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-1 gap-3 overflow-hidden">
        
        {/* Left Side Controller Sidebar (Operations Mode Only) */}
        {mapMode === "operations" && !isFullscreen && (
          <div className="hidden w-80 shrink-0 flex-col rounded-lg border border-slate-800 bg-[#0b0f19] p-4 shadow-md space-y-4 xl:flex">
            
            {/* Playback Simulation */}
            <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="size-3 text-primary" /> Incident Playback Ticker
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 pointer-events-auto"
                    title={isPlaying ? "Pause Playback" : "Start Playback"}
                  >
                    {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                  </button>
                  <button 
                    onClick={() => setPlaybackTime(0)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Rewind Timeline"
                  >
                    <SkipForward className="size-3.5 rotate-180" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Time Delta: {playbackTime}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={playbackTime}
                onChange={(e) => setPlaybackTime(Number(e.target.value))}
                className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Tactical Overlays Toggles */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tactical GIS Overlays</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-850 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={overlays.radar}
                    onChange={(e) => setOverlays(prev => ({ ...prev, radar: e.target.checked }))}
                    className="accent-primary"
                  />
                  <span>Weather Radar</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-850 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={overlays.closures}
                    onChange={(e) => setOverlays(prev => ({ ...prev, closures: e.target.checked }))}
                    className="accent-primary"
                  />
                  <span>Road Closures</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-850 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={overlays.boundaries}
                    onChange={(e) => setOverlays(prev => ({ ...prev, boundaries: e.target.checked }))}
                    className="accent-primary"
                  />
                  <span>Disaster Zones</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-850 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={overlays.units}
                    onChange={(e) => setOverlays(prev => ({ ...prev, units: e.target.checked }))}
                    className="accent-primary"
                  />
                  <span>Active Units</span>
                </label>
              </div>
            </div>

            {/* List of active EOC queue items */}
            <div className="flex-1 flex flex-col min-h-0 space-y-1.5">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Incident Queue</p>
                <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="size-3 accent-primary"
                  />
                  Show Archived
                </label>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {displayedIncidents.map(inc => {
                  const meta = CATEGORY_MAP_META[inc.incidentType] || CATEGORY_MAP_META["Other"];
                  const Icon = meta.icon;
                  const isSelected = inc._id === selectedId;

                  return (
                    <button
                      key={inc._id}
                      onClick={() => setSelectedId(isSelected ? null : inc._id)}
                      className={cn(
                        "w-full text-left rounded-lg p-2.5 border transition-all text-xs flex gap-2.5 items-start cursor-pointer",
                        isSelected 
                          ? "bg-primary/10 border-primary shadow-sm" 
                          : "bg-slate-950 border-slate-850 hover:bg-slate-900"
                      )}
                    >
                      <div className={cn("size-7 shrink-0 rounded flex items-center justify-center border", meta.bg)}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-200 truncate">{inc.incidentType}</span>
                          <span className="text-[9px] font-mono text-slate-500 uppercase">{inc._id.substring(0,4)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{inc.location.address}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[9px] bg-slate-900 border border-slate-800 rounded px-1 text-slate-500 uppercase font-semibold">
                            {inc.status}
                          </span>
                          <span className="text-[9px] bg-red-950/20 border border-red-900/30 rounded px-1 text-red-400 font-semibold uppercase">
                            {inc.severity}
                          </span>
                          {inc.hiddenFromOperationsMap && (
                            <span className="text-[9px] bg-blue-950/20 border border-blue-900/30 rounded px-1 text-blue-300 font-semibold uppercase">
                              Cleared
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {displayedIncidents.length === 0 && (
                  <p className="text-center py-6 text-slate-500 text-xs">No active operations reports.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Center Main Map Container */}
        <div className="flex-1 w-full overflow-hidden rounded-lg border border-slate-850 bg-[#080d1a] relative flex items-center justify-center">
          
          {isKeyConfigured ? (
            <APIProvider apiKey={apiKey}>
              <Map
                mapId={mapMode === "operations" ? "responder_dark_map" : "public_clean_map"}
                defaultCenter={{ lat: 7.9465, lng: -1.0232 }}
                defaultZoom={6.5}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                zoomControl={true}
                styles={mapMode === "operations" ? darkTacticalStyle : []}
                mapTypeControl={false}
                streetViewControl={false}
              >
                {/* Controller which manages camera transitions */}
                {mapMode === "operations" && (
                  <OperationsMapController 
                    selectedId={selectedId} 
                    incidents={incidents}
                  />
                )}

                {/* Map Markers */}
                {markerIncidents.map((incident) => {
                  const meta = CATEGORY_MAP_META[incident.incidentType] || CATEGORY_MAP_META["Other"];
                  const Icon = meta.icon;
                  const isActive = incident._id === selectedId;
                  const isCritical = incident.severity === "critical" || incident.severity === "high";

                  return (
                    <AdvancedMarker
                      key={incident._id}
                      position={{ lat: incident.location.lat, lng: incident.location.lng }}
                      title={incident.incidentType}
                      onClick={() => setSelectedId(incident._id)}
                      zIndex={isActive ? 100 : (isCritical ? 50 : 10)}
                    >
                      <div className="relative flex items-center justify-center cursor-pointer">
                        {/* Radar ping ring for critical markers */}
                        {isCritical && (
                          <span className="radar-ring absolute size-10 rounded-full bg-red-500/30" />
                        )}
                        {/* Selected highlight pulse */}
                        {isActive && (
                          <span className="absolute inset-0 rounded-lg animate-ping opacity-35 bg-primary" />
                        )}

                        <div className={cn(
                          "size-8 rounded-lg flex items-center justify-center border shadow-md transition-all",
                          isActive ? "scale-115 border-primary bg-primary/20" : meta.bg
                        )}>
                          <Icon className="size-4" />
                        </div>
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* Simulated Overlays (mock polygons & lines) */}
                {mapMode === "operations" && overlays.boundaries && (
                  /* Custom overlay graphics for disaster bounds */
                  <AdvancedMarker position={{ lat: 5.6037, lng: -0.1870 }}>
                    <div className="rounded bg-indigo-500/10 border-2 border-dashed border-indigo-400 p-8 text-center text-[10px] text-indigo-400">
                      Accra Central Dispatch Ring
                    </div>
                  </AdvancedMarker>
                )}
              </Map>
            </APIProvider>
          ) : (
            /* Graceful professional placeholder when API key is missing */
            <div className="flex flex-col items-center justify-center text-center p-6 max-w-md space-y-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-amber-500/80">
                <Compass className="size-7 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-slate-250">Tactical GIS Engine Offline</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The GIS rendering subsystem requires a Google Maps API Key to load. Please define <code className="bg-slate-950 px-1.5 py-0.5 rounded text-[11px] text-primary">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
                </p>
              </div>
            </div>
          )}

          {/* Map Info Legend overlay */}
          <div className="absolute bottom-4 left-4 z-10 rounded border border-slate-800 bg-slate-950/90 p-3 text-[10px] space-y-1.5 shadow-md max-w-xs">
            <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Tactical Map Legend</p>
            {mapMode === "operations" ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded bg-red-950/90 border border-red-500/80" />
                  <span className="text-slate-350">Distress / Critical Hazards</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded bg-emerald-950/90 border border-emerald-500/80" />
                  <span className="text-slate-350">Resolved Incidents</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">⚠</span>
                  <span className="text-slate-350">High Severity (Pulsing Glow)</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-350">Citizen Published Alerts</span>
                </div>
                <p className="text-[9px] text-slate-500">Displaying public-sanitized safety locations only.</p>
              </>
            )}
          </div>
        </div>

        {/* Right Detail Panel Drawer (When selected in operations map) */}
        {mapMode === "operations" && selectedIncident && (
          <div
            className={cn(
              "flex flex-col rounded-lg border border-slate-800 bg-[#0b0f19] p-4 shadow-md space-y-4 overflow-y-auto",
              isFullscreen
                ? "absolute bottom-4 right-4 z-20 max-h-[60vh] w-[min(24rem,calc(100vw-2rem))]"
                : "absolute bottom-4 right-4 z-20 max-h-[55vh] w-[min(22rem,calc(100vw-2rem))] lg:static lg:max-h-none lg:w-80 lg:shrink-0"
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase">CASE: {selectedIncident._id.substring(0,8)}</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{selectedIncident.incidentType}</h3>
              </div>
              <button 
                onClick={() => setSelectedId(null)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="bg-slate-950/80 rounded border border-slate-850 p-2.5 text-xs text-slate-300 space-y-1.5">
              <p className="font-bold text-slate-400">Description</p>
              <p className="leading-relaxed">{selectedIncident.description || "No description provided."}</p>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between bg-slate-950/60 p-2 rounded">
                <span className="text-slate-500">Priority</span>
                <span className="font-semibold uppercase text-red-400">{selectedIncident.severity}</span>
              </div>
              <div className="flex justify-between bg-slate-950/60 p-2 rounded">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-slate-300">{selectedIncident.status}</span>
              </div>
              <div className="flex justify-between bg-slate-950/60 p-2 rounded">
                <span className="text-slate-500">Location</span>
                <span className="font-semibold text-slate-300 truncate max-w-[140px]" title={selectedIncident.location.address}>
                  {selectedIncident.location.address}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {selectedIncident.hiddenFromOperationsMap ? (
                <button
                  type="button"
                  onClick={() => handleMapVisibilityChange(false)}
                  disabled={updatingMapVisibility}
                  className="inline-flex items-center justify-center gap-1.5 rounded border border-emerald-700/40 bg-emerald-950/30 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/50 disabled:opacity-60"
                >
                  <RotateCcw className="size-3.5" />
                  Restore Marker on Map
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleMapVisibilityChange(true)}
                  disabled={updatingMapVisibility}
                  className="inline-flex items-center justify-center gap-1.5 rounded border border-blue-700/40 bg-blue-950/30 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-950/50 disabled:opacity-60"
                >
                  <MapPinOff className="size-3.5" />
                  Clear Marker from Operations Map
                </button>
              )}
            </div>

            {selectedIncident.aiConfidence && (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded p-3 text-xs">
                <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                  <Zap className="size-3.5" /> AI Operational Summary
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  {selectedIncident.aiSummary || "Analysis complete. Confidence rating is high."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* global custom style injection */}
      <style jsx global>{`
        @keyframes radarPulse {
          0% { transform: scale(0.85); opacity: 0.8; }
          50% { transform: scale(1.35); opacity: 0.35; }
          100% { transform: scale(1.85); opacity: 0; }
        }
        .radar-ring {
          animation: radarPulse 2.2s infinite ease-out;
        }
      `}</style>
    </div>
  )
}
