'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthForm } from '@/components/AuthForm'

function AuthContent() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login'

  return (
    <div className="w-full max-w-[420px] z-10 mx-auto bg-white rounded-3xl p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
      <AuthForm defaultTab={defaultTab} />
    </div>
  )
}

export default function AuthPage() {
  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center py-16 px-4 md:px-10 overflow-hidden bg-bg-dark">
      {/* Background Mesh Glow / Ornaments */}
      <div className="absolute top-[-10%] right-[-5%] w-96 bg-primary-container/10 blur-[100px] pointer-events-none h-96 rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-tertiary-container/10 rounded-full blur-[80px] pointer-events-none"></div>

      <Suspense fallback={<div className="animate-pulse bg-white/10 w-[420px] max-w-full h-[500px] rounded-3xl" />}>
        <AuthContent />
      </Suspense>
    </div>
  )
}
