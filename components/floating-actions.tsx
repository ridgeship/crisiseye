'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Flame, Car, Cross, Waves, ShieldAlert, HelpCircle } from 'lucide-react'
import { useMutation } from 'convex/react'
// @ts-ignore
import { api } from '@/convex/_generated/api'

export function FloatingActions() {
  const [isPressing, setIsPressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
  
  const pressTimer = useRef<NodeJS.Timeout | null>(null)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const autoSendTimer = useRef<NodeJS.Timeout | null>(null)

  // @ts-ignore
  const reportIncident = useMutation(api.incidents.reportIncident)

  const captureLocation = () => {
    return new Promise<{ lat: number, lng: number }>((resolve, reject) => {
      if (!('geolocation' in navigator)) return reject('No geolocation')
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err)
      )
    })
  }

  const sendReport = async (type: string, isUnknown = false) => {
    try {
      await reportIncident({
        type: type,
        description: isUnknown ? "Auto-dispatched via SOS timeout" : "Dispatched via SOS",
        severity: "Critical",
        location: {
          lat: location?.lat || 0,
          lng: location?.lng || 0,
          address: "SOS Location"
        }
      })
      alert(`SOS Dispatched: ${type}`)
    } catch (error) {
      console.error(error)
      alert("Failed to dispatch SOS. Call emergency numbers directly!")
    } finally {
      setSheetOpen(false)
    }
  }

  const startPress = async () => {
    setIsPressing(true)
    setProgress(0)
    
    // Try to get location early
    try {
      const loc = await captureLocation()
      setLocation(loc)
    } catch (e) {
      console.error(e)
    }

    progressInterval.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) return 100
        return p + 5 // 100% in 2000ms = 5% every 100ms
      })
    }, 100)

    pressTimer.current = setTimeout(() => {
      setIsPressing(false)
      clearInterval(progressInterval.current!)
      setSheetOpen(true)
      
      // Auto-send after 3 seconds
      autoSendTimer.current = setTimeout(() => {
        if (document.getElementById("sos-sheet")) {
          sendReport("Unknown Emergency", true)
        }
      }, 3000)

    }, 2000)
  }

  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    if (progressInterval.current) clearInterval(progressInterval.current)
    setIsPressing(false)
    setProgress(0)
  }

  useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current)
      if (progressInterval.current) clearInterval(progressInterval.current)
      if (autoSendTimer.current) clearTimeout(autoSendTimer.current)
    }
  }, [])

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          className="group relative flex size-16 items-center justify-center rounded-full bg-destructive shadow-2xl transition-transform hover:scale-105"
          aria-label="Hold for SOS"
        >
          {isPressing && (
            <svg className="absolute inset-0 size-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="30"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="4"
              />
              <circle
                cx="32"
                cy="32"
                r="30"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeDasharray="188.4"
                strokeDashoffset={188.4 - (188.4 * progress) / 100}
                className="transition-all duration-100 ease-linear"
              />
            </svg>
          )}
          <AlertCircle className="size-8 text-white" />
        </button>
      </div>

      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            id="sos-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[100] rounded-t-3xl border-t border-border bg-card p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:mx-auto sm:max-w-md sm:rounded-3xl sm:border sm:bottom-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-destructive">What is happening?</h3>
              <p className="mt-1 text-sm text-muted-foreground">Select an option or wait 3s to auto-send.</p>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { label: "Fire", icon: Flame },
                { label: "Road Accident", icon: Car },
                { label: "Medical", icon: Cross },
                { label: "Flood", icon: Waves },
                { label: "Crime", icon: ShieldAlert },
                { label: "Other", icon: HelpCircle },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (autoSendTimer.current) clearTimeout(autoSendTimer.current)
                      sendReport(item.label)
                    }}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/50 bg-secondary/30 p-4 transition-colors hover:bg-secondary/60"
                  >
                    <Icon className="size-6 text-foreground" />
                    <span className="font-medium text-foreground">{item.label}</span>
                  </button>
                )
              })}
            </div>
            
            {/* Auto send progress bar indicator */}
            <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
                className="h-full bg-destructive"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Backdrop */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </>
  )
}
