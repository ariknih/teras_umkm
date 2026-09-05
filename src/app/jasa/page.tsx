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
      {/* Compact Marketplace Header (No giant banner) */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-16 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-[#006E24] border border-emerald-200/60 rounded-full text-[11px] font-bold mb-1">
              <span>🛠️ Saloka Service & Talent</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Layanan Jasa & Keahlian UMKM
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
              Pesan langsung tenaga ahli, konsultasi, dan jasa profesional dengan sistem booking transparan dan rekening bersama (escrow) aman.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={user ? "/merchant/dashboard?tab=services" : "/auth?tab=register"}
              className="px-4 py-2.5 bg-[#006E24] hover:bg-[#00551c] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>+ Buka Layanan Jasa</span>
            </Link>
            <Link
              href="/market"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors border border-slate-200 cursor-pointer"
            >
              Belanja Produk Fisik
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Component */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-16 mt-6">
        <JasaClient initialServices={services} currentUser={user} />
      </div>
    </div>
  )
}
