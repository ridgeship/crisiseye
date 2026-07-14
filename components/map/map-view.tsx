'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import {
  Search,
  LocateFixed,
  Maximize2,
  Minimize2,
  Navigation,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CATEGORY_META,
  SEVERITY_META,
  type IncidentCategory,
  type Severity,
} from '@/lib/data'
import { useQuery } from 'convex/react'
// @ts-ignore
import { api } from '@/convex/_generated/api'

const MapCanvas = dynamic(() => import('@/components/map/map-canvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-background text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
})

const CATEGORY_KEYS = Object.keys(CATEGORY_META) as IncidentCategory[]
const SEVERITY_KEYS = Object.keys(SEVERITY_META) as Severity[]

function timeAgo(num: number) {
  const diff = Date.now() - num
  const mins = Math.round(diff / 60000)
  if (mins < 1) return `Just now`
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  return `${hrs}h ago`
}

function severityFromLabel(label: unknown): Severity {
  if (typeof label !== 'string') return 'moderate'

  return SEVERITY_KEYS.find((key) => SEVERITY_META[key].label === label) ?? 'moderate'
}

export function MapView() {
  const [activeCats, setActiveCats] = useState<Set<IncidentCategory>>(new Set())
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // @ts-ignore
  const liveIncidents = useQuery(api.incidents.getIncidents) || []

  const filtered = useMemo(() => {
    return liveIncidents.filter((i: any) => {
      // Find category key from label
      const catKey = CATEGORY_KEYS.find(k => CATEGORY_META[k].label === i.type) || 'other'
      const catOk = activeCats.size === 0 || activeCats.has(catKey as IncidentCategory)
      const q = query.trim().toLowerCase()
      const queryOk =
        !q ||
        i.type.toLowerCase().includes(q) ||
        (i.location?.address || '').toLowerCase().includes(q)
      return catOk && queryOk
    })
  }, [activeCats, query, liveIncidents])

  const toggleCat = (cat: IncidentCategory) => {
    setActiveCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const locateMe = () => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition((pos) =>
      setUserPos([pos.coords.latitude, pos.coords.longitude]),
    )
  }

  return (
    <div
      className={cn(
        'relative transition-all duration-300',
        fullscreen 
          ? 'fixed inset-0 z-200 bg-background' 
          : 'h-[calc(100vh-7.5rem)] rounded-2xl overflow-hidden border border-border/60 shadow-lg mx-auto max-w-7xl',
      )}
    >
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="hidden w-80 shrink-0 flex-col border-r border-border/60 bg-card/40 lg:flex">
          <div className="border-b border-border/60 p-4">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Live Map</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {filtered.length} active {filtered.length === 1 ? 'incident' : 'incidents'} across Ghana
            </p>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search incidents or regions"
                className="w-full rounded-lg border border-border/60 bg-background/60 py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="border-b border-border/60 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CATEGORY_KEYS.map((cat) => {
                const meta = CATEGORY_META[cat]
                const active = activeCats.has(cat)
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCat(cat)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'border-transparent text-foreground'
                        : 'border-border/60 text-muted-foreground hover:text-foreground',
                    )}
                    style={active ? { backgroundColor: `${meta.color}22`, borderColor: meta.color } : undefined}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Incident list */}
          <div className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-2">
              {filtered.map((incident: any) => {
                const catKey = CATEGORY_KEYS.find(k => CATEGORY_META[k].label === incident.type) || 'other'
                const meta = CATEGORY_META[catKey as IncidentCategory]
                const Icon = meta.icon
                const sev = SEVERITY_META[severityFromLabel(incident.severity)]
                return (
                  <li key={incident._id}>
                    <button
                      onClick={() => setActiveId(incident._id)}
                      className={cn(
                        'w-full rounded-xl border p-3 text-left transition-colors',
                        activeId === incident._id
                          ? 'border-primary bg-primary/10'
                          : 'border-border/60 bg-background/40 hover:border-border',
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {incident.type}
                            </p>
                            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                              {timeAgo(incident._creationTime)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {incident.location.address}
                          </p>
                          <span
                            className={cn(
                              'mt-1.5 inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium',
                              sev.className,
                            )}
                          >
                            {sev.label}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
              {filtered.length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">
                  No incidents match your filters.
                </li>
              )}
            </ul>
          </div>
        </aside>

        {/* Map area */}
        <div className="relative flex-1">
          <MapCanvas
            incidents={filtered}
            activeId={activeId}
            userPos={userPos}
            onSelect={setActiveId}
          />

          {/* Mobile search overlay */}
          <div className="absolute inset-x-3 top-3 z-500 lg:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search incidents"
                className="w-full rounded-lg border border-border/60 bg-card/90 py-2.5 pl-9 pr-3 text-sm text-foreground outline-none backdrop-blur placeholder:text-muted-foreground/70 focus:border-primary"
              />
            </div>
          </div>

          {/* Map controls */}
          <div className="absolute right-3 top-3 z-500 flex flex-col gap-2">
            <button
              onClick={locateMe}
              aria-label="Find my location"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border/60 bg-card/90 text-foreground backdrop-blur transition-colors hover:border-primary/50"
            >
              <LocateFixed className="size-4" />
            </button>
            <button
              onClick={() => setFullscreen((v) => !v)}
              aria-label="Toggle fullscreen"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border/60 bg-card/90 text-foreground backdrop-blur transition-colors hover:border-primary/50"
            >
              {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-label="Filters"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border/60 bg-card/90 text-foreground backdrop-blur transition-colors hover:border-primary/50 lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-500 hidden rounded-xl border border-border/60 bg-card/90 p-3 backdrop-blur sm:block">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Legend
            </span>
            <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">
              {CATEGORY_KEYS.map((cat) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_META[cat].color }}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {CATEGORY_META[cat].label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile filter sheet */}
          {showFilters && (
            <div className="absolute inset-x-3 bottom-3 z-550 rounded-xl border border-border/60 bg-card/95 p-4 backdrop-blur lg:hidden">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Filter categories</span>
                <button onClick={() => setShowFilters(false)} aria-label="Close filters">
                  <X className="size-4 text-muted-foreground" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {CATEGORY_KEYS.map((cat) => {
                  const meta = CATEGORY_META[cat]
                  const active = activeCats.has(cat)
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCat(cat)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        active ? 'border-transparent text-foreground' : 'border-border/60 text-muted-foreground',
                      )}
                      style={active ? { backgroundColor: `${meta.color}22`, borderColor: meta.color } : undefined}
                    >
                      <span className="size-2 rounded-full" style={{ backgroundColor: meta.color }} />
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Selected incident detail */}
          {activeId && (
            <SelectedCard
              id={activeId}
              incidents={filtered}
              onClose={() => setActiveId(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function SelectedCard({ id, incidents, onClose }: { id: string; incidents: any[]; onClose: () => void }) {
  const incident = incidents.find((i) => i._id === id)
  if (!incident) return null
  const catKey = CATEGORY_KEYS.find(k => CATEGORY_META[k].label === incident.type) || 'other'
  const meta = CATEGORY_META[catKey as IncidentCategory]
  const Icon = meta.icon
  const sev = SEVERITY_META[severityFromLabel(incident.severity)]

  return (
    <div className="absolute bottom-3 right-3 z-550 w-[calc(100%-1.5rem)] max-w-sm rounded-xl border border-border/60 bg-card/95 p-4 backdrop-blur sm:w-80 shadow-2xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex size-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
          >
            <Icon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{incident.type}</p>
            <p className="font-mono text-xs text-muted-foreground">{incident._id}</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close">
          <X className="size-4 text-muted-foreground" />
        </button>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Location</dt>
          <dd className="text-foreground max-w-[60%] truncate text-right">{incident.location.address}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Description</dt>
          <dd className="text-foreground max-w-[60%] truncate text-right">{incident.description}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Severity</dt>
          <dd>
            <span className={cn('rounded border px-1.5 py-0.5 text-xs font-medium', sev.className)}>
              {sev.label}
            </span>
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-mono text-green-500 font-semibold">Active</dd>
        </div>
      </dl>
      <button
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/50 bg-primary/10 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
      >
        <Navigation className="size-4" />
        Dispatch Response Team
      </button>
    </div>
  )
}
