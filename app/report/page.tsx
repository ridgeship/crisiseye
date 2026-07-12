import { ReportForm } from '@/components/report/report-form'
import { ShieldCheck, Clock, MapPin } from 'lucide-react'

const ASSURANCES = [
  { icon: ShieldCheck, label: 'Verified & routed', desc: 'Every report is checked for authenticity.' },
  { icon: Clock, label: 'Timestamped', desc: 'Exact time recorded for response tracking.' },
  { icon: MapPin, label: 'Location shared', desc: 'Responders receive your precise position.' },
]

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-destructive" />
          Emergency Reporting
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Report an Incident
        </h1>
        <p className="mt-2 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          Provide as much detail as you safely can. Your report helps agencies respond faster
          and keeps your community informed.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-7">
          <ReportForm />
        </div>

        <aside className="space-y-3 lg:pt-2">
          {ASSURANCES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="rounded-xl border border-border/60 bg-card/40 p-4"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{label}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <h3 className="text-sm font-semibold text-foreground">Life-threatening?</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Use the floating SOS button on any page, or call the direct emergency lines.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
