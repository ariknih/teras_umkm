'use client'

import React from 'react'
import { MapPin, ShoppingBag, ChevronDown, CheckCircle2 } from 'lucide-react'
import { useSnackbox } from '@/context/SnackboxContext'

export default function SnackboxHeader() {
  const { kelurahan, setIsKelurahanModalOpen, setIsCartOpen, totalItemTypesCount, summary } = useSnackbox()

  return (
    <div className="bg-white border-b border-slate-200 sticky top-[72px] sm:top-[76px] z-30 shadow-2xs">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Location Indicator with Switcher Button */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-[#F5F7FA] border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[#006E24] shrink-0" />
            <span className="text-slate-500 hidden sm:inline">Lokasi:</span>
            <span className="font-bold text-slate-800 truncate max-w-[150px] sm:max-w-[240px]">
              Kel. {kelurahan.name}, {kelurahan.kota}
            </span>
            <button
              type="button"
              onClick={() => setIsKelurahanModalOpen(true)}
              className="ml-1 text-[11px] font-extrabold text-[#006E24] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Ganti</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1 text-[11px] text-[#006E24] font-semibold bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            <span>Pesanan Resmi Terpadu Saloka</span>
          </div>
        </div>

        {/* Right: Cart Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              totalItemTypesCount > 0
                ? 'bg-[#006E24] text-white border-[#006E24] shadow-xs hover:bg-[#005a1d]'
                : 'bg-white border-slate-200 text-slate-700 hover:border-[#006E24]/40 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {totalItemTypesCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center">
                  {totalItemTypesCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Keranjang Box</span>
            {totalItemTypesCount > 0 && (
              <span className="font-extrabold pl-1 border-l border-white/30 text-[11px]">
                Rp {summary.subtotalGross.toLocaleString('id-ID')}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
