'use client'

import React, { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export default function ConnectivityStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    // Initial check
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
    }

    const handleOnline = () => {
      setIsOnline(true)
      setShowReconnected(true)
      const timer = setTimeout(() => {
        setShowReconnected(false)
      }, 3500)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && !showReconnected) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300 pointer-events-none"
    >
      {!isOnline ? (
        <div className="bg-rose-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold border border-rose-400">
          <WifiOff size={14} className="animate-pulse" />
          <span>Koneksi internet terputus. Menunggu jaringan...</span>
        </div>
      ) : (
        <div className="bg-[#006E24] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold border border-emerald-400">
          <Wifi size={14} />
          <span>Terhubung kembali ke Saloka.id!</span>
        </div>
      )}
    </div>
  )
}
