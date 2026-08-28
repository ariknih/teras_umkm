'use client'

import React from 'react'
import { MapPin, ShoppingBag, ChevronDown, Sparkles, ShieldCheck } from 'lucide-react'
import { useSnackbox } from '@/context/SnackboxContext'

export default function SnackboxHeader() {
  const { kelurahan, setIsKelurahanModalOpen, setIsCartOpen, totalItemTypesCount, summary } = useSnackbox()

  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-[72px] sm:top-[76px] z-40 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Active Kelurahan Selector */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#2DB24A] flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 sm:flex-initial">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Lokasi Pengiriman Snackbox
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-100/80 text-[#2DB24A] text-[9px] font-bold">
                <ShieldCheck className="w-2.5 h-2.5" /> Resmi Saloka
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-extrabold text-sm text-slate-900 leading-none truncate max-w-[200px] sm:max-w-[280px]">
                Kelurahan {kelurahan.name}, {kelurahan.kota}
              </span>
              <button
                type="button"
                onClick={() => setIsKelurahanModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-[#2DB24A] hover:text-white text-slate-700 transition-colors shrink-0"
              >
                <span>Ganti</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Cart Button with Badge */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-between sm:justify-start gap-3 transition-all shadow-sm active:scale-95 group"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-[#2DB24A]" />
                {totalItemTypesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#2DB24A] text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                    {totalItemTypesCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-extrabold">Keranjang Snackbox</span>
            </div>

            {totalItemTypesCount > 0 ? (
              <span className="text-xs font-bold text-emerald-400 bg-white/10 px-2 py-0.5 rounded-lg">
                Rp {summary.subtotalGross.toLocaleString('id-ID')}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">Kosong</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
