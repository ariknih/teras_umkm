'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface Service {
  id: string
  merchantId: string
  title: string
  description?: string
  category: string
  pricePerSession?: number
  pricePerDay?: number
  sessionDurationMinutes?: number
  maxWorkHoursPerDay?: number
  images?: string[]
  location?: string
}

const CATEGORIES = [
  'Semua Kategori',
  'Desain & Multimedia',
  'Teknologi & IT',
  'Konsultasi Bisnis',
  'Kerajinan & Seni',
  'Reparasi & Perawatan',
  'Fotografi & Video',
  'Pendidikan & Kursus Privat',
  'Lainnya'
]

export default function JasaClient({
  initialServices,
  currentUser
}: {
  initialServices: Service[]
  currentUser?: any
}) {
  const [services] = useState<Service[]>(initialServices || [])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori')
  const [filterType, setFilterType] = useState<'ALL' | 'SESSION' | 'DAILY'>('ALL')

  const filteredServices = services.filter((s) => {
    const matchCat = selectedCategory === 'Semua Kategori' || s.category === selectedCategory
    const matchSearch =
      !search ||
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
    const matchType =
      filterType === 'ALL' ||
      (filterType === 'SESSION' && (s.pricePerSession || 0) > 0) ||
      (filterType === 'DAILY' && (s.pricePerDay || 0) > 0)

    return matchCat && matchSearch && matchType
  })

  return (
    <div className="space-y-8">
      {/* Search and Filters Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-1/2 relative">
          <input
            type="text"
            placeholder="Cari layanan jasa, keahlian, atau konsultan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F5132]"
          />
          <span className="absolute right-3.5 top-3.5 text-slate-400">🔍</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterType === 'ALL' ? 'bg-[#0F5132] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Tarif
            </button>
            <button
              onClick={() => setFilterType('SESSION')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterType === 'SESSION' ? 'bg-[#0F5132] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Sesi
            </button>
            <button
              onClick={() => setFilterType('DAILY')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterType === 'DAILY' ? 'bg-[#0F5132] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Hari (Max 8 Jam)
            </button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4">
          <div className="text-5xl">🛠️</div>
          <h3 className="text-lg font-bold text-slate-800">Belum ada layanan jasa yang ditemukan</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau kategori filter Anda, atau jadilah penyedia jasa pertama di Saloka.id!
          </p>
          <Link
            href={currentUser ? "/merchant/dashboard" : "/auth?tab=register"}
            className="inline-block px-5 py-2.5 bg-[#0F5132] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow hover:bg-[#0a3a24]"
          >
            + Tambah Layanan Jasa Baru
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((svc) => {
            const firstImage = svc.images && svc.images.length > 0 ? svc.images[0] : 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80'
            return (
              <div
                key={svc.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image container */}
                  <div className="h-48 bg-slate-100 relative overflow-hidden">
                    <img
                      src={firstImage}
                      alt={svc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {svc.category}
                    </span>
                    {svc.location && (
                      <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        📍 {svc.location}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-[#0F5132] transition-colors">
                      {svc.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {svc.description || 'Penyedia jasa profesional terverifikasi di platform Saloka.id.'}
                    </p>

                    {/* Pricing Tags */}
                    <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-100">
                      {svc.pricePerSession ? (
                        <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <p className="text-[9px] uppercase font-bold text-emerald-800">Per Sesi ({svc.sessionDurationMinutes || 60} mnt)</p>
                          <p className="text-xs font-extrabold text-emerald-700 font-mono">
                            Rp {svc.pricePerSession.toLocaleString('id-ID')}
                          </p>
                        </div>
                      ) : null}

                      {svc.pricePerDay ? (
                        <div className="bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                          <p className="text-[9px] uppercase font-bold text-blue-800">Per Hari (Max {svc.maxWorkHoursPerDay || 8} Jam)</p>
                          <p className="text-xs font-extrabold text-blue-700 font-mono">
                            Rp {svc.pricePerDay.toLocaleString('id-ID')}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <Link
                    href={`/jasa/${svc.id}`}
                    className="w-full py-2.5 bg-[#0F5132] hover:bg-[#0a3a24] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>📅 Cek Jadwal & Booking</span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
