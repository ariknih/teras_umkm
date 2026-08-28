'use client'

import React, { useState, useMemo } from 'react'
import { Search, MapPin, Check, X, Building, ChevronRight } from 'lucide-react'
import { useSnackbox } from '@/context/SnackboxContext'
import { mockKelurahans } from '@/lib/mock-snackbox'
import { Kelurahan } from '@/types/snackbox'

export default function KelurahanSwitcherModal() {
  const { kelurahan, setKelurahan, isKelurahanModalOpen, setIsKelurahanModalOpen } = useSnackbox()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredKelurahans = useMemo(() => {
    if (!searchQuery.trim()) return mockKelurahans
    const q = searchQuery.toLowerCase().trim()
    return mockKelurahans.filter(
      k =>
        k.name.toLowerCase().includes(q) ||
        k.kecamatan.toLowerCase().includes(q) ||
        k.kota.toLowerCase().includes(q) ||
        k.postalCode.includes(q)
    )
  }, [searchQuery])

  if (!isKelurahanModalOpen) return null

  const handleSelectKelurahan = (item: Kelurahan) => {
    setKelurahan(item)
    setIsKelurahanModalOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={() => setIsKelurahanModalOpen(false)} />

      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Pilih Kelurahan Pengiriman
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menu kue disesuaikan dengan dapur mitra di kelurahan Anda
            </p>
          </div>
          <button
            onClick={() => setIsKelurahanModalOpen(false)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 bg-[#F5F7FA] shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari kelurahan, kecamatan, atau kota..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006E24] focus:ring-1 focus:ring-[#006E24]/20 transition-all"
              autoFocus
            />
          </div>

          {/* Quick Popular Tags */}
          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
            <span className="text-[10px] text-slate-500 font-medium">Populer:</span>
            {mockKelurahans.slice(0, 4).map(k => (
              <button
                key={k.id}
                type="button"
                onClick={() => handleSelectKelurahan(k)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium transition-all cursor-pointer ${
                  kelurahan.id === k.id
                    ? 'bg-[#E8F5E9] border-[#006E24] text-[#006E24] font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-[#006E24]/40 hover:text-slate-900'
                }`}
              >
                {k.name}
              </button>
            ))}
          </div>
        </div>

        {/* Kelurahan List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredKelurahans.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>Kelurahan tidak ditemukan.</p>
              <p className="text-[11px] text-slate-400 mt-1">Coba kata kunci kecamatan atau kota lain.</p>
            </div>
          ) : (
            filteredKelurahans.map(item => {
              const isSelected = kelurahan.id === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectKelurahan(item)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#E8F5E9]/80 border-[#006E24] shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#006E24] text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          Kel. {item.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({item.postalCode})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Kec. {item.kecamatan}, {item.kota}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.itemCount !== undefined && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {item.itemCount} menu
                      </span>
                    )}
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#006E24] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
