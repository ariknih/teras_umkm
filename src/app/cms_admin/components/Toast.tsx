'use client'

import { useState, useCallback } from 'react'

export type ToastMessage = { text: string; type: 'success' | 'error' } | null

/**
 * Local, dismissible toast for a single menu's mutations. Matches the visual
 * language PaymentMethodsTab established (bottom-right, rounded, auto-dismiss
 * after 3s) — shared here since Products, Affiliates and Admins all need it.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastMessage>(null)

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  return { toast, showToast }
}

export function Toast({ toast }: { toast: ToastMessage }) {
  if (!toast) return null
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 transition-all border ${
        toast.type === 'success'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-red-50 text-red-800 border-red-200'
      }`}
    >
      <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
      <span>{toast.text}</span>
    </div>
  )
}
