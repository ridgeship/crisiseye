import { BellRing, Users, BadgeCheck, Lock } from 'lucide-react'

const FEATURES = [
  {
    icon: BellRing,
    title: 'Real-time Alerts',
    description: 'Live updates on incidents and hazards as they unfold.',
  },
  {
    icon: Users,
    title: 'Community Intelligence',
    description: 'Know your risk. Stay prepared with local awareness.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Response',
    description: 'Coordinated and verified emergency response.',
  },
  {
    icon: Lock,
    title: 'Secure & Reliable',
    description: 'Your data is protected and encrypted.',
  },
]

export function FeatureStrip() {
  return (
    <section className="border-t border-border/60 bg-card/30">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px overflow-hidden px-4 py-2 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-start gap-3 px-2 py-6 sm:px-5">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
