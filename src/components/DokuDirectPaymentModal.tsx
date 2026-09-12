'use client'

import React, { useState, useEffect, useId } from 'react'
import {
  X,
  Copy,
  Check,
  Clock,
  QrCode,
  Building2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { goeyToast } from 'goey-toast'

export interface DokuDirectPaymentData {
  orderId: string
  paymentChannel: string
  amount: number
  qrString?: string
  bank?: string
  bankName?: string
  vaNumber?: string
  expiredAt?: string
  howToPayUrl?: string
  instructions?: Array<{
    title: string
    steps: string[]
  }>
  isProduction?: boolean
  checkoutPayload?: any
}

interface DokuDirectPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  data: DokuDirectPaymentData | null
  onSuccess?: (orderId: string, result?: any) => void
}

export default function DokuDirectPaymentModal({
  isOpen,
  onClose,
  data,
  onSuccess,
}: DokuDirectPaymentModalProps) {
  const [copiedVa, setCopiedVa] = useState(false)
  const [copiedAmount, setCopiedAmount] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60) // default 15 mins
  const [isSimulating, setIsSimulating] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0)
  const [pollError, setPollError] = useState<string | null>(null)

  const isQris = data?.paymentChannel === 'QRIS'
  const isVa = data?.paymentChannel?.startsWith('VA_')
  const isProduction = Boolean(data?.isProduction) && process.env.NEXT_PUBLIC_DOKU_IS_PRODUCTION === 'true'
  const isSandbox = !isProduction

  // Generate QR Code image if QRIS
  useEffect(() => {
    if (!isOpen || !data?.qrString) {
      setQrDataUrl(null)
      return
    }

    let isMounted = true
    const generateQr = async () => {
      try {
        const QRCode = (await import('qrcode')).default
        const url = await QRCode.toDataURL(data.qrString!, {
          width: 280,
          margin: 1,
          color: {
            dark: '#0F172A',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        })
        if (isMounted) setQrDataUrl(url)
      } catch (err) {
        console.error('Failed to render QR Code:', err)
      }
    }

    generateQr()
    return () => {
      isMounted = false
    }
  }, [isOpen, data?.qrString])

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !data?.expiredAt) {
      setTimeLeft(15 * 60)
      return
    }

    const expiryTime = new Date(data.expiredAt).getTime()
    const updateCountdown = () => {
      const now = Date.now()
      const diffSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000))
      setTimeLeft(diffSeconds)
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [isOpen, data?.expiredAt])

  // Real-time polling every 3 seconds to check if transaction has completed
  useEffect(() => {
    if (!isOpen || !data?.orderId || isSuccess) return

    let isMounted = true
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/doku/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderId }),
        })

        const result = await res.json()
        if (result.success && result.status === 'SUCCESS' && isMounted) {
          setIsSuccess(true)
          clearInterval(interval)
          setTimeout(() => {
            if (onSuccess) onSuccess(data.orderId, result)
          }, 1500)
        }
      } catch (e: any) {
        // Silently continue polling
      }
    }, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [isOpen, data?.orderId, isSuccess, onSuccess])

  if (!isOpen || !data) return null

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleCopyVa = () => {
    if (!data.vaNumber) return
    navigator.clipboard.writeText(data.vaNumber)
    setCopiedVa(true)
    setTimeout(() => setCopiedVa(false), 2000)
  }

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(Math.round(data.amount).toString())
    setCopiedAmount(true)
    setTimeout(() => setCopiedAmount(false), 2000)
  }

  // Instant simulation for Sandbox Demo (this afternoon)
  const handleSimulatePayment = async () => {
    if (isSimulating || isSuccess) return
    setIsSimulating(true)
    setPollError(null)

    try {
      const res = await fetch('/api/doku/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderId,
          simulate: true,
          amount: data.amount,
          checkoutPayload: (data as any)?.checkoutPayload,
        }),
      })

      const result = await res.json()
      if (result.success && result.status === 'SUCCESS') {
        setIsSuccess(true)
        setTimeout(() => {
          if (onSuccess) onSuccess(data.orderId, result)
        }, 1200)
      } else {
        throw new Error(result.error || result.message || 'Gagal memproses simulasi.')
      }
    } catch (err: any) {
      const msg = err.message || 'Gagal menjalankan simulasi demo.'
      setPollError(msg)
      goeyToast.error(msg)
      setIsSimulating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2DB24A]/10 flex items-center justify-center text-[#2DB24A]">
              {isQris ? <QrCode className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isQris ? 'Pembayaran QRIS' : `Virtual Account ${data.bank || 'Bank'}`}
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">ID: {data.orderId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo / Sandbox Banner (Always accessible for presentation and testing) */}
        <div className="bg-amber-500/10 border-b border-amber-200/80 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-start gap-2 text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs text-amber-950 block">Mode Uji Coba & Demo</span>
              <p className="text-[11px] text-amber-800 leading-snug">
                Barcode QRIS dummy sandbox. Scan bank asli tidak berlaku. Klik tombol di samping untuk langsung melunasi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={isSimulating || isSuccess}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <span>⚡ Simulasi Bayar Berhasil</span>
              </>
            )}
          </button>
        </div>

        {/* Error alert banner */}
        {pollError && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 text-xs text-rose-700 font-semibold flex items-center justify-between shrink-0 animate-in fade-in">
            <span>{pollError}</span>
            <button
              type="button"
              onClick={() => setPollError(null)}
              className="text-rose-400 hover:text-rose-700 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Success Overlay View */}
          {isSuccess ? (
            <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Pembayaran Berhasil!</h3>
                <p className="text-xs text-slate-500">
                  Transaksi Anda telah terverifikasi secara otomatis.
                </p>
              </div>
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-xs text-slate-600 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2DB24A]" />
                  <span>Mengalihkan dalam sekejap...</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Nominal & Countdown Card */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Total Pembayaran</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-900 tracking-tight">
                      Rp {Math.round(data.amount).toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAmount}
                      title="Salin Nominal"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                      {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-medium block">Selesaikan Dalam</span>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimer(timeLeft)}</span>
                  </div>
                </div>
              </div>

              {/* QRIS View */}
              {isQris && (
                <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200/80 rounded-2xl space-y-3">
                  {/* National QRIS Header Badge */}
                  <div className="flex items-center justify-between w-full max-w-[280px] pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black tracking-widest text-slate-900 uppercase">QRIS</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-600 text-white font-bold rounded">
                        STANDAR NASIONAL
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">GPN</span>
                  </div>

                  {/* QR Canvas */}
                  <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center min-h-[260px] min-w-[260px]">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QRIS Saloka"
                        className="w-[250px] h-[250px] object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#2DB24A]" />
                        <span>Menyiapkan barcode QRIS...</span>
                      </div>
                    )}
                  </div>

                  {/* Opsi A: Bypass pembayaran — sandbox/demo saja. Server juga
                      menolak `simulate` di produksi, ini hanya menyembunyikan UI-nya. */}
                  {!isProduction && (
                  <div className="w-full max-w-[320px] p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-center space-y-2.5">
                    <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                      💡 <strong>Bypass Pembayaran (Opsi A):</strong> Barcode QRIS dummy pengujian sandbox. Klik tombol di bawah untuk langsung melunasi transaksi tanpa scan:
                    </p>
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={isSimulating || isSuccess}
                      className="w-full py-2.5 bg-[#2DB24A] hover:bg-[#24943E] active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSimulating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Memproses Verifikasi...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-emerald-200" />
                          <span>⚡ Klik untuk Bypass / Bayar Lunas</span>
                        </>
                      )}
                    </button>
                  </div>
                  )}

                  <p className="text-center text-[11px] text-slate-500 max-w-xs pt-1">
                    Atau scan menggunakan aplikasi m-Banking atau E-Wallet apa saja (GoPay, OVO, Dana, ShopeePay, BCA, Livin, BRImo).
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {['BCA', 'Livin', 'BRImo', 'GoPay', 'ShopeePay', 'Dana', 'OVO'].map((app) => (
                      <span
                        key={app}
                        className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-medium rounded-md"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Virtual Account View */}
              {isVa && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Nomor Virtual Account</span>
                      <span className="text-xs font-bold text-slate-700">{data.bankName || data.bank}</span>
                    </div>
                    <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-lg flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verifikasi Otomatis</span>
                    </div>
                  </div>

                  {/* Big Monospace VA Number */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <span className="text-xl md:text-2xl font-mono font-black tracking-wider text-slate-900 select-all">
                      {data.vaNumber || '-'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyVa}
                      className="px-3 py-1.5 bg-[#2DB24A] hover:bg-[#24943E] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                    >
                      {copiedVa ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <span className="text-amber-900 font-medium text-[11px]">
                      Mode Uji Coba: Tes simulasi transfer VA tanpa perlu potong saldo bank asli.
                    </span>
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={isSimulating || isSuccess}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isSimulating ? 'Memproses...' : '⚡ Simulasi Transfer'}
                    </button>
                  </div>

                  {data.howToPayUrl && (
                    <div className="text-right">
                      <a
                        href={data.howToPayUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#2DB24A] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Buka petunjuk resmi {data.bank}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Step by step Payment Instructions */}
              {data.instructions && data.instructions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-slate-800">Petunjuk Pembayaran</h4>
                  <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                    {data.instructions.map((inst, idx) => {
                      const isExpanded = activeAccordion === idx
                      return (
                        <div key={idx} className="transition-colors">
                          <button
                            type="button"
                            onClick={() => setActiveAccordion(isExpanded ? null : idx)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <span>{inst.title}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-3.5 pt-1 text-xs text-slate-600 bg-slate-50/50">
                              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                                {inst.steps.map((step, sIdx) => (
                                  <li key={sIdx}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Status polling badge footer */}
              <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-500 font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Menunggu pembayaran Anda... Halaman akan otomatis terkonfirmasi.</span>
              </div>

              {pollError && (
                <p className="text-center text-xs text-red-500 font-medium">{pollError}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">Saloka Payment Shield &bull; Aman & Terenkripsi</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isSuccess ? 'Tutup' : 'Tutup Sementara'}
          </button>
        </div>

      </div>
    </div>
  )
}
