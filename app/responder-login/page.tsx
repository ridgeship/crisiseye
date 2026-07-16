"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useMockAuth } from "@/hooks/useMockAuth"
import { Lock, ChevronRight, AlertCircle, Building2 } from "lucide-react"

export default function ResponderLogin() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { signIn } = useMockAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signIn("password", { email: username, password, flow: "signIn" })
      router.push("/responder")
    } catch (err: any) {
      let cleanError = err.message || "Invalid responder credentials";
      if (cleanError.includes("Invalid email or password") || cleanError.includes("Invalid password")) {
        cleanError = "Invalid agency username or password.";
      } else if (cleanError.includes("Uncaught Error:")) {
        cleanError = cleanError.split("Uncaught Error:")[1]?.split(". at handler")[0]?.trim() || cleanError;
      }
      setError(cleanError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#050B14]">
      {/* Left panel - Branding */}
      <div className="hidden w-1/2 flex-col justify-between border-r border-slate-800 bg-[#0A1120] p-12 lg:flex relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-2 shadow-lg">
              <Image 
                src="/ghana-coat-of-arms-new.png" 
                alt="Coat of Arms" 
                width={40} 
                height={40} 
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">CrisisEye</span>
          </div>
          <div className="mt-8">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              National Emergency <br /> Response Portal
            </h1>
            <p className="mt-4 max-w-md text-lg text-slate-400">
              Authorized access only. This system is restricted to official national emergency response agencies and personnel.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4 rounded-lg border border-slate-800/60 bg-slate-900/50 p-4">
            <Building2 className="size-6 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-200">Inter-Agency Coordination Matrix</p>
              <p className="text-xs text-slate-500">Live synchronization active</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-slate-800/60 bg-slate-900/50 p-4">
            <Lock className="size-6 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-200">256-bit Encrypted Session</p>
              <p className="text-xs text-slate-500">Secured connection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Login Form */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-16 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 text-center lg:text-left">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-3 lg:mx-0">
              <Image 
                src="/ghana-coat-of-arms-new.png" 
                alt="Coat of Arms" 
                width={56} 
                height={56} 
                className="object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-white">Responder Login</h2>
            <p className="mt-2 text-slate-400">Enter your agency credentials to access the operational dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20">
                <AlertCircle className="size-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Agency Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="e.g. police"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#050B14] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating..." : "Access Dashboard"}
              {!loading && <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />}
            </button>
            
            <p className="text-center text-xs text-slate-500 mt-8">
              Unauthorized access is strictly prohibited and monitored.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
