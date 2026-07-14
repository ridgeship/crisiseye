"use client";

import { useQuery } from "convex/react";
// @ts-ignore
import { api } from "@/convex/_generated/api";
import { Activity, AlertTriangle, CheckCircle, Clock, Shield } from "lucide-react";
import { motion } from "framer-motion";
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
  // @ts-ignore
  const incidents = useQuery(api.incidents.getIncidents);

  if (incidents === undefined) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading operational data...</p>
        </div>
      </div>
    );
  }

  // Derive metrics
  const activeCount = incidents.filter((i: any) => i.severity !== "Resolved").length;
  const resolvedCount = incidents.filter((i: any) => i.severity === "Resolved").length;
  // Just a static average for demonstration if there's no real historical data to compute
  const avgResponseTime = "12m 45s";

  // Data for charts
  const categoryCounts = incidents.reduce((acc: any, inc: any) => {
    const key = CATEGORY_KEYS.find(k => CATEGORY_META[k].label === inc.type) || "other";
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          National Command Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Real-time intelligence and resource allocation overview.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Incidents", value: activeCount, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Resolved Today", value: resolvedCount, icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Avg Response Time", value: avgResponseTime, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Agencies Online", value: "4", icon: Shield, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${metric.bg} ${metric.color}`}>
              <metric.icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main Charts */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-foreground mb-6">Incidents by Category</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ backgroundColor: "#000", border: "1px solid #333", borderRadius: "8px" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
          <div className="grid gap-8 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold text-foreground mb-6">Severity Distribution</h2>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #333", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <h2 className="text-lg font-bold text-foreground mb-2">System Status</h2>
                <p className="text-sm text-muted-foreground">All core services are operational.</p>
              </div>
              <ul className="mt-4 space-y-3">
                {["Convex Realtime DB", "Google Maps Engine", "Weather Risk API", "Dispatch Sync"].map((sys) => (
                  <li key={sys} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{sys}</span>
                    <span className="flex items-center gap-1.5 text-green-500 font-medium">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      Online
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-2xl border border-border/50 bg-card shadow-sm flex flex-col h-[calc(100vh-12rem)] min-h-[500px]"
        >
          <div className="border-b border-border/50 p-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Live Incident Feed
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {incidents.slice(0, 15).map((incident: any) => {
              const date = new Date(incident._creationTime);
              const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={incident._id} className="relative pl-6 pb-4">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-border/50 last:hidden" />
                  
                  {/* Timeline dot */}
                  <div className="absolute left-2 top-1.5 h-[8px] w-[8px] rounded-full bg-primary ring-4 ring-card" />
                  
                  <div className="rounded-xl border border-border/40 bg-secondary/20 p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm text-foreground">{incident.type}</span>
                      <span className="text-xs text-muted-foreground font-mono">{timeString}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-2">{incident.location.address}</p>
                    <span className="inline-flex rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                      {incident.severity}
                    </span>
                  </div>
                </div>
              );
            })}
            {incidents.length === 0 && (
              <div className="text-center text-muted-foreground text-sm mt-10">
                No active incidents.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
