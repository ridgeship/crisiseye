import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { FloatingActions } from '@/components/floating-actions'
import { MapView } from '@/components/map/map-view'

export const metadata: Metadata = {
  title: 'Live Incident Map | CrisisEye',
  description:
    'Explore verified emergency incidents across Ghana in real time on the CrisisEye live map.',
}

export default function MapPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 px-4 pb-4">
        <MapView />
      </main>
      <FloatingActions />
    </>
  )
}
