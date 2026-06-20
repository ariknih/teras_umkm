'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function KycCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'failed'>('loading')

  useEffect(() => {
    // Didit biasanya mengirim status via search param setelah redirect
    const diditStatus = searchParams.get('status') || searchParams.get('result')

    if (diditStatus === 'approved' || diditStatus === 'success') {
      setStatus('success')
    } else if (diditStatus === 'declined' || diditStatus === 'failed') {
      setStatus('failed')
    } else {
      // Status tidak jelas = sedang direview atau masih diproses
      setStatus('pending')
    }

    // Redirect ke settings setelah beberapa detik
    const timer = setTimeout(() => {
      router.push('/settings?tab=kyc')
    }, 5000)
    return () => clearTimeout(timer)
  }, [searchParams, router])

  const config = {
    loading: {
      icon: '⏳',
      title: 'Memproses Verifikasi...',
      desc: 'Harap tunggu sementara kami memeriksa status verifikasi Anda.',
      color: 'text-primary',
      bg: 'bg-primary/10 border-primary/20',
    },
    success: {
      icon: '✅',
      title: 'Verifikasi Berhasil!',
      desc: 'Identitas Anda telah berhasil diverifikasi. Akun Anda kini memiliki badge KYC Terverifikasi.',
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/20',
    },
    pending: {
      icon: '🕐',
      title: 'Sedang Ditinjau',
      desc: 'Verifikasi Anda sedang dalam proses peninjauan. Kami akan memberitahu Anda dalam 1x24 jam.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    failed: {
      icon: '❌',
      title: 'Verifikasi Ditolak',
      desc: 'Sayangnya verifikasi identitas Anda tidak dapat kami konfirmasi. Silakan coba lagi dengan dokumen yang valid.',
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
    },
  }

  const c = config[status]

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className={`w-24 h-24 mx-auto rounded-full border-2 flex items-center justify-center text-4xl ${c.bg}`}>
          {c.icon}
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className={`font-sora text-2xl font-bold ${c.color}`}>{c.title}</h1>
          <p className="text-sm text-text-secondary leading-relaxed">{c.desc}</p>
        </div>

        {/* Progress bar — auto redirect in 5 seconds */}
        <div className="space-y-2">
          <p className="text-[10px] text-text-secondary font-geist">
            Mengalihkan ke halaman profil dalam 5 detik...
          </p>
          <div className="h-1 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full animate-[shrink_5s_linear_forwards]"
              style={{ animation: 'width 5s linear forwards' }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Link
            href="/settings?tab=kyc"
            className="flex-1 btn-primary text-xs"
          >
            Ke Halaman KYC
          </Link>
          <Link
            href="/"
            className="flex-1 py-3.5 bg-surface-container border border-border-subtle text-text-primary font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors hover:bg-surface-container-high"
          >
            Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
