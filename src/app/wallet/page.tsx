'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getWalletDetails, withdrawFunds } from '../actions/wallet-affiliate'
import { getCurrentUserProfile, logout } from '../actions/auth'

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
        throw new Error(data.error || 'Gagal memproses pembayaran.')
      }

      setPendingOrderId(data.orderId)
      
      const snap = (window as any).snap
      if (snap) {
        snap.pay(data.token, {
          onSuccess: async (result: any) => {
            setSuccess('Pembayaran berhasil! Memverifikasi...')
            await verifyTransaction(result.order_id || data.orderId)
          },
          onPending: (result: any) => {
            setPendingOrderId(result.order_id || data.orderId)
            setSuccess('Menunggu pembayaran diselesaikan. Selesaikan pembayaran atau gunakan verifikasi manual di bawah.')
          },
          onError: (result: any) => {
            setError('Terjadi kesalahan pada pembayaran Midtrans.')
          },
          onClose: () => {
            setSuccess(`Transaksi dibuat: ${data.orderId}. Anda dapat menyelesaikannya atau klik 'Verifikasi Manual'.`)
          }
        })
      } else {
        // Fallback if Snap script failed to load, allow manual verification / simulation
        setSuccess(`Token Midtrans berhasil dibuat: ${data.orderId}. Silakan gunakan panel simulasi di bawah untuk konfirmasi offline.`)
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung dengan Midtrans.')
    } finally {
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
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark">
        <span className="text-xs font-geist font-bold text-primary tracking-widest uppercase animate-pulse">
          Connecting to Ledger...
        </span>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark py-12 px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.06)_0%,transparent_65%)] pointer-events-none z-0" />
        <div className="relative z-10 w-full max-w-md text-center border border-border-subtle bg-surface-dark glow-card p-8 rounded-lg">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-2.25 13.5h13.5c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H4.25c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <h2 className="font-sora text-2xl font-bold text-text-primary mb-3">Akses Dibatasi</h2>
          <p className="text-xs text-text-secondary leading-relaxed mb-8">
            Silakan masuk dengan akun Anda untuk melihat dompet digital, buku kas masuk, dan melakukan penarikan saldo.
          </p>
          <Link
            id="wallet-login-btn"
            href="/auth"
            className="w-full py-4 bg-primary hover:bg-primary-container text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors inline-block"
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
    <div className="relative min-h-screen bg-bg-dark pt-12 pb-24 px-6 md:px-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1200px] mx-auto">
        {/* Header summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-6 border-b border-border-subtle">
          <div>
            <h1 className="font-sora text-3xl font-bold text-text-primary mb-1">
              Buku Ledger <span className="text-primary">Keuangan.</span>
            </h1>
            <p className="text-xs text-text-secondary">
              Kelola saldo, deposit payment gateway, dan tarik dana ke berbagai bank & e-wallet.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <span className="px-3 py-1.5 bg-primary/10 border border-primary/25 rounded text-[10px] font-geist font-bold text-primary uppercase tracking-wider">
              {userProfile.name} ({userProfile.role})
            </span>
            <button
              id="wallet-logout"
              onClick={handleLogout}
              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-red-400 hover:text-red-300 rounded text-[10px] font-geist font-bold uppercase tracking-wider transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Level Progression Banner */}
        <div className="mb-10 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent p-5 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-500 font-sora font-extrabold text-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              {currentLevel}
            </div>
            <div>
              <span className="text-[10px] font-geist font-bold text-amber-500 uppercase tracking-widest">Prestige Level System</span>
              <h3 className="font-sora text-sm font-bold text-text-primary">
                Level Entrepreneur {currentLevel}
              </h3>
              <p className="text-[11px] text-text-secondary">
                Dapatkan XP dengan menjual produk, melakukan checkout order, dan melengkapi profil Anda.
              </p>
            </div>
          </div>
          <div className="w-full md:w-72">
            <div className="flex justify-between text-[10px] font-geist font-semibold text-text-secondary mb-1">
              <span>Progress XP</span>
              <span className="text-amber-500">{xpInCurrentLevel} / {nextLevelXp} XP</span>
            </div>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden border border-border-subtle">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${(xpInCurrentLevel / nextLevelXp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* System alerts */}
        {error && (
          <div className="mb-8 p-4 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-8 p-4 rounded bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-medium">
            ✓ {success}
          </div>
        )}

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-start">
          {/* Left Column: Balance & Deposit */}
          <div className="lg:col-span-4 space-y-8">
            {/* Balance Board */}
            <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg flex flex-col justify-between min-h-[160px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-widest mb-4">
                  Total Saldo Tersedia
                </span>
                <h2 className="font-sora text-3xl md:text-4xl font-extrabold text-primary">
                  Rp {(wallet?.balance ?? 0).toLocaleString('id-ID')}
                </h2>
              </div>
              <div className="flex gap-2 items-center text-[10px] text-text-secondary font-geist font-semibold pt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Ledger Kas Sinkron Otomatis
              </div>
            </div>

            {/* Deposit Box */}
            <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg">
              <span className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-widest mb-4">
                Top Up / Isi Saldo
              </span>
              <p className="text-[11px] text-text-secondary mb-4 leading-relaxed">
                Isi saldo instan menggunakan Midtrans Payment Gateway (Virtual Account, E-Wallet, Kartu Kredit).
              </p>
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">
                    Jumlah Pengisian (Rp)
                  </label>
                  <input
                    type="number"
                    min="10000"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Minimal Rp 10.000"
                    className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isDepositLoading}
                  className="w-full h-11 bg-primary hover:bg-primary-container text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-lg disabled:opacity-50"
                >
                  {isDepositLoading ? 'Menghubungkan Midtrans...' : 'Isi Saldo Sekarang'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Withdrawal */}
          <div className="lg:col-span-8 space-y-8">
            {/* Withdrawal Box */}
            <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg">
              <span className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-widest mb-4">
                Tarik Saldo ke Rekening Bank / E-Wallet
              </span>
              
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">
                      Metode Penarikan
                    </label>
                    <select
                      value={withdrawMethod}
                      onChange={(e) => setWithdrawMethod(e.target.value)}
                      className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-primary/50 cursor-pointer"
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
                    <label className="block text-[9px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">
                      Jumlah Penarikan (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Contoh: 100000"
                      className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">
                      Nomor Rekening / No. HP E-Wallet
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Masukkan nomor tujuan transfer"
                      className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">
                      Nama Pemilik Rekening
                    </label>
                    <input
                      type="text"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Nama lengkap pemilik"
                      className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 bg-primary hover:bg-primary-container text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-lg disabled:opacity-50"
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
        {(pendingOrderId || manualOrderId || pendingOrderId === null) && (
          <div className="border border-yellow-500/20 bg-yellow-500/5 p-6 rounded-lg mb-12">
            <span className="block text-[10px] font-geist font-bold text-yellow-500 uppercase tracking-widest mb-2">
              🛠️ Panel Simulasi & Verifikasi Midtrans Sandbox / Offline
            </span>
            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              Karena server development lokal tidak bisa menerima webhook langsung dari Midtrans, Anda dapat menggunakan formulir di bawah untuk memverifikasi transaksi secara manual. Anda juga dapat memilih <strong>Simulasikan Berhasil</strong> untuk memverifikasi transaksi tanpa bayar kartu kredit (offline testing).
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={manualOrderId || pendingOrderId || ''}
                onChange={(e) => setManualOrderId(e.target.value)}
                placeholder="Masukkan Order ID (contoh: dep-user-...)"
                className="flex-grow h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-primary/50"
              />
              <button
                type="button"
                disabled={isVerifying || (!manualOrderId && !pendingOrderId)}
                onClick={() => verifyTransaction(manualOrderId || pendingOrderId || '', false)}
                className="h-11 px-5 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-primary font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors"
              >
                Cek Status API
              </button>
              <button
                type="button"
                disabled={isVerifying || (!manualOrderId && !pendingOrderId)}
                onClick={() => verifyTransaction(manualOrderId || pendingOrderId || '', true)}
                className="h-11 px-5 bg-yellow-600 hover:bg-yellow-500 text-black font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors"
              >
                Simulasikan Berhasil (Lulus Instan)
              </button>
            </div>
          </div>
        )}

        {/* Transaction History Table */}
        <div className="border border-border-subtle bg-surface-dark rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-border-subtle bg-surface-container/50 flex justify-between items-center">
            <h3 className="font-sora text-sm font-bold text-text-primary">
              Log Histori Transaksi
            </h3>
            <span className="text-[10px] text-text-secondary font-mono">
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
                  <tr className="border-b border-border-subtle text-text-secondary bg-surface-container/20">
                    <th className="p-4 font-geist font-bold uppercase tracking-wider">Tanggal & Waktu</th>
                    <th className="p-4 font-geist font-bold uppercase tracking-wider">Tipe</th>
                    <th className="p-4 font-geist font-bold uppercase tracking-wider">Deskripsi Transaksi</th>
                    <th className="p-4 font-geist font-bold uppercase tracking-wider text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {wallet.transactions.map((tx) => {
                    const isDebit = ['WITHDRAWAL', 'PURCHASE'].includes(tx.type)
                    const date = new Date(tx.createdAt)

                    return (
                      <tr key={tx.id} className="hover:bg-surface-container/10 transition-colors">
                        <td className="p-4 text-text-secondary font-geist">
                          {date.toLocaleDateString('id-ID')}{' '}
                          <span className="opacity-50 text-[10px]">
                            {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-geist font-bold border uppercase tracking-wider ${
                            tx.type === 'COMMISSION'
                              ? 'bg-yellow-950 border-yellow-500/30 text-yellow-400'
                              : tx.type === 'WITHDRAWAL'
                              ? 'bg-red-950 border-red-500/30 text-red-400'
                              : tx.type === 'SALE'
                              ? 'bg-blue-950 border-blue-500/30 text-blue-400'
                              : 'bg-green-950 border-green-500/30 text-green-400'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-4 text-text-primary font-medium">{tx.description}</td>
                        <td className={`p-4 text-right font-geist font-bold text-sm ${isDebit ? 'text-red-400' : 'text-primary'}`}>
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
