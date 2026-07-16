'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useMutation } from 'convex/react'
// @ts-ignore
import { api } from '@/convex/_generated/api'

type QueuedIncident = {
  id: string;
  payload: any;
  timestamp: number;
}

interface OfflineQueueContextType {
  isOffline: boolean;
  enqueueReport: (payload: any) => Promise<void>;
}

const OfflineQueueContext = createContext<OfflineQueueContextType>({
  isOffline: false,
  enqueueReport: async () => {},
})

export const useOfflineQueue = () => useContext(OfflineQueueContext)

export function OfflineQueueProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false)
  // @ts-ignore
  const reportIncident = useMutation(api.incidents.reportIncident)

  useEffect(() => {
    // Check initial status
    setIsOffline(!navigator.onLine)

    const handleOnline = () => {
      setIsOffline(false)
      processQueue()
    }
    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Attempt to process queue on mount in case we came back online while app was closed
    if (navigator.onLine) {
      processQueue()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const processQueue = async () => {
    const queueStr = localStorage.getItem('crisiseye_incident_queue')
    if (!queueStr) return

    try {
      const queue: QueuedIncident[] = JSON.parse(queueStr)
      if (queue.length === 0) return

      console.log(`Processing ${queue.length} offline queued incidents...`)
      
      const newQueue: QueuedIncident[] = []
      
      for (const item of queue) {
        try {
          await reportIncident(item.payload)
          console.log(`Successfully dispatched queued incident: ${item.id}`)
          // Toast could be added here
        } catch (e) {
          console.error(`Failed to dispatch queued incident ${item.id}`, e)
          // If it fails, keep it in the queue for next time
          newQueue.push(item)
        }
      }

      localStorage.setItem('crisiseye_incident_queue', JSON.stringify(newQueue))
      
      if (queue.length > 0 && newQueue.length === 0) {
        alert("Emergency report successfully delivered.")
      }

    } catch (e) {
      console.error("Failed to parse incident queue from local storage", e)
    }
  }

  const enqueueReport = async (payload: any) => {
    if (!isOffline) {
      try {
        await reportIncident(payload)
        if (payload.type !== "Unknown Emergency") {
          alert(`SOS Dispatched: ${payload.type}`)
        }
        return
      } catch (e) {
        console.warn("Failed to dispatch report online. Queuing as fallback...", e)
      }
    }

    // Add to local storage queue
    const queueStr = localStorage.getItem('crisiseye_incident_queue')
    let queue: QueuedIncident[] = []
    if (queueStr) {
      try {
        queue = JSON.parse(queueStr)
      } catch (e) {}
    }

    queue.push({
      id: Math.random().toString(36).substring(7),
      payload,
      timestamp: Date.now()
    })

    localStorage.setItem('crisiseye_incident_queue', JSON.stringify(queue))
    alert("Emergency report queued. It will be sent automatically once a connection is available.")
  }

  return (
    <OfflineQueueContext.Provider value={{ isOffline, enqueueReport }}>
      {children}
    </OfflineQueueContext.Provider>
  )
}
