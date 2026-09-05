'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { formatCategoryName } from '@/lib/utils'
import { Search, MapPin, Calendar, Clock, Wrench, Plus, ChevronRight } from 'lucide-react'

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
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="w-full md:w-1/2 relative">
          <input
            type="text"
            placeholder="Cari layanan jasa, keahlian, atau konsultan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#006E24] focus:ring-1 focus:ring-[#006E24]/20 transition-all"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                filterType === 'ALL' ? 'bg-[#006E24] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Tarif
            </button>
            <button
              onClick={() => setFilterType('SESSION')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                filterType === 'SESSION' ? 'bg-[#006E24] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Sesi
            </button>
            <button
              onClick={() => setFilterType('DAILY')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                filterType === 'DAILY' ? 'bg-[#006E24] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Hari (8 Jam)
            </button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Belum ada layanan jasa yang ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Coba gunakan kata kunci pencarian atau kategori filter lain. Anda juga bisa mendaftarkan keahlian Anda sebagai mitra jasa.
          </p>
          <Link
            href={currentUser ? "/merchant/dashboard?tab=services" : "/auth?tab=register"}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006E24] hover:bg-[#00551c] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Buka Layanan Jasa Baru</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((svc) => {
            const firstImage = svc.images && svc.images.length > 0 ? svc.images[0] : 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80'
            return (
              <div
                key={svc.id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image container */}
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    <img
                      src={firstImage}
                      alt={svc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-[#006E24] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                      {formatCategoryName(svc.category)}
                    </span>
                    {svc.location && (
                      <span className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <MapPin className="w-3 h-3 text-[#006E24]" />
                        <span>{svc.location}</span>
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2.5">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-[#006E24] transition-colors">
                      {svc.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {svc.description || 'Penyedia jasa profesional terverifikasi di platform Saloka.'}
                    </p>

                    {/* Pricing Tags - Clean, Unified Styling */}
                    <div className="pt-2 grid grid-cols-2 gap-2 border-t border-slate-100">
                      {svc.pricePerSession ? (
                        <div className="bg-slate-50 border border-slate-200/70 p-2 rounded-xl">
                          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Per Sesi ({svc.sessionDurationMinutes || 60}m)</span>
                          </div>
                          <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                            Rp {svc.pricePerSession.toLocaleString('id-ID')}
                          </p>
                        </div>
                      ) : null}

                      {svc.pricePerDay ? (
                        <div className="bg-slate-50 border border-slate-200/70 p-2 rounded-xl">
                          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Per Hari (8 Jam)</span>
                          </div>
                          <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                            Rp {svc.pricePerDay.toLocaleString('id-ID')}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <Link
                    href={`/jasa/${svc.id}`}
                    className="w-full py-2.5 bg-[#006E24] hover:bg-[#00551c] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Cek Jadwal & Booking</span>
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
