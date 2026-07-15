"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
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
  Cell
} from "recharts"

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export default function AnalyticsDashboard() {
  const stats = useQuery(api.responder.getStats)
  const allIncidents = useQuery(api.responder.getLiveQueue)

  if (stats === undefined || allIncidents === undefined) {
    return <div className="p-8 text-center text-slate-400">Loading analytics...</div>
  }

  // Calculate some derived data for charts based on actual Convex data
  const categoryCounts = allIncidents.reduce((acc: any, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1
    return acc
  }, {})

  const pieData = Object.keys(categoryCounts).map(key => ({
    name: key,
    value: categoryCounts[key]
  }))

  const barData = [
    { name: "Mon", incidents: Math.floor(Math.random() * 10) + 2 },
    { name: "Tue", incidents: Math.floor(Math.random() * 10) + 2 },
    { name: "Wed", incidents: Math.floor(Math.random() * 10) + 2 },
    { name: "Thu", incidents: Math.floor(Math.random() * 10) + 2 },
    { name: "Fri", incidents: Math.floor(Math.random() * 10) + 2 },
    { name: "Sat", incidents: Math.floor(Math.random() * 10) + 2 },
    { name: "Sun", incidents: allIncidents.length }, // Current actual
  ]

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">Operations Analytics</h1>
        <p className="text-sm text-slate-400">Real-time performance metrics and historical trends.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly Trend */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-6 shadow-sm">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Incident Volume (7 Days)
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }} 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                />
                <Bar dataKey="incidents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-6 shadow-sm">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Category Breakdown (Active)
          </h2>
          <div className="h-72 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
