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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-[#2DB24A]" />
          <span>Pilih Tipe Kemasan Box</span>
        </label>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          Packaging Higienis Saloka
        </span>
      </div>

      <div className={`grid ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'} gap-2.5`}>
        {/* Box Reguler Card */}
        <button
          type="button"
          onClick={() => setBoxType('reguler')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
            cart.boxType === 'reguler'
              ? 'bg-gradient-to-br from-emerald-50/90 to-white border-[#2DB24A] shadow-sm ring-1 ring-[#2DB24A]/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          {cart.boxType === 'reguler' && (
            <div className="absolute top-3 right-3 text-[#2DB24A]">
              <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${cart.boxType === 'reguler' ? 'bg-[#2DB24A] text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Package className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-xs sm:text-sm text-slate-900">Box Reguler</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-800">
                Paling Populer
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
              <strong>Isi Seragam:</strong> Semua item yang dicentang akan dimasukkan ke tiap box dalam porsi yang sama.
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100/80 text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Cocok untuk: Rapat kantor, seminar & syukuran
          </div>
        </button>

        {/* Box Borongan Card */}
        <button
          type="button"
          onClick={() => setBoxType('borongan')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
            cart.boxType === 'borongan'
              ? 'bg-gradient-to-br from-amber-50/90 to-white border-amber-500 shadow-sm ring-1 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          {cart.boxType === 'borongan' && (
            <div className="absolute top-3 right-3 text-amber-600">
              <CheckCircle2 className="w-4 h-4 fill-amber-100" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${cart.boxType === 'borongan' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-xs sm:text-sm text-slate-900">Box Borongan</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800">
                Fleksibel
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
              <strong>Isi Bebas:</strong> Jumlah per kue dapat diatur independen sesuai kebutuhan tampungan nampan/meja.
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100/80 text-[10px] font-semibold text-amber-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Cocok untuk: Prasmanan, arisan & snack corner
          </div>
        </button>
      </div>
    </div>
  )
}
