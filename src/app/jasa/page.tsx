import React from 'react'
import Link from 'next/link'
import { getServicesAction } from '@/app/actions/services'
import { getCurrentUser } from '@/app/actions/auth'
import JasaClient from './JasaClient'

export const dynamic = 'force-dynamic'

export default async function JasaPage() {
  const user = await getCurrentUser()
  const services = await getServicesAction()

  return (
    <div className="min-h-screen bg-slate-50 font-poppins pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F5132] to-[#1e7e34] text-white py-12 px-6 md:px-16 shadow-md">
        <div className="max-w-[1280px] mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-xs">
            <span>🛠️ Saloka Jasa & Layanan Profesional</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Booking Jasa & Keahlian Terpercaya
          </h1>
          <p className="text-white/80 max-w-2xl text-sm md:text-base leading-relaxed">
            Pesan langsung tenaga ahli, konsultasi, dan layanan profesional dengan sistem booking tanggal transparan, tarif per sesi atau per hari (maksimal 8 jam kerja), dan pembayaran aman bergaransi platform.
          </p>
          
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={user ? "/merchant/dashboard" : "/auth?tab=register"}
              className="px-5 py-2.5 bg-white text-[#0F5132] font-bold text-xs uppercase tracking-wider rounded-xl shadow hover:bg-slate-100 transition-colors"
            >
              + Buka Layanan Jasa Anda
            </Link>
            <Link
              href="/market"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors border border-white/20"
            >
              ← Belanja Produk Fisik (Marketplace)
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Component */}
      <div className="max-w-[1280px] mx-auto px-6 md:px-16 mt-8">
        <JasaClient initialServices={services} currentUser={user} />
      </div>
    </div>
  )
}
