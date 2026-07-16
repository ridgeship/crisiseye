"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Map as MapIcon,
  BarChart3,
  LogOut,
  ShieldAlert,
  Radio
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AGENCIES } from "@/lib/data"
import { useMockAuth } from "@/hooks/useMockAuth"

const NAV_ITEMS = [
  { href: "/responder", label: "Dashboard", icon: LayoutDashboard },
  { href: "/responder/incidents", label: "Live Incidents", icon: AlertTriangle },
  { href: "/responder/map", label: "Google Live Map", icon: MapIcon },
  { href: "/responder/analytics", label: "Analytics", icon: BarChart3 },
]

export default function ResponderLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useMockAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user === null) {
      router.push("/login")
    } else if (user && (!user.role || user.role === "citizen")) {
      router.push("/")
    }
  }, [user, router])

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1424]">
        <Radio className="size-8 animate-pulse text-primary" />
      </div>
    )
  }

  if (user === null || !user.role || user.role === "citizen") {
    return null // Will redirect
  }

  const agency = AGENCIES.find((a) => a.id === user.role) || {
    name: "National Emergency Operations Centre",
    short: "NEOC",
    logo: "/ghana-coat-of-arms-new.png",
    accent: "#ffffff",
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0f1c] text-slate-200">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-800 bg-[#0d1424]">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 px-6">
          <ShieldAlert className="size-6 text-red-500" />
          <span className="font-bold tracking-tight text-white">CrisisEye Command</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-slate-800 text-white" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  )}
                >
                  <Icon className={cn("size-4", isActive ? "text-primary" : "text-slate-500")} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-slate-800 p-4">
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-white"
          >
            <LogOut className="size-4 text-slate-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Command Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-[#0d1424] px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Image
              src="/ghana-coat-of-arms-new.png"
              alt="Ghana"
              width={32}
              height={32}
              className="object-contain"
            />
            <div className="h-6 w-px bg-slate-700" />
            <div className="flex items-center gap-3">
              {agency.logo !== "/ghana-coat-of-arms-new.png" && (
                <Image
                  src={agency.logo}
                  alt={agency.short}
                  width={28}
                  height={28}
                  className="rounded object-contain"
                />
              )}
              <h1 className="font-semibold tracking-tight text-white">
                {agency.name}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-emerald-500">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="font-medium tracking-wide">NEN Online</span>
            </div>
            <div className="font-mono text-slate-400">
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                {user.name?.[0]?.toUpperCase() || "O"}
              </div>
              <span className="hidden font-medium text-slate-300 sm:block">{user.name || "Operator"}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#0a0f1c] p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
