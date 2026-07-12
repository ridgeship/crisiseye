import { Hero } from '@/components/home/hero'
import { FeatureStrip } from '@/components/home/feature-strip'
import { EmergencyContacts } from '@/components/home/emergency-contacts'

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureStrip />
      <EmergencyContacts />
    </>
  )
}
