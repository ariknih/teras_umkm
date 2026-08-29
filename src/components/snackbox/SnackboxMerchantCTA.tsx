'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export default function SnackboxMerchantCTA() {
  return (
    <div className="bg-[#262626] rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
            Punya Usaha Kue Rumahan di Kelurahanmu?
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            Bergabunglah jadi penyedia snackbox resmi Saloka. Anda cukup fokus membuat kue terbaik di dapur, Saloka yang mengurus sisanya!
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-market-green-400" />
              Pesanan borongan rutin
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-market-green-400" />
              Standar kemasan Saloka
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <Link
            href="/auth?role=MERCHANT"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-red-400 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <span>Gabung ke Snackbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
