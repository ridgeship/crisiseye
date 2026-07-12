import type { Metadata } from 'next'
import { MapView } from '@/components/map/map-view'

export const metadata: Metadata = {
  title: 'Live Incident Map | CrisisEye',
  description:
    'Explore verified emergency incidents across Ghana in real time on the CrisisEye live map.',
}

export default function MapPage() {
  return <MapView />
}
