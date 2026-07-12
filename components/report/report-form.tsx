'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  MapPin,
  LocateFixed,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CATEGORY_META, SEVERITY_META, type IncidentCategory, type Severity } from '@/lib/data'

const CATEGORIES = Object.entries(CATEGORY_META) as [
  IncidentCategory,
  (typeof CATEGORY_META)[IncidentCategory],
][]

const SEVERITIES = Object.entries(SEVERITY_META) as [
  Severity,
  (typeof SEVERITY_META)[Severity],
][]

type LocationState = {
  mode: 'auto' | 'manual'
  lat?: number
  lng?: number
  address: string
  status: 'idle' | 'locating' | 'ready' | 'error'
}

export function ReportForm() {
  const [category, setCategory] = useState<IncidentCategory | null>(null)
  const [severity, setSeverity] = useState<Severity>('moderate')
  const [description, setDescription] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [location, setLocation] = useState<LocationState>({
    mode: 'auto',
    address: '',
    status: 'idle',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const useCurrentLocation = () => {
    setLocation((l) => ({ ...l, mode: 'auto', status: 'locating' }))
    if (!('geolocation' in navigator)) {
      setLocation((l) => ({ ...l, status: 'error' }))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocation({
          mode: 'auto',
          lat: latitude,
          lng: longitude,
          address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          status: 'ready',
        })
      },
      () => setLocation((l) => ({ ...l, status: 'error' })),
    )
  }

  const onFiles = (list: FileList | null) => {
    if (!list) return
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, 5))
  }

  const canSubmit =
    !!category &&
    description.trim().length > 4 &&
    (location.mode === 'manual' ? location.address.trim().length > 2 : location.status === 'ready') &&
    confirmed

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    // Simulated dispatch to backend. Real API wiring lands with auth + DB.
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 1200)
  }

  if (submitted) {
    const ref = `INC-${Math.floor(1000 + Math.random() * 9000)}`
    return (
      <div className="rounded-2xl border border-primary/30 bg-card/60 p-8 text-center">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <CheckCircle2 className="size-7" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          Report Submitted
        </h2>
        <p className="mt-2 text-muted-foreground">
          Your incident has been logged and routed for verification. Reference{' '}
          <span className="font-mono text-foreground">{ref}</span>.
        </p>
        <div className="mx-auto mt-6 max-w-sm space-y-2 text-left">
          {[
            'Location and timestamp captured',
            'Report entered into the verification engine',
            'Nearest response agency will be notified',
          ].map((line) => (
            <div
              key={line}
              className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm text-foreground"
            >
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
              {line}
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button render={<Link href="/map" />} className="h-11 rounded-full px-5">
            View on Live Map
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-full border-border/70 px-5"
            onClick={() => {
              setSubmitted(false)
              setCategory(null)
              setDescription('')
              setConfirmed(false)
              setFiles([])
              setLocation({ mode: 'auto', address: '', status: 'idle' })
            }}
          >
            Submit Another Report
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Incident type */}
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">Incident Type</legend>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the category that best describes the emergency.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map(([key, meta]) => {
            const Icon = meta.icon
            const active = category === key
            return (
              <button
                type="button"
                key={key}
                onClick={() => setCategory(key)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                <span
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                >
                  <Icon className="size-4" />
                </span>
                {meta.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Location */}
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">Location</legend>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={useCurrentLocation}
            className={cn(
              'flex flex-1 items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
              location.mode === 'auto'
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border/60 bg-card/40 text-muted-foreground hover:text-foreground',
            )}
          >
            {location.status === 'locating' ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <LocateFixed className="size-4 text-primary" />
            )}
            Use Current Location
          </button>
          <button
            type="button"
            onClick={() =>
              setLocation((l) => ({ ...l, mode: 'manual', status: 'idle' }))
            }
            className={cn(
              'flex flex-1 items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
              location.mode === 'manual'
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border/60 bg-card/40 text-muted-foreground hover:text-foreground',
            )}
          >
            <MapPin className="size-4 text-primary" />
            Enter Manually
          </button>
        </div>

        {location.mode === 'auto' && location.status === 'ready' && (
          <p className="mt-2 flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-foreground">
            <MapPin className="size-4 text-primary" />
            GPS locked — <span className="font-mono">{location.address}</span>
          </p>
        )}
        {location.mode === 'auto' && location.status === 'error' && (
          <p className="mt-2 text-sm text-destructive">
            Could not access location. Please enable permissions or enter manually.
          </p>
        )}
        {location.mode === 'manual' && (
          <input
            type="text"
            value={location.address}
            onChange={(e) =>
              setLocation((l) => ({ ...l, address: e.target.value, status: 'ready' }))
            }
            placeholder="e.g. Adum, Kumasi, near the central market"
            className="mt-2 w-full rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary"
          />
        )}
      </fieldset>

      {/* Description */}
      <fieldset>
        <label htmlFor="description" className="text-sm font-semibold text-foreground">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what is happening, who is affected, and any immediate dangers."
          className="mt-2 w-full resize-none rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary"
        />
      </fieldset>

      {/* Evidence */}
      <fieldset>
        <span className="text-sm font-semibold text-foreground">Evidence (optional)</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-border/70 bg-card/40 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <Upload className="size-4" />
          Upload photos or video
        </button>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-sm text-foreground"
              >
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={`Remove ${file.name}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {/* Severity */}
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">Severity</legend>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {SEVERITIES.map(([key, meta]) => {
            const active = severity === key
            return (
              <button
                type="button"
                key={key}
                onClick={() => setSeverity(key)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border/60 bg-card/40 text-muted-foreground hover:text-foreground',
                )}
              >
                {meta.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Confirmation */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
        />
        <span className="text-sm leading-relaxed text-muted-foreground">
          I confirm this report is accurate to the best of my knowledge. Submitting false
          emergency reports is an offence under Ghanaian law.
        </span>
      </label>

      <Button
        type="submit"
        disabled={!canSubmit || submitting}
        className="h-12 w-full rounded-full text-sm"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Submitting report…
          </>
        ) : (
          <>
            Submit Report
            <ChevronRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  )
}
