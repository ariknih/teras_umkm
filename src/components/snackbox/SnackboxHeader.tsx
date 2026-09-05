import React from 'react'
import { MapPin, ShoppingBag, ChevronRight, PawPrint, Loader2 } from 'lucide-react'
import { useSnackbox } from '@/context/SnackboxContext'

export default function SnackboxHeader() {
  const {
    kelurahan,
    setIsKelurahanModalOpen,
    setIsCartOpen,
    totalItemTypesCount,
    summary,
    isDetectingLocation,
    locationSource
  } = useSnackbox()

  return (
    <div id="snackbox-header-bar" className="w-full max-w-[1200px] mx-auto mb-6">
      <div
        id="snackbox-header-content"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-market-green-500 bg-gradient-to-r from-market-green-25 to-market-green-50"
      >
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-11 h-11 rounded-lg bg-white border border-market-green-100 flex items-center justify-center shadow-xs">
            <PawPrint className="w-5 h-5 text-market-green-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900 leading-tight">Snackbox Saloka!</h1>
            <p className="text-xs text-slate-500 truncate">Dibuat langsung oleh pembuat kue di sekitarmu!</p>
          </div>
        </div>

        {/* Right: Location Switcher + Cart Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsKelurahanModalOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 pl-3 pr-2.5 py-2 rounded-lg cursor-pointer hover:border-market-green-500/40"
          >
            {isDetectingLocation ? (
              <Loader2 className="w-3.5 h-3.5 text-market-green-600 animate-spin shrink-0" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-market-green-600 shrink-0" />
            )}
            <span className="font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-[200px]">
              {isDetectingLocation ? 'Mendeteksi lokasi...' : `Kel. ${kelurahan.name}, ${kelurahan.kota}`}
            </span>
            {locationSource === 'gps' && (
              <span className="text-[9px] font-bold text-[#006E24] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                GPS
              </span>
            )}
            {locationSource === 'ip' && (
              <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                IP
              </span>
            )}
            <span className="ml-1 font-extrabold text-market-green-600">Ganti</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 pl-4 pr-3.5 py-2 rounded-lg bg-market-green-500 hover:bg-market-green-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Keranjang Snackbox</span>
            <span className="w-5 h-5 rounded-full bg-white text-market-green-600 text-[11px] font-black flex items-center justify-center">
              {totalItemTypesCount}
            </span>
            {totalItemTypesCount > 0 && (
              <span className="font-extrabold pl-1 border-l border-white/30 text-[11px] flex items-center gap-0.5">
                Rp {summary.subtotalGross.toLocaleString('id-ID')}
                <ChevronRight className="w-3 h-3" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
