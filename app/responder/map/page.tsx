"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps"
import { AlertTriangle, Loader2, Compass, Layers, Eye, EyeOff, Info } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

export default function ResponderMap() {
  const user = useQuery(api.users.current)
  const incidents = useQuery(api.responder.getLiveQueue)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [mapMode, setMapMode] = useState<"operations" | "public">("operations")
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const mode = params.get("mode")
      if (mode === "public") {
        setMapMode("public")
      } else {
        setMapMode("operations")
      }
    }
  }, [pathname])

  const isKeyConfigured = apiKey && apiKey !== "your_google_maps_api_key_here" && apiKey.trim() !== "";

  if (incidents === undefined) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-xl border border-slate-800 bg-[#0d1424]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // Filter based on map mode
  const displayedIncidents = mapMode === "operations" 
    ? incidents 
    : incidents.filter(i => i.visibility === "PUBLIC" || i.status === "PUBLISHED");

  // Ghana center
  const center = { lat: 7.9465, lng: -1.0232 }

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] gap-4 overflow-hidden">
      
      {/* Top Map Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-white">Tactical Intelligence Map</h1>
          <p className="text-xs text-slate-400">Tactical GIS overlay tracking active distress reports and public visibility feeds.</p>
        </div>

        {/* Tabs for Operations Map vs Public Map Preview */}
        <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-850 self-start sm:self-auto">
          <button
            onClick={() => setMapMode("operations")}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              mapMode === "operations" 
                ? "bg-slate-800 text-white" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Layers className="size-3.5" />
            Operations Map (Private)
          </button>
          <button
            onClick={() => setMapMode("public")}
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

      {/* Main Map Viewer */}
      <div className="flex-1 w-full overflow-hidden rounded-xl border border-slate-850 bg-[#080d1a] relative flex items-center justify-center">
        
        {isKeyConfigured ? (
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={center}
              defaultZoom={6}
              mapId="responder_dark_map" 
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                mapTypeId: 'hybrid', 
              }}
            >
              {displayedIncidents.map((incident) => (
                <AdvancedMarker
                  key={incident._id}
                  position={{ lat: incident.location.lat, lng: incident.location.lng }}
                  title={incident.incidentType}
                >
                  <Pin 
                    background={
                      incident.status === 'RESOLVED' || incident.status === 'PUBLISHED' ? '#10b981' : 
                      ['EN_ROUTE', 'ON_SCENE'].includes(incident.status) ? '#ef4444' : '#f59e0b'
                    }
                    borderColor="#000"
                    glyphColor="#fff"
                  />
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>
        ) : (
          /* Graceful professional placeholder */
          <div className="flex flex-col items-center justify-center text-center p-6 max-w-md space-y-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-amber-500/80">
              <Compass className="size-7 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-slate-250">Tactical Map Engine Offline</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The GIS rendering subsystem requires a valid Google Maps API Key to overlay incident vectors. Please define <code className="bg-slate-950 px-1.5 py-0.5 rounded text-[11px] text-primary">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in environment settings.
              </p>
            </div>
            <div className="rounded border border-slate-800/80 bg-slate-900/10 p-3 text-[10px] text-slate-400 text-left flex gap-2">
              <Info className="size-4 shrink-0 text-slate-400 mt-0.5" />
              <span>
                <strong>Operations Status:</strong> Live Feed queue and EOC incident database tables remain fully functional. Only vector mapping is temporarily disabled.
              </span>
            </div>
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 rounded border border-slate-800 bg-slate-950/90 p-3 text-[10px] space-y-1.5 shadow-md">
          <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">GIS Color Index</p>
          <div className="flex items-center gap-2">
            <div className="size-2.5 rounded-full bg-[#ef4444]" />
            <span className="text-slate-300">En Route / On Scene Dispatch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2.5 rounded-full bg-[#f59e0b]" />
            <span className="text-slate-300">Received / Pending Review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2.5 rounded-full bg-[#10b981]" />
            <span className="text-slate-300">Resolved / Published Alerts</span>
          </div>
          {mapMode === "operations" && (
            <div className="pt-1.5 border-t border-slate-900 flex items-center gap-1.5 text-slate-500">
              <EyeOff className="size-3" />
              <span>Displaying Private & Restricted cases</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
