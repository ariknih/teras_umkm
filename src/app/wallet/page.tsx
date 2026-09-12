'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

const QUICK_NOMINALS = [10000, 25000, 50000, 100000, 250000, 500000]

export default function WalletPage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Deposit State - Quick Nominals only (no manual textbox)
  const [selectedNominal, setSelectedNominal] = useState<number>(50000)
  const [isDepositLoading, setIsDepositLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [withdrawMethod, setWithdrawMethod] = useState<string>('BCA')
  const [accountNumber, setAccountNumber] = useState<string>('')
  const [accountName, setAccountName] = useState<string>('')

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

  // Auto-verify payment callback on return
  useEffect(() => {
    if (typeof window === 'undefined') return
    const urlParams = new URLSearchParams(window.location.search)
    const dokuVerifyId = urlParams.get('doku_verify')
    if (dokuVerifyId) {
      setIsVerifying(true)
      fetch('/api/doku/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: dokuVerifyId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setSuccess('Top-up saldo berhasil diverifikasi! Saldo telah masuk ke akun Anda.')
            loadData()
          } else {
            setError(
              data.message ||
                data.error ||
                'Pembayaran belum diselesaikan atau sedang diproses oleh bank/merchant. Saldo belum masuk.'
            )
          }
        })
        .catch(() => setError('Gagal menghubungi server verifikasi pembayaran.'))
        .finally(() => {
          setIsVerifying(false)
          // Clean query parameters from URL so refresh won't re-trigger
          const cleanUrl = window.location.pathname
          window.history.replaceState({}, document.title, cleanUrl)
        })
    }
  }, [])

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedNominal || selectedNominal < 10000) {
      setError('Pilih salah satu nominal pengisian saldo minimal Rp 10.000')
      return
    }

    setIsDepositLoading(true)

    try {
      const res = await fetch('/api/doku/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'deposit', amount: selectedNominal }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setIsDepositLoading(false)
        throw new Error(data.error || 'Gagal menyiapkan sesi pembayaran.')
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        setIsDepositLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung dengan gateway pembayaran.')
      setIsDepositLoading(false)
    }
  }

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
              Buku Ledger <span className="text-primary">Keuangan.</span>
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
        <div className="mb-10 border border-primary/20 bg-[#EAF5ED]/50 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#EAF5ED] border-2 border-primary flex items-center justify-center text-[#0F5132] font-bold text-xl">
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
              <span className="text-primary">{xpInCurrentLevel} / {nextLevelXp} XP</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500" 
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
                <h2 className="text-3xl md:text-4xl font-extrabold text-primary">
                  Rp {(wallet?.balance ?? 0).toLocaleString('id-ID')}
                </h2>
              </div>
              <div className="flex gap-2 items-center text-[10px] text-[#6B7280] font-semibold pt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Ledger Kas Sinkron Otomatis
              </div>
            </div>

            {/* Deposit Box */}
            <div className="border border-[#E5E7EB] bg-white p-6 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Top Up / Isi Saldo
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Instan & Otomatis
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] mb-4 leading-relaxed">
                Pilih nominal isi saldo di bawah ini. Pembayaran diproses secara instan dan otomatis masuk ke saldo Anda.
              </p>

              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
                    Pilih Nominal Saldo
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {QUICK_NOMINALS.map((nom) => {
                      const isSelected = selectedNominal === nom
                      return (
                        <button
                          key={nom}
                          type="button"
                          onClick={() => setSelectedNominal(nom)}
                          className={`py-3 px-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-[#0F5132] font-bold shadow-xs ring-2 ring-primary/30'
                              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-semibold'
                          }`}
                        >
                          <span className="text-[10px] opacity-75">Isi Saldo</span>
                          <span className="text-xs font-bold mt-0.5 text-[#111111]">
                            Rp {nom.toLocaleString('id-ID')}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Total Pembayaran:</span>
                  <span className="font-extrabold text-[#0F5132] text-sm">
                    Rp {selectedNominal.toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isDepositLoading}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDepositLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyiapkan Pembayaran...
                    </>
                  ) : (
                    <>Isi Saldo Rp {selectedNominal.toLocaleString('id-ID')}</>
                  )}
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
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-xs text-[#111111] focus:outline-none focus:border-primary/50 cursor-pointer"
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
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-xs text-[#111111] placeholder:text-[#6B7280]/40 focus:outline-none focus:border-primary/50 transition-colors"
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
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-xs text-[#111111] placeholder:text-[#6B7280]/40 focus:outline-none focus:border-primary/50 transition-colors"
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
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded text-xs text-[#111111] placeholder:text-[#6B7280]/40 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
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
                        <td className={`p-4 text-right font-bold text-sm ${isDebit ? 'text-red-600' : 'text-primary'}`}>
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
    </div>
  )
}
