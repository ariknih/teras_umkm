'use client'

import React from 'react'
import Link from 'next/link'
import { Store, ChefHat, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function SnackboxMerchantCTA() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute right-0 top-0 w-48 h-full bg-gradient-to-l from-[#E8F5E9]/50 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#E8F5E9] border border-[#C8E6C9] text-[#006E24] text-[11px] font-bold">
            <ChefHat className="w-3.5 h-3.5" />
            <span>Kemitraan Usaha Kue & Cemilan Rumahan</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            Punya Usaha Kue Rumahan di Kelurahanmu?
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            Bergabunglah jadi penyedia snackbox resmi Saloka. Anda cukup fokus membuat kue terbaik di dapur, Saloka yang mengurus pesanan borongan, pembayaran aman, dan pengiriman kurir langsung ke pelanggan.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#006E24]" />
              Pesanan borongan rutin
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#006E24]" />
              Pencairan saldo instan
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#006E24]" />
              Standar kemasan Saloka
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <Link
            href="/auth?role=MERCHANT"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#006E24] hover:bg-[#005a1d] text-white text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <Store className="w-4 h-4" />
            <span>Daftar Jadi Penjual Snackbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
