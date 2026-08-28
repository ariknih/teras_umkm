'use client'

import React from 'react'
import Link from 'next/link'
import { Store, ChefHat, ArrowRight, Sparkles, ShieldCheck, CheckCircle } from 'lucide-react'

export default function SnackboxMerchantCTA() {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-emerald-900/40">
      {/* Background glow & decorative shapes */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#2DB24A]/20 blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left copy */}
        <div className="lg:col-span-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ChefHat className="w-3.5 h-3.5" />
            <span>Kemitraan Dapur & Pembuat Kue UMKM</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Punya usaha kue atau cemilan rumahan di kelurahanmu?
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Bergabunglah dengan jaringan mitra <strong>Snackbox Saloka</strong>. Cukup fokus memasak kue terbaik dari dapur rumahmu, Saloka yang tangani kurasi box, pemasaran, transaksi instan, dan pengiriman kurir ke pelanggan.
          </p>

          {/* Benefits bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs font-medium text-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#2DB24A] shrink-0" />
              <span>Pesanan borongan rutin</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#2DB24A] shrink-0" />
              <span>Pencairan saldo instan</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#2DB24A] shrink-0" />
              <span>Kemasan standar Saloka</span>
            </div>
          </div>
        </div>

        {/* Right CTA */}
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-center gap-3">
          <Link
            href="/auth?role=MERCHANT"
            className="w-full sm:w-auto lg:w-full px-6 py-3.5 rounded-2xl bg-[#2DB24A] hover:bg-[#24943E] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-600/30 active:scale-95 text-center"
          >
            <Store className="w-4 h-4" />
            <span>Jadi Penjual Snackbox</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <span className="text-[11px] text-slate-400 font-medium text-center w-full">
            Gratis pendaftaran • Kurasi cepat 1x24 jam
          </span>
        </div>
      </div>
    </div>
  )
}
