'use client'

import React from 'react'
import { Package, Layers, Sparkles, CheckCircle2 } from 'lucide-react'
import { BoxType } from '@/types/snackbox'
import { useSnackbox } from '@/context/SnackboxContext'

interface BoxTypeSelectorProps {
  compact?: boolean
}

export default function BoxTypeSelector({ compact = false }: BoxTypeSelectorProps) {
  const { cart, setBoxType } = useSnackbox()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-[#006E24]" />
          <span>Tipe Kemasan Box</span>
        </label>
        <span className="text-[10px] font-semibold text-[#006E24] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#C8E6C9]">
          Standar Higienis Saloka
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Box Reguler Card */}
        <button
          type="button"
          onClick={() => setBoxType('reguler')}
          className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
            cart.boxType === 'reguler'
              ? 'bg-[#E8F5E9]/60 border-[#006E24] shadow-xs ring-1 ring-[#006E24]/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          {cart.boxType === 'reguler' && (
            <div className="absolute top-2.5 right-2.5 text-[#006E24]">
              <CheckCircle2 className="w-4 h-4 fill-[#006E24] text-white" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-bold text-xs text-slate-900">Box Reguler</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#006E24] text-white">
                Rapat / Acara
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Isi Seragam:</strong> Semua item dicentang dibagi rata ke tiap box dalam porsi yang sama.
            </p>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] font-semibold text-[#006E24] flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Rekomendasi: Seminar & syukuran
          </div>
        </button>

        {/* Box Borongan Card */}
        <button
          type="button"
          onClick={() => setBoxType('borongan')}
          className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
            cart.boxType === 'borongan'
              ? 'bg-amber-50/60 border-amber-500 shadow-xs ring-1 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          {cart.boxType === 'borongan' && (
            <div className="absolute top-2.5 right-2.5 text-amber-600">
              <CheckCircle2 className="w-4 h-4 fill-amber-600 text-white" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-bold text-xs text-slate-900">Box Borongan</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-white">
                Prasmanan
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Isi Bebas:</strong> Kuantiti per jenis kue dapat diatur secara mandiri sesuai nampan meja.
            </p>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] font-semibold text-amber-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Rekomendasi: Arisan & prasmanan
          </div>
        </button>
      </div>
    </div>
  )
}
