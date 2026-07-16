"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps"
import { AlertTriangle, Loader2 } from "lucide-react"

import { useMockAuth } from "@/hooks/useMockAuth"

export default function ResponderMap() {
  const { user } = useMockAuth()
  const incidents = useQuery(api.responder.getLiveQueue, user ? { mockUserId: user._id } : "skip")
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey || apiKey === "your_google_maps_api_key_here") {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#0d1424]">
        <AlertTriangle className="mb-4 size-12 text-amber-500 opacity-50" />
        <h2 className="text-xl font-bold text-white">Google Maps API Key Missing</h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Please add <code className="text-primary">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your <code className="text-primary">.env.local</code> file to enable the Responder Map.
        </p>
      </div>
    )
  }

  if (incidents === undefined) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-800 bg-[#0d1424]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // Ghana center
  const center = { lat: 7.9465, lng: -1.0232 }

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-slate-800">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={6}
          mapId="responder_dark_map" // In a real app, use a valid Map ID that has dark mode vector styling
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeId: 'hybrid', // Gives us satellite + labels which looks professional for EOC
          }}
        >
          {incidents.map((incident) => (
            <AdvancedMarker
              key={incident._id}
              position={{ lat: incident.location.lat, lng: incident.location.lng }}
              title={incident.type}
            >
              <Pin 
                background={incident.status === 'Active' ? '#ef4444' : '#f59e0b'}
                borderColor={incident.status === 'Active' ? '#991b1b' : '#b45309'}
                glyphColor="#fff"
              />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  )
}
