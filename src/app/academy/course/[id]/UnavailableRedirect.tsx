'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const REDIRECT_DELAY_MS = 2500

/** Shown instead of the course when it's been pulled from the market ("Ditarik dari Pasar"). */
export default function UnavailableRedirect() {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => router.push('/academy'), REDIRECT_DELAY_MS)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm space-y-3 bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xs">
        <div className="text-3xl">🚫</div>
        <h1 className="text-base font-bold text-slate-900">Kursus Tidak Tersedia</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Kursus ini sedang tidak tersedia. Anda akan diarahkan kembali ke Saloka Academy…
        </p>
      </div>
    </div>
  )
}
