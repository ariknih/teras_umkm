'use client'

import React, { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if dismissed previously in session
    if (sessionStorage.getItem('saloka_pwa_dismissed') === 'true') {
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    setShowPrompt(false)
    sessionStorage.setItem('saloka_pwa_dismissed', 'true')
  }

  if (!showPrompt || isDismissed) return null

  return (
    <aside
      aria-label="Install Aplikasi Saloka.id"
      className="fixed bottom-16 md:bottom-6 right-4 left-4 md:left-auto md:max-w-sm z-50 bg-white border border-[#C8E6C9] rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#006E24] flex items-center justify-center font-extrabold text-base shrink-0 border border-[#C8E6C9]">
          S
        </div>
        <div>
          <h4 className="text-xs font-extrabold text-slate-900 leading-tight">Install Saloka.id</h4>
          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Akses marketplace lebih cepat & hemat kuota</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-[#006E24] hover:bg-[#084e1b] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
        >
          <Download size={13} strokeWidth={2.5} />
          <span>Install</span>
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          title="Tutup"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  )
}
