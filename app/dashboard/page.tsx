"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield, 
  Compass, 
  Bookmark, 
  Bell, 
  Phone, 
  ArrowUpRight, 
  ExternalLink,
  Info,
  Calendar,
  AlertCircle,
  MapPin,
  BookmarkCheck
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CATEGORY_META, type IncidentCategory } from "@/lib/data";

const CATEGORY_KEYS = Object.keys(CATEGORY_META) as IncidentCategory[];

export default function DashboardPage() {
  const user = useQuery(api.users.current, {});
  const incidents = useQuery(api.incidents.getIncidents, {});
  const bookmarks = useQuery(api.discovery.getBookmarks, {});
  const notifications = useQuery(api.discovery.getNotifications, {});
  const markRead = useMutation(api.discovery.markNotificationRead);
  const toggleBookmark = useMutation(api.discovery.toggleBookmark);

  const [activeTab, setActiveTab] = useState<"feed" | "my-reports" | "bookmarks">("feed");

  if (incidents === undefined || user === undefined) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center bg-[#070b14]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-slate-400 font-mono text-xs">Accessing Command Telemetry...</p>
        </div>
      </div>
    );
  }

  // Derive metrics
  const activeCount = incidents.filter((i: any) => !["RESOLVED", "PUBLISHED", "ARCHIVED"].includes(i.status)).length;
  const resolvedCount = incidents.filter((i: any) => ["RESOLVED", "PUBLISHED"].includes(i.status)).length;
  const myReports = incidents.filter((i: any) => i.reporterId === user?._id);

  // Data for charts
  const categoryCounts = incidents.reduce((acc: any, inc: any) => {
    const key = CATEGORY_KEYS.find(k => CATEGORY_META[k].label === inc.incidentType) || "other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(categoryCounts).map(([key, count]) => ({
    name: CATEGORY_META[key as IncidentCategory]?.label || key,
    count,
    color: CATEGORY_META[key as IncidentCategory]?.color || "#ffffff",
  }));

  const pieData = Object.entries(
    incidents.reduce((acc: any, inc: any) => {
      acc[inc.severity] = (acc[inc.severity] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ["#ff4d4d", "#ffa64d", "#ffff4d", "#4dff4d"];

  const handleNotificationClick = async (id: any) => {
    try {
      await markRead({ id });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 bg-[#070b14] text-slate-200 min-h-screen pb-12">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Citizen Safety Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your reports, view verified EOC notifications, and browse safety bulletins.
          </p>
        </div>
        
        {/* Shortcut Action Buttons */}
        <div className="flex items-center gap-3">
          <Link href="/discovery" className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold hover:bg-slate-850 hover:text-white transition-all">
            <Compass className="size-4 text-primary" />
            Browse Discovery Feed
          </Link>
          <Link href="/report" className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-all">
            <AlertTriangle className="size-4" />
            Report Emergency
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Incidents", value: activeCount, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
          { label: "Resolved Today", value: resolvedCount, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "My Reported Cases", value: myReports.length, icon: Shield, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Saved Advisories", value: bookmarks?.length || 0, icon: Bookmark, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-4 rounded-xl border border-slate-800 bg-[#0d1424] p-5 shadow-sm"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${metric.bg} ${metric.color}`}>
              <metric.icon className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{metric.label}</p>
              <p className="text-xl font-bold text-white mt-0.5">{metric.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area: Columns */}
      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Left Columns (Charts and Feeds) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Tabs header */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab("feed")}
              className={cn(
                "px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all",
                activeTab === "feed" ? "border-primary text-white" : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              Public Safety Alerts
            </button>
            <button
              onClick={() => setActiveTab("my-reports")}
              className={cn(
                "px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all",
                activeTab === "my-reports" ? "border-primary text-white" : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              My Reported Cases ({myReports.length})
            </button>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={cn(
                "px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all",
                activeTab === "bookmarks" ? "border-primary text-white" : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              Bookmarked Advisories ({bookmarks?.length || 0})
            </button>
          </div>

          <div className="space-y-6">
            {activeTab === "feed" && (
              <div className="space-y-4">
                {incidents.slice(0, 10).map((incident: any) => {
                  const date = new Date(incident.createdAt);
                  return (
                    <div key={incident._id} className="rounded-xl border border-slate-850 bg-[#0d1424]/60 p-4 hover:border-slate-800 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-white">{incident.incidentType}</span>
                        <span className="text-xs text-slate-500 font-mono">
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">{incident.description}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
                        <div className="flex gap-2">
                          <span className={cn(
                            "inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            incident.severity === "critical" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          )}>
                            {incident.severity}
                          </span>
                          <span className="inline-flex rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            {incident.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <MapPin className="size-3" />
                          <span>{incident.location.address}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {incidents.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-500">No public incident warnings in your area.</div>
                )}
              </div>
            )}

            {activeTab === "my-reports" && (
              <div className="space-y-6">
                {myReports.map((incident: any) => (
                  <div key={incident._id} className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Case: {incident._id.substring(0, 8)}</span>
                          <span className="rounded bg-slate-900 border border-slate-850 px-1.5 py-0.25 text-[9px] font-bold uppercase tracking-wider text-slate-400">{incident.status}</span>
                        </div>
                        <h3 className="font-bold text-base text-white mt-1">{incident.incidentType}</h3>
                      </div>
                      <span className="text-xs font-mono text-slate-500">{new Date(incident.createdAt).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-3 rounded border border-slate-850">
                      {incident.description || "No supplemental report description logged."}
                    </p>

                    {/* Timeline of Citizen's Report */}
                    {incident.statusHistory && incident.statusHistory.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-slate-850">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Service Status Updates</h4>
                        <div className="relative border-l border-slate-850 ml-2 pl-3.5 space-y-3 text-[11px]">
                          {incident.statusHistory.map((hist: any, idx: number) => (
                            <div key={idx} className="relative">
                              <div className="absolute -left-[19.5px] top-0.5 size-2 rounded-full bg-primary" />
                              <div className="flex justify-between text-slate-350">
                                <span className="font-semibold">{hist.status}</span>
                                <span className="text-[9px] text-slate-500 font-mono">{new Date(hist.timestamp).toLocaleTimeString()}</span>
                              </div>
                              {hist.note && <p className="text-slate-500 mt-0.5 text-[10px]">{hist.note}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {myReports.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-500">You have not submitted any emergency reports.</div>
                )}
              </div>
            )}

            {activeTab === "bookmarks" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {bookmarks?.map((bookmark: any) => (
                  <Link key={bookmark.id} href={`/discovery?article=${bookmark.id}`}>
                    <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 hover:border-slate-700 hover:bg-[#111a2f] transition-all cursor-pointer flex flex-col justify-between h-full">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary border border-primary/20 uppercase">{bookmark.category}</span>
                          <BookmarkCheck className="size-4 text-primary shrink-0" />
                        </div>
                        <h4 className="font-bold text-sm text-white leading-snug">{bookmark.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{bookmark.summary}</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-slate-800/40 mt-3 font-semibold uppercase font-mono">
                        <span>{bookmark.location}</span>
                        <span>{new Date(bookmark.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
                {bookmarks?.length === 0 && (
                  <div className="col-span-full text-center py-10 text-xs text-slate-500">No bookmarked advisories.</div>
                )}
              </div>
            )}
          </div>

          {/* Incidents Category distribution chart */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Incidents by Category</h3>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Contacts, Alerts, Notifications) */}
        <div className="space-y-6">
          
          {/* Notification Centre */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] shadow-sm flex flex-col max-h-[400px]">
            <div className="border-b border-slate-800 px-5 py-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Bell className="size-4 text-primary" />
                Notification Centre
              </h3>
              {notifications && notifications.filter(n => !n.read).length > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white animate-pulse">
                  NEW
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {notifications && notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif._id} 
                    onClick={() => handleNotificationClick(notif._id)}
                    className={cn(
                      "rounded-lg border p-3 cursor-pointer transition-colors relative",
                      notif.read 
                        ? "bg-slate-950/20 border-slate-900 text-slate-500" 
                        : "bg-primary/5 border-primary/20 text-slate-200"
                    )}
                  >
                    {!notif.read && (
                      <div className="absolute top-3 right-3 size-1.5 rounded-full bg-primary" />
                    )}
                    <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">{notif.message}</p>
                    <span className="text-[9px] text-slate-500 font-mono mt-2 block">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">No safety notifications.</div>
              )}
            </div>
          </div>

          {/* Emergency contacts card */}
          <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Phone className="size-4 text-emerald-400" />
              National Emergency Hotlines
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded bg-slate-950 p-2.5">
                <span className="font-semibold text-slate-250">Ghana Police Service</span>
                <span className="font-mono text-emerald-400 font-bold">191</span>
              </div>
              <div className="flex items-center justify-between rounded bg-slate-950 p-2.5">
                <span className="font-semibold text-slate-250">National Fire Service</span>
                <span className="font-mono text-emerald-400 font-bold">193</span>
              </div>
              <div className="flex items-center justify-between rounded bg-slate-950 p-2.5">
                <span className="font-semibold text-slate-250">Ambulance Service</span>
                <span className="font-mono text-emerald-400 font-bold">112</span>
              </div>
              <div className="flex items-center justify-between rounded bg-slate-950 p-2.5">
                <span className="font-semibold text-slate-250">NADMO Command</span>
                <span className="font-mono text-emerald-400 font-bold">030-2964884</span>
              </div>
            </div>
            <div className="mt-4 rounded border border-slate-800 bg-slate-950/20 p-2.5 text-[10px] text-slate-450 leading-relaxed">
              Ghana standard operational coordinates are monitored 24/7 by all emergency service units. Submitted EOC reports are routed in real-time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

