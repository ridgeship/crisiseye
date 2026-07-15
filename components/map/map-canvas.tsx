'use client'

import { useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { CATEGORY_META, GHANA_CENTER, type IncidentCategory } from '@/lib/data'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation } from 'lucide-react'

interface MapCanvasProps {
  incidents: any[]
  activeId: string | null
  userPos: [number, number] | null
  onSelect: (id: string) => void
}

const CATEGORY_KEYS = Object.keys(CATEGORY_META) as IncidentCategory[]

export default function MapCanvas({ incidents, activeId, userPos, onSelect }: MapCanvasProps) {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  return (
    <div className="h-full w-full bg-background relative">
      {!API_KEY && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur">
          <p className="text-muted-foreground font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing</p>
        </div>
      )}
      {API_KEY && <APIProvider apiKey={API_KEY}>
        <Map
          mapId="crisiseye_map_id"
          defaultCenter={{ lat: GHANA_CENTER[0], lng: GHANA_CENTER[1] }}
          defaultZoom={7}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
        >
          <MapViewportController incidents={incidents} activeId={activeId} userPos={userPos} />
          {incidents.map((incident) => {
            const catKey = CATEGORY_KEYS.find(k => CATEGORY_META[k].label === incident.type) || 'other'
            const meta = CATEGORY_META[catKey as IncidentCategory]
            const color = meta.color
            const active = incident._id === activeId
            const Icon = meta.icon

            return (
              <AdvancedMarker
                key={incident._id}
                position={{ lat: incident.location.lat, lng: incident.location.lng }}
                onClick={() => onSelect(incident._id)}
                zIndex={active ? 100 : 1}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: active ? 1.2 : 1 }}
                  whileHover={{ scale: 1.1 }}
                  className="relative flex items-center justify-center cursor-pointer"
                >
                  {active && (
                    <span className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ backgroundColor: color }} />
                  )}
                  <div 
                    className="flex items-center justify-center rounded-full shadow-lg border-2 border-background"
                    style={{ backgroundColor: color, width: active ? 36 : 28, height: active ? 36 : 28 }}
                  >
                    <Icon className="text-white" size={active ? 20 : 14} />
                  </div>
                </motion.div>
              </AdvancedMarker>
            )
          })}

          {userPos && (
            <AdvancedMarker position={{ lat: userPos[0], lng: userPos[1] }} zIndex={999}>
              <div className="relative flex items-center justify-center">
                <span className="absolute inset-0 rounded-full animate-ping bg-blue-500 opacity-50" />
                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow">
                  <Navigation className="h-3 w-3 text-white" />
                </div>
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>}
    </div>
  )
}

function MapViewportController({
  incidents,
  activeId,
  userPos,
}: Pick<MapCanvasProps, 'incidents' | 'activeId' | 'userPos'>) {
  const map = useMap()

  useEffect(() => {
    if (!map || !activeId) return
    const incident = incidents.find((i) => i._id === activeId)
    if (!incident) return

    map.panTo({ lat: incident.location.lat, lng: incident.location.lng })
    map.setZoom(14)
  }, [activeId, incidents, map])

  useEffect(() => {
    if (!map || !userPos) return

    map.panTo({ lat: userPos[0], lng: userPos[1] })
    map.setZoom(15)
  }, [userPos, map])

  return null
}
