'use client'

import React, { useState } from 'react'
import { Truck, MapPin, Scale, Search, ShieldCheck, ArrowRight } from 'lucide-react'

const MAJOR_CITIES = [
  'Jakarta Selatan, DKI Jakarta',
  'Jakarta Barat, DKI Jakarta',
  'Bandung, Jawa Barat',
  'Semarang, Jawa Tengah',
  'Surabaya, Jawa Timur',
  'Yogyakarta, DI Yogyakarta',
  'Solo / Surakarta, Jawa Tengah',
  'Denpasar, Bali',
  'Medan, Sumatera Utara',
  'Palembang, Sumatera Selatan',
  'Makassar, Sulawesi Selatan',
  'Balikpapan, Kalimantan Timur'
]

interface ShippingResult {
  courier: string
  service: string
  price: number
  etd: string
  badge?: string
}

export default function ShippingRateCalculatorWidget() {
  const [origin, setOrigin] = useState('Semarang, Jawa Tengah')
  const [destination, setDestination] = useState('Jakarta Selatan, DKI Jakarta')
  const [weight, setWeight] = useState(1000) // in grams
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ShippingResult[] | null>(null)

  const handleCalculate = () => {
    setLoading(true)
    setTimeout(() => {
      // Realistic simulation based on weight and distance
      const baseKg = Math.ceil(weight / 1000)
      const baseFee = origin === destination ? 9000 : 15000

      const calculated: ShippingResult[] = [
        {
          courier: 'J&T Express',
          service: 'EZ Reguler',
          price: baseFee * baseKg,
          etd: '1-2 Hari',
          badge: 'Paling Populer'
        },
        {
          courier: 'SiCepat',
          service: 'SIUNTUNG',
          price: Math.max(10000, (baseFee - 2000) * baseKg),
          etd: '2-3 Hari',
          badge: 'Hemat'
        },
        {
          courier: 'JNE Express',
          service: 'REG (Reguler)',
          price: (baseFee + 1000) * baseKg,
          etd: '1-3 Hari'
        },
        {
          courier: 'JNE Express',
          service: 'YES (Yakin Esok Sampai)',
          price: (baseFee + 14000) * baseKg,
          etd: '1 Hari (Besok Sampai)',
          badge: 'Kilat'
        },
        {
          courier: 'Pos Indonesia',
          service: 'Pos Reguler',
          price: Math.max(9000, (baseFee - 3000) * baseKg),
          etd: '2-4 Hari'
        }
      ]

      setResults(calculated)
      setLoading(false)
    }, 400)
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-[#006E24] flex items-center justify-center font-bold">
            <Truck size={18} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
              Cek Tarif Ongkir Ekspedisi UMKM
            </h3>
            <p className="text-[11px] text-slate-500">Hitung perkiraan biaya kirim produk ke seluruh Indonesia</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 text-[10px] text-[#006E24] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck size={12} />
          <span>Integrasi Resmi Ekspedisi</span>
        </div>
      </div>

      {/* Input Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Origin */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <MapPin size={12} className="text-[#006E24]" />
            <span>Kota Asal Pengirim</span>
          </label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#006E24]"
          >
            {MAJOR_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <MapPin size={12} className="text-rose-500" />
            <span>Kota Tujuan Penerima</span>
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#006E24]"
          >
            {MAJOR_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Weight & CTA */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Scale size={12} className="text-amber-600" />
            <span>Berat Paket</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#006E24]"
            >
              <option value={500}>500 Gram (0.5 kg)</option>
              <option value={1000}>1.000 Gram (1 kg)</option>
              <option value={2000}>2.000 Gram (2 kg)</option>
              <option value={3000}>3.000 Gram (3 kg)</option>
              <option value={5000}>5.000 Gram (5 kg)</option>
            </select>

            <button
              onClick={handleCalculate}
              disabled={loading}
              className="px-4 py-2 bg-[#006E24] hover:bg-[#084e1b] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Search size={13} strokeWidth={2.5} />
              <span>{loading ? '...' : 'Cek'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results List */}
      {results && (
        <div className="pt-2 border-t border-slate-100 space-y-2 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Hasil Estimasi Tarif ({origin.split(',')[0]} ➔ {destination.split(',')[0]}):</span>
            <span>Berat: {weight / 1000} kg</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {results.map((r, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between space-y-2 hover:border-[#006E24] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">{r.courier}</span>
                    <span className="text-[10px] text-slate-500">{r.service} • Est. {r.etd}</span>
                  </div>
                  {r.badge && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-[#006E24]">
                      {r.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between border-t border-slate-200/60 pt-1.5">
                  <span className="text-[10px] text-slate-400">Tarif:</span>
                  <span className="font-mono font-black text-sm text-[#006E24]">
                    Rp {r.price.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
