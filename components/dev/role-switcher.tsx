"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Shield, ChevronDown, Check } from "lucide-react"

const ROLES = [
  { id: undefined, label: "Citizen (Default)" },
  { id: "police", label: "Police" },
  { id: "fire", label: "Fire Service" },
  { id: "ambulance", label: "Ambulance" },
  { id: "nadmo", label: "NADMO" },
  { id: "ecg", label: "ECG" },
  { id: "admin", label: "Admin" },
]

export function RoleSwitcher() {
  const user = useQuery(api.users.current)
  const switchRole = useMutation(api.users.switchRole)
  const [isOpen, setIsOpen] = useState(false)

  // Only render in development
  if (process.env.NODE_ENV !== "development") return null
  
  if (user === undefined || user === null) return null

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary shadow-lg backdrop-blur transition-all hover:bg-primary/20"
        >
          <Shield className="size-4" />
          <span>Dev Role: {user?.role || "Citizen"}</span>
          <ChevronDown className={`size-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-48 overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl">
            <div className="bg-muted p-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Select Role
            </div>
            <div className="flex max-h-60 flex-col overflow-y-auto p-1">
              {ROLES.map((role) => (
                <button
                  key={role.id || "default"}
                  onClick={() => {
                    switchRole({ role: role.id })
                    setIsOpen(false)
                  }}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <span className={user?.role === role.id ? "font-semibold text-primary" : "text-foreground"}>
                    {role.label}
                  </span>
                  {user?.role === role.id && <Check className="size-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
