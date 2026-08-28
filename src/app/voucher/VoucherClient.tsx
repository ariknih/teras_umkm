'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Ticket, Truck, Sparkles, Coins, Copy, Check, ArrowRight, ShieldCheck, Tag } from 'lucide-react'
import { goeyToast } from 'goey-toast'

interface Voucher {
  id: string
  code: string
  title: string
  description?: string
  discountType?: 'PERCENT' | 'FIXED'
  discountValue?: number
  minPurchase?: number
  coinPrice?: number
  quota?: number
  usedCount?: number
  type?: 'INTERNAL' | 'EXTERNAL'
  category?: string
  expiresAt?: string
}

const DEFAULT_FEATURED_VOUCHERS = [
  {
    id: 'v-saloka',
    code: 'Saloka.id',
    title: 'Diskon Spesial Mitra Saloka',
    description: 'Potongan langsung Rp 20.000 untuk seluruh pembelian produk UMKM pilihan.',
    discountType: 'FIXED' as const,
    discountValue: 20000,
    minPurchase: 50000,
    quota: 100,
    usedCount: 48,
    category: 'BELANJA',
    type: 'INTERNAL' as const,
    expiresAt: '31 Des 2026'
  },
  {
    id: 'v-diskon10',
    code: 'DISKON10',
    title: 'Voucher Diskon Gajian 10%',
    description: 'Hemat 10% untuk seluruh produk kategori Kuliner, Fashion, dan Kerajinan Tangan.',
    discountType: 'PERCENT' as const,
    discountValue: 10,
    minPurchase: 30000,
    quota: 200,
    usedCount: 142,
    category: 'BELANJA',
    type: 'INTERNAL' as const,
    expiresAt: '31 Des 2026'
  },
  {
    id: 'v-ongkir',
    code: 'GRATISONGKIR',
    title: 'Bebas Ongkir Seluruh Indonesia',
    description: 'Potongan ongkos kirim s.d Rp 20.000 menggunakan kurir reguler terdaftar.',
    discountType: 'FIXED' as const,
    discountValue: 20000,
    minPurchase: 40000,
    quota: 150,
    usedCount: 88,
    category: 'ONGKIR',
    type: 'INTERNAL' as const,
    expiresAt: '31 Des 2026'
  }
]

export default function VoucherClient({ initialVouchers = [] }: { initialVouchers?: any[] }) {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'BELANJA' | 'ONGKIR' | 'COIN'>('ALL')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Merge default featured vouchers with dynamic ones
  const allVouchers = [...DEFAULT_FEATURED_VOUCHERS, ...initialVouchers]

  const filteredVouchers = allVouchers.filter((v) => {
    if (activeCategory === 'ALL') return true
    if (activeCategory === 'BELANJA') return v.category === 'BELANJA' || v.type === 'INTERNAL'
    if (activeCategory === 'ONGKIR') return v.category === 'ONGKIR' || v.code.includes('ONGKIR')
    if (activeCategory === 'COIN') return (v.coinPrice && v.coinPrice > 0) || v.type === 'EXTERNAL'
    return true
  })

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    goeyToast.success(`Kode voucher ${code} berhasil disalin!`)
    setTimeout(() => setCopiedCode(null), 3000)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1100px] mx-auto space-y-6">
        
        {/* ── HEADER BANNER ── */}
        <div className="bg-gradient-to-r from-emerald-950 via-primary to-[#0A4D1A] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full uppercase tracking-wider shadow-2xs">
              <Sparkles size={13} className="fill-slate-950" />
              <span>Pusat Promo & Voucher</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Klaim Voucher Belanja & Bebas Ongkir
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-lg leading-relaxed">
              Gunakan kupon promo resmi Saloka.id saat checkout untuk mendapatkan potongan harga langsung dan diskon ongkir.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/wallet/coin"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
            >
              <Coins size={15} className="text-amber-300" />
              <span>Tukar Saldo Koin</span>
            </Link>
            <Link
              href="/market"
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Mulai Belanja</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        {/* ── CATEGORY TABS ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-2 sm:p-3 shadow-xs flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === 'ALL'
                ? 'bg-primary text-white shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Semua Voucher ({allVouchers.length})
          </button>
          <button
            onClick={() => setActiveCategory('BELANJA')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'BELANJA'
                ? 'bg-primary text-white shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Tag size={13} />
            <span>Diskon Belanja</span>
          </button>
          <button
            onClick={() => setActiveCategory('ONGKIR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'ONGKIR'
                ? 'bg-primary text-white shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck size={13} />
            <span>Gratis Ongkir</span>
          </button>
          <button
            onClick={() => setActiveCategory('COIN')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'COIN'
                ? 'bg-primary text-white shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Coins size={13} />
            <span>Tukar Koin Reward</span>
          </button>
        </div>

        {/* ── VOUCHER TICKET CARDS GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredVouchers.map((v) => {
            const usedPct = v.quota ? Math.round(((v.usedCount || 0) / v.quota) * 100) : 40
            const isOngkir = v.code.includes('ONGKIR') || v.category === 'ONGKIR'

            return (
              <div
                key={v.id || v.code}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group"
              >
                {/* Top Badge Strip */}
                <div className={`p-4 ${isOngkir ? 'bg-emerald-50 text-primary' : 'bg-amber-50 text-amber-900'} border-b border-slate-100 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isOngkir ? 'bg-primary text-white' : 'bg-amber-500 text-white'}`}>
                      {isOngkir ? <Truck size={16} /> : <Ticket size={16} />}
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider block leading-tight">
                        {isOngkir ? 'Bebas Ongkir' : 'Voucher Diskon'}
                      </span>
                      <span className="text-xs font-black font-mono">
                        {v.discountType === 'PERCENT' ? `Hemat ${v.discountValue}%` : `Hemat Rp ${v.discountValue?.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold bg-white/80 px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                    Exp: {v.expiresAt || '31 Des'}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                      {v.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {v.description || `Min. Belanja Rp ${(v.minPurchase || 0).toLocaleString('id-ID')}`}
                    </p>
                  </div>

                  {/* Quota Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>Terpakai {usedPct}%</span>
                      <span>Sisa {(v.quota || 100) - (v.usedCount || 40)} kupon</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Code Snippet Box */}
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Kode Voucher</span>
                      <span className="font-mono font-black text-xs text-slate-900">{v.code}</span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(v.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        copiedCode === v.code
                          ? 'bg-primary text-white'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {copiedCode === v.code ? (
                        <>
                          <Check size={12} strokeWidth={3} />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <Link
                    href={`/cart?code=${encodeURIComponent(v.code)}`}
                    className="w-full py-2.5 bg-primary hover:bg-[#084e1b] text-white text-xs font-extrabold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <span>Pakai di Keranjang</span>
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── INFO HOW TO USE VOUCHER ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            <span>Cara Menggunakan Voucher di Saloka.id</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="bg-slate-50 p-3 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block">1. Salin Kode Kupon</span>
              <p className="text-[11px] text-slate-500">Pilih voucher yang ingin digunakan dan klik tombol Salin Kode.</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block">2. Masukkan di Keranjang</span>
              <p className="text-[11px] text-slate-500">Tempelkan kode pada kolom voucher di halaman Keranjang Belanja.</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block">3. Diskon Terpasang Otomatis</span>
              <p className="text-[11px] text-slate-500">Total tagihan belanja Anda akan langsung terpotong secara instan.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
