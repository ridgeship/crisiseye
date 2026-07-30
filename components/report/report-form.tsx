'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MapPin,
  LocateFixed,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Mic,
  Square,
  Play,
  Pause,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CATEGORY_META, SEVERITY_META, type IncidentCategory, type Severity } from '@/lib/data'
import { useMutation } from "convex/react"
// @ts-ignore
import { api } from "@/convex/_generated/api"

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

function VoiceRecorder({ onRecord }: { onRecord: (blob: Blob | null) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onRecord(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
  };

  const clearRecording = () => {
    setAudioURL(null);
    onRecord(null);
  };

  return (
    <div className="mt-2 rounded-xl border border-border/60 bg-card/40 p-4">
      {audioURL ? (
        <div className="flex items-center justify-between">
          <audio src={audioURL} controls className="h-8 max-w-[200px]" />
          <button onClick={clearRecording} type="button" className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground animate-pulse"
            >
              <Square className="size-4" /> Stop Recording
            </button>
          ) : (
            <button
              type="button"
              onPointerDown={startRecording}
              className="flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Mic className="size-4" /> Record Voice
            </button>
          )}
          <span className="text-sm text-muted-foreground">
            {isRecording ? "Recording... tap stop when done" : "Tap or hold to record an audio description"}
          </span>
        </div>
      )}
    </div>
  );
}

export function ReportForm() {
  const [category, setCategory] = useState<IncidentCategory | null>(null)
  const [severity, setSeverity] = useState<Severity>('moderate')
  const [description, setDescription] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [rejectedFiles, setRejectedFiles] = useState<File[]>([])
  const [analyzingMedia, setAnalyzingMedia] = useState(false)
  const [mediaStatus, setMediaStatus] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [evidenceConfidence, setEvidenceConfidence] = useState<string | null>(null)
  const [aiLabels, setAiLabels] = useState<string[]>([])
  const [aiConfidence, setAiConfidence] = useState<number | null>(null)
  const [aiManualReview, setAiManualReview] = useState<boolean>(false)
  const [aiSpamOrMeme, setAiSpamOrMeme] = useState<boolean>(false)
  const [aiOverrideRequested, setAiOverrideRequested] = useState<boolean>(false)
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [location, setLocation] = useState<LocationState>({
    mode: 'auto',
    address: '',
    status: 'idle',
  })
  const [privacyPreference, setPrivacyPreference] = useState<'private' | 'allow_publication'>('private')
  const [incidentId, setIncidentId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // @ts-ignore
  const reportIncident = useMutation(api.incidents.reportIncident);

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

  const onFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return
    if (!category) {
      alert("Please select an incident category before uploading media.");
      return;
    }

    const newFiles = Array.from(list).filter(f => f.type.startsWith('image/')).slice(0, 5);
    if (newFiles.length === 0) {
      setFiles(prev => [...prev, ...Array.from(list)].slice(0, 5));
      return;
    }
    
    setAnalyzingMedia(true);
    setMediaStatus(null);
    setAiSummary(null);
    setEvidenceConfidence(null);
    setAiLabels([]);
    setAiConfidence(null);
    setAiManualReview(false);
    setAiSpamOrMeme(false);
    setAiOverrideRequested(false);
    setRejectedFiles([]);

    try {
      // Send the first image to our secure server-side API route
      const formData = new FormData();
      formData.append('image', newFiles[0]);
      formData.append('category', CATEGORY_META[category!].label);

      const response = await fetch('/api/verify-incident', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Verification API returned an error');
      }

      const result = await response.json();

      // Store AI metadata for submission
      const confidence = Math.round((result.confidenceScore ?? 0) * 100);
      setAiConfidence(confidence);
      setAiLabels(result.detectedLabels ?? []);
      setAiManualReview(!!result.requiresManualReview);
      setAiSpamOrMeme(!!result.isMemeOrSpam);

      if (result.isMemeOrSpam || !result.isEmergencyRelated) {
        // Rejected - do NOT add to files, store in rejectedFiles and show warning
        setMediaStatus("Rejected");
        setAiSummary(result.rejectionReason || "Content does not appear to show a valid emergency.");
        setEvidenceConfidence("Low");
        setRejectedFiles(newFiles);
      } else {
        setFiles(prev => [...prev, ...newFiles].slice(0, 5));
        setRejectedFiles([]);
        if (result.requiresManualReview) {
          setMediaStatus("Needs Manual Review");
          setAiSummary(result.rejectionReason || "Image flagged for manual review by a responder.");
          setEvidenceConfidence("Low");
        } else {
          setMediaStatus("Relevant");
          setAiSummary(`AI verified. Confidence: ${confidence}%. Detected: ${(result.detectedLabels ?? []).join(', ')}`);
          setEvidenceConfidence("High");
        }
      }

    } catch (err) {
      console.error("Vision API Error:", err);
      // Graceful fallback - allow submission with manual review flag
      setFiles(prev => [...prev, ...newFiles].slice(0, 5));
      setRejectedFiles([]);
      setMediaStatus("Needs Manual Review");
      setAiSummary("Automatic media analysis is temporarily unavailable. A responder will review it.");
      setEvidenceConfidence("Low");
      setAiManualReview(true);
    } finally {
      setAnalyzingMedia(false);
    }
  }

  const canSubmit =
    !!category &&
    description.trim().length > 4 &&
    (location.mode === 'manual' ? location.address.trim().length > 2 : location.status === 'ready') &&
    confirmed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    
    try {
      const id = await reportIncident({
        incidentType: CATEGORY_META[category!].label,
        description: description,
        severity: SEVERITY_META[severity].label,
        location: {
          lat: location.lat || 0,
          lng: location.lng || 0,
          address: location.address
        },
        media: files.map(f => f.name),
        voiceNote: voiceBlob ? "voice-report-audio" : undefined,
        privacyPreference,
        // Include AI verification metadata if available
        ...(aiConfidence !== null ? { aiConfidence } : {}),
        ...(aiSummary ? { aiSummary } : {}),
        ...(aiLabels.length > 0 ? { aiLabels } : {}),
        ...(aiManualReview || aiOverrideRequested ? { aiManualReview: true } : {}),
        ...(aiOverrideRequested ? { aiManualReviewReason: "Citizen requested manual override after AI rejection." } : {}),
        ...(aiSpamOrMeme && aiOverrideRequested ? { aiSpamOrMeme: true } : {}),
      });
      
      setIncidentId(id)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error(err);
      alert("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    const ref = incidentId || `INC-${Math.floor(1000 + Math.random() * 9000)}`
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
            'Report entered into the verification engine (Estimated review: < 2 mins)',
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
          <Button render={<Link href="/dashboard" />} className="h-11 rounded-full px-5">
            View My Reports
          </Button>
          <Button render={<Link href="/map" />} variant="outline" className="h-11 rounded-full px-5 bg-background">
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
              setMediaStatus(null)
              setAiSummary(null)
              setEvidenceConfidence(null)
              setAiLabels([])
              setAiConfidence(null)
              setAiManualReview(false)
              setAiSpamOrMeme(false)
              setAiOverrideRequested(false)
              setVoiceBlob(null)
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
          placeholder="Describe exactly what is happening. Include the number of people involved, hazards, nearby landmarks and any important observations."
          className="mt-2 w-full resize-none rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary"
        />
      </fieldset>

      {/* Evidence */}
      <fieldset>
        <span className="text-sm font-semibold text-foreground">Evidence (optional)</span>
        
        {/* Voice Record */}
        <VoiceRecorder onRecord={(blob) => setVoiceBlob(blob)} />

        {/* File Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          disabled={analyzingMedia}
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-border/70 bg-card/40 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="size-4" />
          Upload photos or video
        </button>

        {analyzingMedia && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-primary">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm font-medium">Analysing media...</span>
          </div>
        )}

        {!analyzingMedia && mediaStatus === "Rejected" && !aiOverrideRequested && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
            <div className="flex items-start gap-3">
              <X className="size-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">✖ Image rejected by AI verification.</p>
                <p className="mt-1 text-sm opacity-90">This image does not appear to show a valid emergency.</p>
                {aiSummary && <p className="mt-2 text-xs italic opacity-80">AI Reason: {aiSummary}</p>}
                {aiLabels.length > 0 && (
                  <p className="mt-1.5 text-xs opacity-70">Detected: {aiLabels.join(', ')}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAiOverrideRequested(true);
                setFiles(prev => [...prev, ...rejectedFiles].slice(0, 5));
              }}
              className="self-start rounded-lg border border-destructive/40 bg-destructive/20 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/30 transition-colors"
            >
              Request Manual Override — Submit Anyway
            </button>
          </div>
        )}

        {!analyzingMedia && aiOverrideRequested && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-orange-500/20 bg-orange-500/10 p-4 text-orange-500">
            <AlertTriangle className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">⚠ Manual Override Requested</p>
              <p className="mt-1 text-xs opacity-90">A responder will manually review your submitted media. You may proceed with your report.</p>
            </div>
          </div>
        )}

        {!analyzingMedia && files.length > 0 && mediaStatus === "Relevant" && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-500">
            <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">✔ Media verified as emergency-related.</p>
              {aiConfidence !== null && (
                <p className="mt-1 text-xs opacity-90">Confidence: {aiConfidence}%</p>
              )}
              {aiLabels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {aiLabels.map(label => (
                    <span key={label} className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold">{label}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!analyzingMedia && files.length > 0 && mediaStatus === "Needs Manual Review" && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-orange-500/20 bg-orange-500/10 p-4 text-orange-500">
            <AlertTriangle className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">⚠ Flagged for manual review.</p>
              <p className="mt-1 text-sm opacity-90">Responders will verify this media before acting on the report.</p>
              {aiSummary && <p className="mt-2 text-xs italic opacity-80">AI Note: {aiSummary}</p>}
            </div>
          </div>
        )}

        {files.length > 0 && (
          <ul className="mt-4 space-y-1.5">
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

      {/* Privacy Preference */}
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">Privacy Preference</legend>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose whether responders can publish an anonymised version of this incident after it has been resolved to improve public awareness. Responders always have final approval.
        </p>
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
          <label
            className={cn(
              "flex flex-1 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
              privacyPreference === 'private'
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border/60 bg-card/40 text-muted-foreground hover:bg-secondary/40'
            )}
          >
            <input
              type="radio"
              name="privacy"
              value="private"
              checked={privacyPreference === 'private'}
              onChange={() => setPrivacyPreference('private')}
              className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Keep Private</span>
              <span className="mt-1 text-xs opacity-80">Only responders will see this report.</span>
            </div>
          </label>
          <label
            className={cn(
              "flex flex-1 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
              privacyPreference === 'allow_publication'
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border/60 bg-card/40 text-muted-foreground hover:bg-secondary/40'
            )}
          >
            <input
              type="radio"
              name="privacy"
              value="allow_publication"
              checked={privacyPreference === 'allow_publication'}
              onChange={() => setPrivacyPreference('allow_publication')}
              className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Allow Publication</span>
              <span className="mt-1 text-xs opacity-80">May appear on public maps when resolved.</span>
            </div>
          </label>
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
