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

  // Filter states
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [agencyFilter, setAgencyFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const liveIncidents = useQuery(api.discovery.getPublicMapIncidents) || []

  const filtered = useMemo(() => {
    return liveIncidents.filter((i: any) => {
      // Find category key from label
      const catKey = CATEGORY_KEYS.find(k => CATEGORY_META[k].label === i.category || CATEGORY_META[k].label === i.title) || 'other'
      const catOk = activeCats.size === 0 || activeCats.has(catKey as IncidentCategory)
      
      const q = query.trim().toLowerCase()
      const queryOk =
        !q ||
        i.title.toLowerCase().includes(q) ||
        (i.locationName || '').toLowerCase().includes(q) ||
        (i.summary || '').toLowerCase().includes(q)

      const matchesSeverity = severityFilter === "all" || i.severity?.toLowerCase() === severityFilter.toLowerCase();
      const matchesAgency = agencyFilter === "all" || i.agency?.toLowerCase() === agencyFilter.toLowerCase();
      const matchesType = typeFilter === "all" || i.type === typeFilter;

      return catOk && queryOk && matchesSeverity && matchesAgency && matchesType;
    })
  }, [activeCats, query, liveIncidents, severityFilter, agencyFilter, typeFilter])

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
        <aside className={cn(
          "w-80 shrink-0 flex-col border-r border-border/60 bg-[#0d1424]/90",
          fullscreen ? "hidden" : "hidden lg:flex"
        )}>
          <div className="border-b border-slate-800 p-4 space-y-3.5">
            <h1 className="text-lg font-semibold tracking-tight text-white">Public Safety Map</h1>
            <p className="mt-0.5 text-xs text-slate-400">
              Displaying {filtered.length} verified public warnings & safety zones.
            </p>
            
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search location or title..."
                className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-primary"
              />
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-850">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Severity</label>
                <select 
                  value={severityFilter} 
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-1 text-slate-350 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Agency</label>
                <select 
                  value={agencyFilter} 
                  onChange={(e) => setAgencyFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-1 text-slate-350 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="police">Police</option>
                  <option value="fire">Fire</option>
                  <option value="ambulance">Medical</option>
                  <option value="nadmo">NADMO</option>
                </select>
              </div>
            </div>
          </div>

          {/* Categories select */}
          <div className="border-b border-slate-800 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Direct Filters
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
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                      active
                        ? 'border-transparent text-white'
                        : 'border-slate-800 text-slate-400 hover:text-white',
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
                const catKey = CATEGORY_KEYS.find(k => CATEGORY_META[k].label === incident.category || CATEGORY_META[k].label === incident.title) || 'other'
                const meta = CATEGORY_META[catKey as IncidentCategory]
                const Icon = meta.icon
                const sev = SEVERITY_META[severityFromLabel(incident.severity)]
                return (
                  <li key={incident.id}>
                    <button
                      onClick={() => setActiveId(incident.id)}
                      className={cn(
                        'w-full rounded-xl border p-3.5 text-left transition-colors cursor-pointer',
                        activeId === incident.id
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-850 bg-slate-950/40 hover:border-slate-750',
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
                            <p className="truncate text-sm font-semibold text-slate-200">
                              {incident.title}
                            </p>
                            <span className="shrink-0 font-mono text-[9px] text-slate-500">
                              {timeAgo(incident.publishedAt)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-slate-400 mt-0.5">
                            {incident.locationName}
                          </p>
                          <span
                            className={cn(
                              'mt-2 inline-block rounded border px-1.5 py-0.25 text-[9px] font-bold uppercase tracking-wider',
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
                <li className="py-8 text-center text-xs text-slate-500">
                  No public alerts match the current filter matrix.
                </li>
              )}
            </ul>
          </div>
        </aside>

        {/* Map area */}
        <div className="relative flex-1 bg-[#070b14]">
          <MapCanvas
            incidents={filtered}
            activeId={activeId}
            userPos={userPos}
            onSelect={setActiveId}
          />

          {/* Mobile search overlay */}
          <div className="absolute inset-x-3 top-3 z-500 lg:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search safety map..."
                className="w-full rounded-lg border border-slate-800 bg-[#0d1424]/90 py-2.5 pl-9 pr-3 text-sm text-slate-200 outline-none backdrop-blur placeholder:text-slate-500 focus:border-primary"
              />
            </div>
          </div>

          {/* Map controls */}
          <div className="absolute right-3 top-3 z-500 flex flex-col gap-2">
            <button
              onClick={locateMe}
              aria-label="Find my location"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-slate-200 backdrop-blur transition-colors hover:border-primary/50"
            >
              <LocateFixed className="size-4" />
            </button>
            <button
              onClick={() => setFullscreen((v) => !v)}
              aria-label="Toggle fullscreen"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-slate-200 backdrop-blur transition-colors hover:border-primary/50"
            >
              {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-label="Filters"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-slate-200 backdrop-blur transition-colors hover:border-primary/50 lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
            </button>
          </div>

          {/* Legend */}
          <div className={cn(
            "absolute bottom-3 left-3 z-500 rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 backdrop-blur",
            fullscreen ? "hidden" : "hidden sm:block"
          )}>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Color Index
            </span>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {CATEGORY_KEYS.map((cat) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: CATEGORY_META[cat].color }}
                  />
                  <span className="text-[11px] text-slate-400 font-medium">
                    {CATEGORY_META[cat].label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile filter sheet */}
          {showFilters && (
            <div className="absolute inset-x-3 bottom-3 z-550 rounded-xl border border-slate-850 bg-slate-950/95 p-4 backdrop-blur lg:hidden">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Filter categories</span>
                <button onClick={() => setShowFilters(false)} aria-label="Close filters">
                  <X className="size-4 text-slate-455" />
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
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                        active ? 'border-transparent text-white' : 'border-slate-800 text-slate-400',
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
  const incident = incidents.find((i) => i.id === id || i._id === id)
  if (!incident) return null
  const catKey = CATEGORY_KEYS.find(k => CATEGORY_META[k].label === incident.category || CATEGORY_META[k].label === incident.title) || 'other'
  const meta = CATEGORY_META[catKey as IncidentCategory]
  const Icon = meta.icon
  const sev = SEVERITY_META[severityFromLabel(incident.severity)]

  return (
    <div className="absolute bottom-3 right-3 z-550 w-[calc(100%-1.5rem)] max-w-sm rounded-xl border border-slate-800 bg-[#0d1424] p-4 text-slate-200 sm:w-80 shadow-2xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex size-9 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
          >
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{incident.title}</p>
            <p className="font-mono text-[9px] text-slate-500 uppercase">Alert Reference</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close">
          <X className="size-4 text-slate-400 hover:text-white" />
        </button>
      </div>
      <dl className="mt-4 space-y-2 text-xs leading-normal">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Location</dt>
          <dd className="text-slate-300 max-w-[60%] truncate text-right font-medium">{incident.locationName}</dd>
        </div>
        <div className="flex flex-col bg-slate-950 p-2.5 rounded border border-slate-850 space-y-1">
          <dt className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Verified Advisory</dt>
          <dd className="text-slate-350 line-clamp-3 text-[11px] leading-relaxed">{incident.summary || "No supplemental public summary logged."}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Severity</dt>
          <dd>
            <span className={cn('rounded border px-1.5 py-0.25 text-[9px] font-bold uppercase tracking-wider', sev.className)}>
              {sev.label}
            </span>
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Agency</dt>
          <dd className="font-semibold text-primary uppercase">{incident.agency}</dd>
        </div>
      </dl>
      <Link
        href={`/discovery?article=${incident.id || incident._id}`}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/50 bg-primary/10 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
      >
        <BookOpen className="size-4" />
        Read Full Discovery Article
      </Link>
    </div>
  )
}

function BookOpen(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

