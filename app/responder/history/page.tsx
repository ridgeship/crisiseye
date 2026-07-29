"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Clock, CheckCircle2, Archive, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function IncidentHistoryPage() {
  const incidents = useQuery(api.responder.getLiveQueue);
  const [search, setSearch] = useState("");

  if (incidents === undefined) {
    return <div className="p-8 text-center text-slate-400">Loading historical log...</div>;
  }

  // Filter to resolved / archived incidents
  const history = incidents.filter(i => 
    ["RESOLVED", "PUBLISHED", "ARCHIVED"].includes(i.status)
  );

  const filtered = history.filter(i => 
    i.incidentType.toLowerCase().includes(search.toLowerCase()) ||
    i.location.address?.toLowerCase().includes(search.toLowerCase()) ||
    i._id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Incident Archive & History</h1>
          <p className="text-sm text-slate-400">Read-only historical logs of resolved, published, and archived cases.</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search archive..."
            className="w-full rounded-lg border border-slate-800 bg-[#0d1424] py-2 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/30 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Case ID</th>
                <th className="p-4">Incident Type</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Location</th>
                <th className="p-4">Assigned Agency</th>
                <th className="p-4">Completed Date</th>
                <th className="p-4">Final Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((item) => (
                <tr key={item._id} className="hover:bg-slate-900/10 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-400">{item._id.substring(0, 8)}...</td>
                  <td className="p-4 font-semibold text-slate-200">{item.incidentType}</td>
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                      item.severity === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      item.severity === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 max-w-xs truncate">{item.location.address}</td>
                  <td className="p-4 text-slate-400">{item.assignedAgency || "None"}</td>
                  <td className="p-4 text-slate-400 font-mono text-xs">
                    {item.resolvedAt ? new Date(item.resolvedAt).toLocaleString() : new Date(item.updatedAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
                      item.status === "PUBLISHED" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      item.status === "RESOLVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    )}>
                      {item.status === "PUBLISHED" ? <CheckCircle2 className="size-3" /> :
                       item.status === "RESOLVED" ? <CheckCircle2 className="size-3" /> : <Archive className="size-3" />}
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No historical logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
