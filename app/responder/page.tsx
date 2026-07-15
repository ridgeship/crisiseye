"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  Clock, 
  CloudRain, 
  Flame, 
  Wind,
  ShieldCheck
} from "lucide-react"

export default function ResponderOverview() {
  const stats = useQuery(api.responder.getStats)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Operational Cards */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <AlertTriangle className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Active Incidents</p>
              <p className="text-3xl font-bold text-white">{stats?.active ?? "-"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <Activity className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Units Dispatched</p>
              <p className="text-3xl font-bold text-white">{stats?.dispatched ?? "-"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Resolved Today</p>
              <p className="text-3xl font-bold text-white">{stats?.resolved ?? "-"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Clock className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Avg Response Time</p>
              <p className="text-3xl font-bold text-white">{stats?.averageResponseTime ?? "-"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] shadow-sm">
            <div className="border-b border-slate-800 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Recent Operational Log
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {[
                  { id: 1, text: "Police accepted Incident #INC-2043 (Adum)", time: "2m ago", icon: ShieldCheck },
                  { id: 2, text: "Fire Service dispatched Unit F-12 to Kaneshie", time: "14m ago", icon: Flame },
                  { id: 3, text: "New Critical Power Outage reported in Adum", time: "25m ago", icon: AlertTriangle },
                  { id: 4, text: "Ambulance marked Incident #152 as Resolved", time: "42m ago", icon: CheckCircle2 },
                ].map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-slate-800 p-1.5 text-slate-400">
                      <log.icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">{log.text}</p>
                      <p className="text-xs text-slate-500">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Community Risk) */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] shadow-sm">
            <div className="border-b border-slate-800 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Community Risk Intelligence
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <div className="flex items-center gap-3">
                  <Flame className="size-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Fire Risk</p>
                    <p className="text-xs text-slate-500">Greater Accra Region</p>
                  </div>
                </div>
                <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">HIGH</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-center gap-3">
                  <CloudRain className="size-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Flood Risk</p>
                    <p className="text-xs text-slate-500">Central Region Coast</p>
                  </div>
                </div>
                <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-400">MODERATE</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-800 p-3">
                <div className="flex items-center gap-3">
                  <Wind className="size-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Storm Risk</p>
                    <p className="text-xs text-slate-500">Nationwide</p>
                  </div>
                </div>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-400">LOW</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
