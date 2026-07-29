"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  Clock, 
  CloudRain, 
  Flame, 
  Wind,
  ShieldCheck,
  Send,
  Radio,
  History
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ResponderOverview() {
  const user = useQuery(api.users.current);
  const stats = useQuery(api.responder.getStats);
  const incidents = useQuery(api.responder.getLiveQueue);

  // Derive counts
  const total = stats?.total ?? 0;
  const pending = incidents?.filter(i => ["RECEIVED", "AI_REVIEW", "PENDING_REVIEW"].includes(i.status)).length ?? 0;
  const resolved = stats?.resolved ?? 0;
  const active = stats?.active ?? 0;
  const published = incidents?.filter(i => i.status === "PUBLISHED").length ?? 0;

  // AI metrics from live incident data
  const aiReviewed = incidents?.filter(i => i.aiConfidence !== undefined && i.aiConfidence !== null).length ?? 0;
  const manualReviews = incidents?.filter(i => i.aiManualReview === true).length ?? 0;
  const spamFlagged = incidents?.filter(i => i.aiSpamOrMeme === true).length ?? 0;
  const confidenceValues = incidents?.filter(i => i.aiConfidence !== undefined && i.aiConfidence !== null).map(i => i.aiConfidence as number) ?? [];
  const avgConfidence = confidenceValues.length > 0
    ? Math.round(confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length)
    : null;


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Emergency Operations Dashboard</h1>
        <p className="text-sm text-slate-400">National coordination overview, active dispatches, and emergency telemetry.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* EOC Dashboard cards */}
        <div className="rounded-xl border border-slate-800 bg-[#0b0f19] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Activity className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Total</p>
              <p className="text-2xl font-bold text-white mt-0.5">{total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0b0f19] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Review</p>
              <p className="text-2xl font-bold text-white mt-0.5">{pending}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0b0f19] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
              <Send className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Dispatch</p>
              <p className="text-2xl font-bold text-white mt-0.5">{active}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0b0f19] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved / Pub</p>
              <p className="text-2xl font-bold text-white mt-0.5">{resolved} <span className="text-xs font-normal text-slate-500">({published} pub)</span></p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0b0f19] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Response</p>
              <p className="text-2xl font-bold text-white mt-0.5">14m <span className="text-xs font-normal text-slate-500">est</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Telemetry Board */}
      <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 shadow-sm">
        <div className="border-b border-amber-500/15 px-5 py-3 flex items-center gap-2">
          <ShieldCheck className="size-4 text-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">AI Verification Telemetry</h2>
          <span className="ml-auto text-[10px] text-amber-500/60 font-mono">Live · Gemini 2.5 Flash</span>
        </div>
        <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Reviewed</p>
            <p className="text-2xl font-bold text-white mt-1">{aiReviewed}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Images processed</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Manual Reviews</p>
            <p className="text-2xl font-bold text-orange-400 mt-1">{manualReviews}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Awaiting responder</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Spam Flagged</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{spamFlagged}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Override submitted</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Confidence</p>
            <p className={`text-2xl font-bold mt-1 ${avgConfidence !== null && avgConfidence >= 70 ? 'text-emerald-400' : avgConfidence !== null ? 'text-orange-400' : 'text-slate-500'}`}>
              {avgConfidence !== null ? `${avgConfidence}%` : '—'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Across verified reports</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0b0f19] shadow-sm">
            <div className="border-b border-slate-800 px-5 py-4 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Incident Alerts
              </h2>
              <Link href="/responder/incidents" className="text-xs font-semibold text-primary hover:underline">
                View Queue
              </Link>
            </div>
            <div className="p-5">
              <div className="divide-y divide-slate-800/45 space-y-3.5">
                {incidents && incidents.length > 0 ? (
                  incidents.slice(0, 5).map((inc) => (
                    <div key={inc._id} className="flex items-start gap-3 pt-3.5 first:pt-0">
                      <div className="mt-0.5 rounded bg-slate-800 p-1.5 text-slate-400">
                        <AlertTriangle className="size-4 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-200 truncate">{inc.incidentType}</p>
                          <span className="text-xs font-mono text-slate-500">{new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{inc.location.address}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            "rounded px-1.5 py-0.25 text-[10px] font-bold uppercase tracking-wider",
                            ["RECEIVED", "AI_REVIEW", "PENDING_REVIEW"].includes(inc.status) ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            ["ACCEPTED", "ASSIGNED", "EN_ROUTE", "ON_SCENE"].includes(inc.status) ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          )}>
                            {inc.status}
                          </span>
                          <span className="rounded bg-slate-800 px-1.5 py-0.25 text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-700/60">
                            {inc.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">No active operational reports at this time.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Community Risk) */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0b0f19] shadow-sm">
            <div className="border-b border-slate-800 px-5 py-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ghana Threat Level Intelligence
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <div className="flex items-center gap-3">
                  <Flame className="size-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Fire Outbreak Index</p>
                    <p className="text-xs text-slate-500">Greater Accra / Kaneshie</p>
                  </div>
                </div>
                <span className="rounded bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400 uppercase">HIGH</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-center gap-3">
                  <CloudRain className="size-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Coastal Flooding Risk</p>
                    <p className="text-xs text-slate-500">Circle & Cape Coast Shore</p>
                  </div>
                </div>
                <span className="rounded bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 uppercase">MODERATE</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/10 p-3">
                <div className="flex items-center gap-3">
                  <Wind className="size-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Weather Risk Indicator</p>
                    <p className="text-xs text-slate-500">Nationwide</p>
                  </div>
                </div>
                <span className="rounded bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-400 uppercase">LOW</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

