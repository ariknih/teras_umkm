'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { MapPin, Search, X, Check, Building2, Navigation } from 'lucide-react'
import { useSnackbox } from '@/context/SnackboxContext'
import { mockKelurahans } from '@/lib/mock-snackbox'
import { Kelurahan } from '@/types/snackbox'

export default function KelurahanSwitcherModal() {
  const { kelurahan, setKelurahan, isKelurahanModalOpen, setIsKelurahanModalOpen } = useSnackbox()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsKelurahanModalOpen(false)
      }
    }
    if (isKelurahanModalOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isKelurahanModalOpen, setIsKelurahanModalOpen])

  const filteredKelurahans = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return mockKelurahans
    return mockKelurahans.filter(
      k =>
        k.name.toLowerCase().includes(q) ||
        k.kecamatan.toLowerCase().includes(q) ||
        k.kota.toLowerCase().includes(q) ||
        k.postalCode.includes(q)
    )
  }, [searchQuery])

  if (!isKelurahanModalOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#2DB24A] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">Pilih Kelurahan Pengiriman</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Snackbox disiapkan segar dari kelurahan terdekat</p>
            </div>
          </div>
          <button
            onClick={() => setIsKelurahanModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari kelurahan, kecamatan, atau kota..."
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2DB24A] focus:ring-2 focus:ring-[#2DB24A]/20 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Popular Tags */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-[11px] font-semibold text-slate-600 scrollbar-none">
            <span className="text-slate-400 shrink-0">Populer:</span>
            {mockKelurahans.slice(0, 4).map(k => (
              <button
                key={k.id}
                onClick={() => {
                  setKelurahan(k)
                  setIsKelurahanModalOpen(false)
                }}
                className={`px-2.5 py-1 rounded-lg border transition-all shrink-0 ${
                  kelurahan.id === k.id
                    ? 'bg-[#2DB24A]/10 border-[#2DB24A] text-[#2DB24A]'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {k.name}
              </button>
            ))}
          </div>
        </div>

        {/* List of Kelurahans */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {filteredKelurahans.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Kelurahan tidak ditemukan</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Coba gunakan kata kunci nama kelurahan atau kecamatan yang lebih umum.
              </p>
            </div>
          ) : (
            filteredKelurahans.map((k: Kelurahan) => {
              const isSelected = kelurahan.id === k.id
              return (
                <button
                  key={k.id}
                  onClick={() => {
                    setKelurahan(k)
                    setIsKelurahanModalOpen(false)
                  }}
                  className={`w-full py-3.5 px-3 rounded-2xl flex items-center justify-between text-left transition-all group ${
                    isSelected
                      ? 'bg-emerald-50/80 border border-[#2DB24A]/30 text-emerald-950'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${isSelected ? 'bg-[#2DB24A] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{k.name}</span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {k.postalCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kec. {k.kecamatan}, {k.kota}, {k.province}
                      </p>
                      {k.itemCount && (
                        <p className="text-[11px] font-semibold text-[#2DB24A] mt-1">
                          ✨ {k.itemCount}+ Menu Snackbox Tersedia
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#2DB24A] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center font-medium">
          💡 Pengiriman dijamin tepat waktu sebelum jam acara Anda dimulai oleh kurir resmi Saloka.
        </div>
      </div>
    </div>
  )
}
