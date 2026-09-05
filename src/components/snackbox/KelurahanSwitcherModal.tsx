'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { Search, MapPin, Check, X, Building, ChevronRight, Navigation, Loader2 } from 'lucide-react'
import { useSnackbox } from '@/context/SnackboxContext'
import { mockKelurahans } from '@/lib/mock-snackbox'
import { Kelurahan } from '@/types/snackbox'

const POPULAR_SUGGESTIONS = [
  { name: 'Menteng', kota: 'Jakarta Pusat' },
  { name: 'Tebet', kota: 'Jakarta Selatan' },
  { name: 'Sukajadi', kota: 'Bandung' },
  { name: 'Gubeng', kota: 'Surabaya' },
  { name: 'Kuta', kota: 'Badung Bali' }
]

export default function KelurahanSwitcherModal() {
  const {
    kelurahan,
    setKelurahan,
    isKelurahanModalOpen,
    setIsKelurahanModalOpen,
    isDetectingLocation,
    detectLocation
  } = useSnackbox()

  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<Kelurahan[]>(mockKelurahans)
  const [isSearching, setIsSearching] = useState(false)
  const [, startTransition] = useTransition()

  // Live real-time search across all Indonesia
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults(mockKelurahans)
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/kelurahan/search?q=${encodeURIComponent(searchQuery.trim())}`)
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.data)) {
            setResults(json.data)
          }
        }
      } catch (err) {
        console.warn('Search failed:', err)
      } finally {
        setIsSearching(false)
      }
    }, 280)

    return () => clearTimeout(timer)
  }, [searchQuery])

  if (!isKelurahanModalOpen) return null

  const handleSelectKelurahan = (item: Kelurahan) => {
    setKelurahan(item)
    setIsKelurahanModalOpen(false)
    setSearchQuery('')
  }

  const handleAutoDetect = async () => {
    startTransition(async () => {
      const detected = await detectLocation()
      if (detected) {
        setIsKelurahanModalOpen(false)
      }
    })
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
              Cari kelurahan Anda di seluruh Indonesia untuk melihat dapur mitra terdekat
            </p>
          </div>
          <button
            onClick={() => setIsKelurahanModalOpen(false)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auto Detect Location Button */}
        <div className="px-4 pt-3 pb-1 bg-white shrink-0">
          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={isDetectingLocation}
            className="w-full py-2.5 px-3.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <div className="flex items-center gap-2">
              {isDetectingLocation ? (
                <Loader2 className="w-4 h-4 text-[#006E24] animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 text-[#006E24] fill-[#006E24]" />
              )}
              <span>
                {isDetectingLocation ? 'Mendeteksi Lokasi Anda (GPS & IP)...' : 'Gunakan Lokasi Saya Saat Ini'}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-[#006E24] bg-white px-2 py-0.5 rounded-md border border-emerald-200/80">
              Otomatis
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 bg-[#F5F7FA] shrink-0 space-y-2.5">
          <div className="relative">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-[#006E24] animate-spin absolute left-3.5 top-1/2 -translate-y-1/2" />
            ) : (
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ketik nama kelurahan, kecamatan, atau kota di Indonesia..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006E24] focus:ring-1 focus:ring-[#006E24]/20 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Popular Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 font-medium">Contoh:</span>
            {POPULAR_SUGGESTIONS.map(s => (
              <button
                key={s.name}
                type="button"
                onClick={() => setSearchQuery(s.name)}
                className="text-[11px] px-2.5 py-0.5 rounded-full border bg-white border-slate-200 text-slate-600 hover:border-[#006E24]/40 hover:text-slate-900 transition-all cursor-pointer"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Kelurahan List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {results.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>Kelurahan tidak ditemukan.</p>
              <p className="text-[11px] text-slate-400 mt-1">Coba ketik nama kecamatan, kota, atau kode pos.</p>
            </div>
          ) : (
            results.map(item => {
              const isSelected = kelurahan.id === item.id || (kelurahan.name === item.name && kelurahan.kota === item.kota)
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
                        {item.postalCode && (
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({item.postalCode})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Kec. {item.kecamatan}, {item.kota}{item.province ? `, ${item.province}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
