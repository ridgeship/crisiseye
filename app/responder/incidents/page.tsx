"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"
import { Search, MapPin, Clock, CheckCircle2, AlertTriangle, Crosshair, Phone, MoreHorizontal, Check, ShieldAlert } from "lucide-react"
import { useMockAuth } from "@/hooks/useMockAuth"

export default function LiveQueue() {
  const { user } = useMockAuth()
  const incidents = useQuery(api.responder.getLiveQueue)
  const updateStatus = useMutation(api.responder.updateIncidentStatus)
  const assignUnit = useMutation(api.responder.assignUnit)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  if (incidents === undefined || user === undefined) {
    return <div className="p-8 text-center text-slate-400">Loading live queue...</div>
  }

  const rolePriorities: Record<string, string[]> = {
    police: ["crime", "accident"], // crime, road accidents
    fire: ["fire"], // fire, explosions (mapped to fire usually)
    ambulance: ["medical"], // medical emergencies
    nadmo: ["flood", "storm"], // floods, disasters
    ecg: ["other"], // electrical mapped to other currently
  };

  const prioritizedCategories = user?.role ? (rolePriorities[user.role] || []) : [];

  let filtered = incidents.filter(i => 
    i.description?.toLowerCase().includes(search.toLowerCase()) || 
    i.type.toLowerCase().includes(search.toLowerCase()) ||
    i.location.address?.toLowerCase().includes(search.toLowerCase())
  )

  // Sort: Put role's priority categories first, then sort by timestamp
  filtered = filtered.sort((a, b) => {
    const aPriority = prioritizedCategories.includes(a.type) ? 1 : 0;
    const bPriority = prioritizedCategories.includes(b.type) ? 1 : 0;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Priority categories first
    }
    // Then sort chronologically (newest first)
    return b.timestamp - a.timestamp;
  });

  const selectedIncident = incidents.find(i => i._id === selectedId)

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6">
      {/* Left List */}
      <div className="flex w-1/3 flex-col rounded-xl border border-slate-800 bg-[#0d1424] shadow-sm">
        <div className="border-b border-slate-800 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, Location, Type..."
              className="w-full rounded-md border border-slate-700 bg-slate-900/50 py-2 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-primary"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map((incident) => (
            <button
              key={incident._id}
              onClick={() => setSelectedId(incident._id)}
              className={cn(
                "mb-2 w-full rounded-lg border p-4 text-left transition-colors",
                selectedId === incident._id 
                  ? "border-primary bg-primary/10" 
                  : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800"
              )}
            >
              <div className="flex justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{incident.type}</span>
                <span className="text-xs font-mono text-slate-500">
                  {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-200">{incident.location.address}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  incident.status === "Active" ? "bg-red-500/20 text-red-400" :
                  incident.status === "Responding" ? "bg-orange-500/20 text-orange-400" :
                  "bg-emerald-500/20 text-emerald-400"
                )}>
                  {incident.status}
                </span>
                {incident.assignedAgency && (
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {incident.assignedAgency}
                  </span>
                )}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">No incidents match search.</div>
          )}
        </div>
      </div>

      {/* Right Details Panel */}
      {selectedIncident ? (
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#0d1424] shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{selectedIncident.type}</h2>
                  <span className={cn(
                    "rounded px-2 py-1 text-xs font-bold uppercase tracking-wider",
                    selectedIncident.severity === "critical" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                    selectedIncident.severity === "high" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                    "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  )}>
                    {selectedIncident.severity}
                  </span>
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <p className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="size-4" />
                    {selectedIncident.location.address} 
                    <span className="font-mono text-xs opacity-50">({selectedIncident.location.lat.toFixed(4)}, {selectedIncident.location.lng.toFixed(4)})</span>
                  </p>
                  {selectedIncident.location.isApproximate && (
                    <span className="inline-flex w-fit items-center gap-1 rounded bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-400 border border-orange-500/20">
                      <AlertTriangle className="size-3" />
                      Approximate IP Location
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-slate-500">ID: {selectedIncident._id}</p>
                <p className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-400">
                  <Clock className="size-3" />
                  {new Date(selectedIncident.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Main Info */}
            <div className="flex-1 overflow-y-auto border-r border-slate-800 p-6">
              
              <div className="mb-8">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Description</h3>
                <p className="text-sm leading-relaxed text-slate-300">{selectedIncident.description || "No description provided."}</p>
              </div>

              {/* Internal Service: Verification Engine Output */}
              <div className="mb-8 space-y-4 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Verification Engine</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Confidence Score</p>
                    <p className={cn(
                      "font-mono text-lg font-bold",
                      (selectedIncident.confidenceScore ?? 0) >= 80 ? "text-emerald-400" :
                      (selectedIncident.confidenceScore ?? 0) >= 50 ? "text-amber-400" : "text-red-400"
                    )}>
                      {selectedIncident.confidenceScore ?? 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Status</p>
                    <p className="font-semibold text-slate-200 capitalize">{selectedIncident.verificationStatus || "Pending"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Escalation Level</p>
                    <p className="font-semibold text-red-400">Level {selectedIncident.escalationLevel || 1}</p>
                  </div>
                </div>

                {(selectedIncident.mediaStatus || selectedIncident.aiSummary) && (
                  <div className="mt-4 border-t border-slate-800 pt-4">
                    <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Media Analysis</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-500">Media Status</p>
                        <p className={cn(
                          "font-semibold text-sm mt-0.5",
                          selectedIncident.mediaStatus === "Relevant" ? "text-emerald-400" :
                          selectedIncident.mediaStatus === "Needs Manual Review" ? "text-orange-400" : "text-red-400"
                        )}>
                          {selectedIncident.mediaStatus || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Evidence Confidence</p>
                        <p className={cn(
                          "font-semibold text-sm mt-0.5",
                          selectedIncident.evidenceConfidence === "High" ? "text-emerald-400" :
                          selectedIncident.evidenceConfidence === "Medium" ? "text-amber-400" : "text-red-400"
                        )}>
                          {selectedIncident.evidenceConfidence || "Unknown"}
                        </p>
                      </div>
                    </div>
                    {selectedIncident.aiSummary && (
                      <div className="mt-3 rounded-md bg-slate-900/50 p-3">
                        <p className="text-xs text-slate-400 italic">"{selectedIncident.aiSummary}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dispatch Controls */}
              <div className="rounded-lg border border-slate-800 p-4">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Dispatch Controls</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => assignUnit({ id: selectedIncident._id, unitName: "Unit Alpha-1" })}
                    className="flex items-center justify-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 py-2.5 text-sm font-semibold text-blue-400 transition-colors hover:bg-blue-500/20"
                  >
                    <Crosshair className="size-4" />
                    Assign Unit
                  </button>
                  <button 
                    onClick={() => updateStatus({ id: selectedIncident._id, status: "Responding", note: "Unit en route" })}
                    className="flex items-center justify-center gap-2 rounded-md border border-orange-500/30 bg-orange-500/10 py-2.5 text-sm font-semibold text-orange-400 transition-colors hover:bg-orange-500/20"
                  >
                    <Phone className="size-4" />
                    Mark En Route
                  </button>
                  <button 
                    onClick={() => updateStatus({ id: selectedIncident._id, status: "Resolved", note: "Situation contained" })}
                    className="col-span-2 flex items-center justify-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                  >
                    <CheckCircle2 className="size-4" />
                    Mark Resolved
                  </button>
                </div>
              </div>

            </div>

            {/* Emergency Timeline (Right Sidebar) */}
            <div className="w-80 overflow-y-auto bg-slate-900/20 p-6">
              <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Timeline</h3>
              
              <div className="relative space-y-6 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                {selectedIncident.timeline?.map((event: any, i: number) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    
                    {/* Timeline dot */}
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 shadow shadow-slate-900 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <div className="size-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    
                    {/* Timeline card */}
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] rounded-lg border border-slate-800 bg-[#0d1424] p-3 shadow-sm">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white">{event.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{event.note}</p>
                      <time className="mt-2 block font-mono text-[10px] text-slate-500">
                        {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </time>
                    </div>

                  </div>
                ))}

                {!selectedIncident.timeline && (
                  <p className="text-center text-xs text-slate-500">No events logged yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-slate-800 bg-[#0d1424] shadow-sm">
          <div className="text-center text-slate-500">
            <AlertTriangle className="mx-auto mb-3 size-8 opacity-20" />
            <p>Select an incident to view details and dispatch</p>
          </div>
        </div>
      )}
    </div>
  )
}
