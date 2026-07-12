'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CATEGORY_META, GHANA_CENTER, type Incident } from '@/lib/data'

interface MapCanvasProps {
  incidents: Incident[]
  activeId: string | null
  userPos: [number, number] | null
  onSelect: (id: string) => void
}

function buildMarkerIcon(color: string, active: boolean) {
  const size = active ? 34 : 26
  return L.divIcon({
    className: '',
    html: `
      <span style="
        position:relative;display:flex;align-items:center;justify-content:center;
        width:${size}px;height:${size}px;border-radius:9999px;
        background:${color}33;border:2px solid ${color};
        box-shadow:0 0 ${active ? 18 : 10}px ${color}aa;
      ">
        <span style="width:${active ? 12 : 9}px;height:${active ? 12 : 9}px;border-radius:9999px;background:${color};"></span>
      </span>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function MapCanvas({ incidents, activeId, userPos, onSelect }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const userMarkerRef = useRef<L.Marker | null>(null)

  // Initialize map once.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const map = L.map(containerRef.current, {
      center: GHANA_CENTER,
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Sync incident markers.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const existing = markersRef.current
    const seen = new Set<string>()

    incidents.forEach((incident) => {
      seen.add(incident.id)
      const color = CATEGORY_META[incident.category].color
      const active = incident.id === activeId
      let marker = existing.get(incident.id)
      if (!marker) {
        marker = L.marker([incident.lat, incident.lng], {
          icon: buildMarkerIcon(color, active),
        })
        marker.on('click', () => onSelect(incident.id))
        marker.bindTooltip(incident.title, { direction: 'top', offset: [0, -12] })
        marker.addTo(map)
        existing.set(incident.id, marker)
      } else {
        marker.setIcon(buildMarkerIcon(color, active))
      }
    })

    // Remove filtered-out markers.
    existing.forEach((marker, id) => {
      if (!seen.has(id)) {
        map.removeLayer(marker)
        existing.delete(id)
      }
    })
  }, [incidents, activeId, onSelect])

  // Pan to active incident.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !activeId) return
    const incident = incidents.find((i) => i.id === activeId)
    if (incident) map.flyTo([incident.lat, incident.lng], 11, { duration: 0.8 })
  }, [activeId, incidents])

  // User location marker.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !userPos) return
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current)
    const icon = L.divIcon({
      className: '',
      html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#4a83ff;border:3px solid #fff;box-shadow:0 0 12px #4a83ff;"></span>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    userMarkerRef.current = L.marker(userPos, { icon }).addTo(map)
    map.flyTo(userPos, 12, { duration: 0.8 })
  }, [userPos])

  return <div ref={containerRef} className="h-full w-full" />
}
