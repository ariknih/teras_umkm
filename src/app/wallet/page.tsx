'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { getWalletDetails, withdrawFunds } from '@/app/actions/wallet-affiliate'
import { getCurrentUserProfile, logout } from '@/app/actions/auth'
import { goeyToast } from 'goey-toast'

interface Transaction {
  id: string
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'COMMISSION' | 'SALE'
  amount: number
  description: string
  createdAt: string | Date
}

interface Wallet {
  id: string
  balance: number
  transactions: Transaction[]
}

export default function WalletPage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Deposit State
  const [depositAmount, setDepositAmount] = useState<string>('')
  const [isDepositLoading, setIsDepositLoading] = useState(false)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [withdrawMethod, setWithdrawMethod] = useState<string>('BCA')
  const [accountNumber, setAccountNumber] = useState<string>('')
  const [accountName, setAccountName] = useState<string>('')

  // Manual verify simulation state
  const [manualOrderId, setManualOrderId] = useState<string>('')
  const [isVerifying, setIsVerifying] = useState(false)

  async function loadData() {
    try {
      const profile = await getCurrentUserProfile()
      if (profile) {
        setUserProfile(profile)
        const w = await getWalletDetails()
        setWallet(w as any)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount < 10000) {
      setError('Minimal pengisian saldo adalah Rp 10.000')
      return
    }

    setIsDepositLoading(true)
    try {
      const res = await fetch('/api/midtrans/snap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'deposit', amount }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setIsDepositLoading(false)
        throw new Error(data.error || 'Gagal memproses pembayaran.')
      }

      setPendingOrderId(data.orderId)
      
      const snap = (window as any).snap
      if (snap) {
        snap.pay(data.token, {
          onSuccess: async (result: any) => {
            setSuccess('Pembayaran berhasil! Memverifikasi...')
            await verifyTransaction(result.order_id || data.orderId)
            setIsDepositLoading(false)
          },
          onPending: (result: any) => {
            setPendingOrderId(result.order_id || data.orderId)
            setSuccess('Menunggu pembayaran diselesaikan. Silakan selesaikan pembayaran Anda.')
            setIsDepositLoading(false)
          },
          onError: (result: any) => {
            setError('Terjadi kesalahan pada pembayaran Midtrans.')
            setIsDepositLoading(false)
          },
          onClose: () => {
            setSuccess(`Pembayaran belum selesai. Silakan selesaikan pembayaran atau coba lagi.`)
            setIsDepositLoading(false)
          }
        })
      } else {
        setSuccess(`Pembayaran sedang diproses. Jika sudah membayar, silakan tunggu beberapa saat.`)
        setIsDepositLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung dengan Midtrans.')
      setIsDepositLoading(false)
    }
  }

  const verifyTransaction = async (orderId: string, simulate: boolean = false) => {
    setIsVerifying(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/midtrans/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, simulate, amount: depositAmount }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal memverifikasi transaksi.')
      }

      if (data.processed) {
        setSuccess(data.message || 'Transaksi berhasil diverifikasi!')
        setDepositAmount('')
        setPendingOrderId(null)
        setManualOrderId('')
        await loadData()
        router.refresh()
      } else {
        setError(data.message || 'Transaksi belum dibayar atau status pending.')
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi status pembayaran.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Auto verify deposit when redirected back from Midtrans payment page
  useEffect(() => {
    if (typeof window !== 'undefined' && userProfile) {
      const params = new URLSearchParams(window.location.search)
      const orderId = params.get('order_id')
      const status = params.get('transaction_status')
      
      if (orderId && (orderId.startsWith('dep-') || orderId.startsWith('deposit-'))) {
        if (status === 'settlement' || status === 'capture') {
          verifyTransaction(orderId, false)
          const newUrl = window.location.pathname
          window.history.replaceState({}, document.title, newUrl)
        } else if (status === 'pending') {
          setSuccess('Menunggu pembayaran diselesaikan. Selesaikan pembayaran atau gunakan panel di bawah.')
          setPendingOrderId(orderId)
          const newUrl = window.location.pathname
          window.history.replaceState({}, document.title, newUrl)
        } else if (status === 'deny' || status === 'expire' || status === 'cancel') {
          setError('Pembayaran deposit gagal atau dibatalkan.')
          const newUrl = window.location.pathname
          window.history.replaceState({}, document.title, newUrl)
        }
      }
    }
  }, [userProfile])

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Masukkan jumlah penarikan yang valid')
      return
    }

    if (!accountNumber || !accountName) {
      setError('Mohon lengkapi informasi rekening tujuan')
      return
    }

    if (wallet && amount > wallet.balance) {
      setError('Saldo tidak mencukupi untuk melakukan penarikan')
      return
    }

    startTransition(async () => {
      const res = await withdrawFunds(amount, withdrawMethod, accountNumber, accountName)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(`Penarikan dana sebesar Rp ${amount.toLocaleString('id-ID')} ke ${withdrawMethod} berhasil diaudit & ditransfer.`)
        setWithdrawAmount('')
        setAccountNumber('')
        setAccountName('')
        await loadData()
        router.refresh()
      }
    })
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#F5F7F9] pt-12 pb-24 px-6 md:px-10 animate-pulse">
        <div className="relative z-10 max-w-[1200px] mx-auto">
          {/* Header Summary Skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-6 border-b border-slate-200">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
              <div className="h-4 w-96 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="flex gap-4">
              <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
              <div className="h-6 w-16 bg-slate-200 rounded-md"></div>
            </div>
          </div>

          {/* Level Progress Skeleton */}
          <div className="mb-10 border border-slate-100 bg-white p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-200"></div>
              <div className="space-y-1.5">
                <div className="h-3 w-28 bg-slate-200 rounded"></div>
                <div className="h-5 w-44 bg-slate-200 rounded"></div>
                <div className="h-3.5 w-64 bg-slate-200 rounded"></div>
              </div>
            </div>
            <div className="w-full md:w-72 space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-200 rounded"></div>
                <div className="h-3 w-20 bg-slate-200 rounded"></div>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full"></div>
            </div>
          </div>

          {/* Panels Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 h-36 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-32 bg-slate-200 rounded"></div>
                  <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
                </div>
                <div className="h-3.5 w-40 bg-slate-200 rounded"></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
                <div className="h-3 w-32 bg-slate-200 rounded"></div>
                <div className="h-3.5 w-full bg-slate-200 rounded"></div>
                <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
                <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 space-y-6">
              <div className="h-3 w-48 bg-slate-200 rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-10 bg-slate-200 rounded-lg"></div>
                <div className="h-10 bg-slate-200 rounded-lg"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-10 bg-slate-200 rounded-lg"></div>
                <div className="h-10 bg-slate-200 rounded-lg"></div>
              </div>
              <div className="h-10 bg-slate-200 rounded-lg"></div>
            </div>
          </div>

          {/* Table History Skeleton */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
            <div className="h-4 w-40 bg-slate-200 rounded"></div>
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="h-6 w-full bg-slate-200 rounded"></div>
              <div className="h-6 w-full bg-slate-200 rounded"></div>
              <div className="h-6 w-full bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-surface py-12 px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.06)_0%,transparent_65%)] pointer-events-none z-0" />
        <div className="relative z-10 w-full max-w-md text-center border border-border-subtle bg-surface shadow-[var(--shadow-md)] p-8 rounded-[var(--radius-brand)]">
          <div className="btn-primary w-16 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-2.25 13.5h13.5c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H4.25c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <h2 className="font-sora text-2xl font-bold text-foreground mb-3">Akses Dibatasi</h2>
          <p className="text-xs text-foreground/70 leading-relaxed mb-8">
            Silakan masuk dengan akun Anda untuk melihat dompet digital, buku kas masuk, dan melakukan penarikan saldo.
          </p>
          <Link
            id="wallet-login-btn"
            href="/auth"
            className="btn-primary w-full text-xs inline-block"
          >
            Masuk Sekarang
          </Link>
        </div>
      </div>
    )
  }

  // Level computation details
  const currentLevel = userProfile.level || 1
  const currentXp = userProfile.xp || 0
  const xpInCurrentLevel = currentXp % 100
  const nextLevelXp = 100

  return (
    <div className="relative min-h-screen bg-[#F5F7F9] pt-12 pb-24 px-6 md:px-10">
      <div className="relative z-10 max-w-[1200px] mx-auto">
        {/* Header summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-6 border-b border-[#E5E7EB]">
          <div>
            <h1 className="text-3xl font-bold text-[#0F5132] mb-1">
              Buku Ledger <span className="text-[#2DB24A]">Keuangan.</span>
            </h1>
            <p className="text-xs text-text-secondary">
              Kelola saldo, deposit payment gateway, dan tarik dana ke berbagai bank & e-wallet.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <span className="btn-primary bg-primary/10 border border-primary/25 text-[10px] text-primary">
              {userProfile.name} ({userProfile.role})
            </span>
            <button
              id="wallet-logout"
              onClick={handleLogout}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-red-600 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Level Progression Banner */}
        <div className="mb-10 border border-[#2DB24A]/20 bg-[#EAF5ED]/50 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#EAF5ED] border-2 border-[#2DB24A] flex items-center justify-center text-[#0F5132] font-bold text-xl">
              {currentLevel}
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#0F5132] uppercase tracking-wider">Sistem Level Keanggotaan</span>
              <h3 className="text-sm font-bold text-[#111111]">
                Level Wirausaha {currentLevel}
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Dapatkan XP dengan menjual produk, checkout order, dan melengkapi profil Anda.
              </p>
            </div>
          </div>
          <div className="w-full md:w-72">
            <div className="flex justify-between text-[10px] font-semibold text-[#6B7280] mb-1">
              <span>Progress XP</span>
              <span className="text-[#2DB24A]">{xpInCurrentLevel} / {nextLevelXp} XP</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
              <div 
                className="h-full bg-[#2DB24A] rounded-full transition-all duration-500" 
                style={{ width: `${(xpInCurrentLevel / nextLevelXp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* System alerts */}
        {error && (
          <div className="mb-8 p-4 rounded bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-8 p-4 rounded bg-green-50 border border-green-200 text-xs text-green-700 font-medium">
            ✓ {success}
          </div>
        )}

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-start">
          {/* Left Column: Balance & Deposit */}
          <div className="lg:col-span-4 space-y-8">
            {/* Balance Board */}
            <div className="border border-[#E5E7EB] bg-white p-6 rounded-2xl flex flex-col justify-between min-h-[160px] relative overflow-hidden">
              <div>
                <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-4">
                  Total Saldo Tersedia
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#2DB24A]">
                  Rp {(wallet?.balance ?? 0).toLocaleString('id-ID')}
                </h2>
              </div>
              <div className="flex gap-2 items-center text-[10px] text-[#6B7280] font-semibold pt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Ledger Kas Sinkron Otomatis
              </div>
            </div>

            {/* Deposit Box */}
            <div className="border border-[#E5E7EB] bg-white p-6 rounded-2xl">
              <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-4">
                Top Up / Isi Saldo
              </span>
              <p className="text-[11px] text-[#6B7280] mb-4 leading-relaxed">
                Isi saldo instan menggunakan Midtrans Payment Gateway (Virtual Account, E-Wallet, Kartu Kredit).
              </p>
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                    Jumlah Pengisian (Rp)
                  </label>
                  <input
                    type="number"
                    min="10000"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Minimal Rp 10.000"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-xs text-[#111111] placeholder:text-[#6B7280]/40 focus:outline-none focus:border-[#2DB24A]/50 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isDepositLoading}
                  className="w-full h-11 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isDepositLoading ? 'Menghubungkan Midtrans...' : 'Isi Saldo Sekarang'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Withdrawal */}
          <div className="lg:col-span-8 space-y-8">
            {/* Withdrawal Box */}
            <div className="border border-[#E5E7EB] bg-white p-6 rounded-2xl">
              <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-4">
                Tarik Saldo ke Rekening Bank / E-Wallet
              </span>
              
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                      Metode Penarikan
                    </label>
                    <select
                      value={withdrawMethod}
                      onChange={(e) => setWithdrawMethod(e.target.value)}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-xs text-[#111111] focus:outline-none focus:border-[#2DB24A]/50 cursor-pointer"
                    >
                      <optgroup label="Bank Transfer">
                        <option value="BCA">BCA (Bank Central Asia)</option>
                        <option value="MANDIRI">Mandiri</option>
                        <option value="BNI">BNI (Bank Negara Indonesia)</option>
                        <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                      </optgroup>
                      <optgroup label="E-Wallet">
                        <option value="GOPAY">GoPay</option>
                        <option value="OVO">OVO</option>
                        <option value="DANA">DANA</option>
                        <option value="LINKAJA">LinkAja</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                      Jumlah Penarikan (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="100000"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-xs text-[#111111] placeholder:text-[#6B7280]/40 focus:outline-none focus:border-[#2DB24A]/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                      Nomor Rekening / No. HP E-Wallet
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Masukkan nomor tujuan transfer"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-xs text-[#111111] placeholder:text-[#6B7280]/40 focus:outline-none focus:border-[#2DB24A]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                      Nama Pemilik Rekening
                    </label>
                    <input
                      type="text"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Nama lengkap pemilik"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-xs text-[#111111] placeholder:text-[#6B7280]/40 focus:outline-none focus:border-[#2DB24A]/50 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? 'Mengaudit Transaksi...' : 'Tarik Saldo Rekening'}
                </button>
              </form>
              <p className="text-[10px] text-text-secondary mt-3">
                * Penarikan saldo diproses secara instan tanpa biaya admin transfer (Rp 0).
              </p>
            </div>
          </div>
        </div>

        {/* MIDTRANS TRANSACTION SIMULATION PANEL */}
        {process.env.NODE_ENV !== 'production' && (pendingOrderId || manualOrderId || pendingOrderId === null) && (
          <div className="border border-amber-200 bg-amber-50 p-6 rounded-2xl mb-12">
            <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2">
              🛠️ Panel Simulasi & Verifikasi Midtrans Sandbox / Offline
            </span>
            <p className="text-xs text-amber-700 mb-4 leading-relaxed">
              Karena server development lokal tidak bisa menerima webhook langsung dari Midtrans, Anda dapat menggunakan formulir di bawah untuk memverifikasi transaksi secara manual. Anda juga dapat memilih <strong>Simulasikan Berhasil</strong> untuk memverifikasi transaksi tanpa bayar kartu kredit (offline testing).
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={manualOrderId || pendingOrderId || ''}
                onChange={(e) => setManualOrderId(e.target.value)}
                placeholder="Masukkan Order ID (dep-user-...)"
                className="flex-grow h-11 px-4 bg-white border border-slate-200 rounded text-xs text-[#111111] focus:outline-none focus:border-[#2DB24A]/50"
              />
              <button
                type="button"
                disabled={isVerifying || (!manualOrderId && !pendingOrderId)}
                onClick={() => verifyTransaction(manualOrderId || pendingOrderId || '', false)}
                className="h-11 px-5 bg-white hover:bg-slate-50 border border-slate-200 text-[#111111] font-bold text-xs uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Cek Status API
              </button>
              <button
                type="button"
                disabled={isVerifying || (!manualOrderId && !pendingOrderId)}
                onClick={() => verifyTransaction(manualOrderId || pendingOrderId || '', true)}
                className="h-11 px-5 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Simulasikan Berhasil (Lulus Instan)
              </button>
            </div>
          </div>
        )}

        {/* Transaction History Table */}
        <div className="border border-[#E5E7EB] bg-white rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E5E7EB] bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#111111]">
              Log Histori Transaksi
            </h3>
            <span className="text-[10px] text-text-secondary">
              Total: {wallet?.transactions?.length ?? 0} Transaksi
            </span>
          </div>

          <div className="overflow-x-auto">
            {!wallet?.transactions || wallet.transactions.length === 0 ? (
              <div className="text-center py-16 text-xs text-text-secondary">
                Belum ada transaksi tercatat di akun Anda.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-text-secondary bg-slate-50">
                    <th className="p-4 font-bold uppercase tracking-wider">Tanggal & Waktu</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Tipe</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Deskripsi Transaksi</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {wallet.transactions.map((tx) => {
                    const isDebit = ['WITHDRAWAL', 'PURCHASE'].includes(tx.type)
                    const date = new Date(tx.createdAt)

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-text-secondary">
                          {date.toLocaleDateString('id-ID')}{' '}
                          <span className="opacity-50 text-[10px]">
                            {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                            tx.type === 'COMMISSION'
                              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                              : tx.type === 'WITHDRAWAL'
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : tx.type === 'SALE'
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'bg-green-50 border-green-200 text-green-700'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-4 text-[#111111] font-medium">{tx.description}</td>
                        <td className={`p-4 text-right font-bold text-sm ${isDebit ? 'text-red-600' : 'text-[#2DB24A]'}`}>
                          {isDebit ? '-' : '+'} Rp {tx.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      {/* Load Midtrans Snap dynamically */}
      <Script
        src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true' 
          ? "https://app.midtrans.com/snap/snap.js" 
          : "https://app.sandbox.midtrans.com/snap/snap.js"
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-sFQP1v53tr2M3CQd'}
        strategy="lazyOnload"
      />
    </div>
  )
}
