'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { selectUserRole } from '@/app/actions/auth'
import { Store, ShoppingBag, Users, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

const lightThemeStyles = {
  '--background': '#F5F7F9',
  '--foreground': '#111111',
  '--primary': '#2DB24A',
  '--primary-container': '#2DB24A',
  '--on-primary-container': '#FFFFFF',
  '--secondary': '#0F5132',
  '--text-primary': '#111111',
  '--text-secondary': '#6B7280',
} as React.CSSProperties;

export default function SelectRolePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'MERCHANT' | 'AFFILIATE' | null>(null)

  const handleSelectRole = (role: 'CUSTOMER' | 'MERCHANT' | 'AFFILIATE') => {
    setSelectedRole(role)
    setError(null)
    
    startTransition(async () => {
      try {
        const res = await selectUserRole(role)
        if (res.error) {
          setError(res.error)
        } else {
          // Redirect based on selected role
          if (role === 'MERCHANT') {
            router.push('/onboarding')
          } else if (role === 'AFFILIATE') {
            router.push('/affiliate')
          } else {
            router.push('/')
          }
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat menyimpan pilihan Anda.')
      }
    })
  }

  return (
    <div style={lightThemeStyles} className="relative min-h-screen bg-bg-dark py-16 px-4 md:px-10 flex items-center justify-center overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[10%] left-[5%] w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="w-full max-w-4xl bg-white border border-slate-200/80 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.05)] p-8 md:p-12 z-10 text-center space-y-10">
        <div className="space-y-3">
          <div className="flex justify-center items-center gap-2 text-2xl font-bold tracking-tight text-slate-800">
            Saloka<span className="text-[#FFC107]">.id</span>
          </div>
          <h1 className="font-poppins text-2xl md:text-3xl font-extrabold text-slate-800">Pilih Peran Akun Anda</h1>
          <p className="text-sm text-text-secondary max-w-lg mx-auto">
            Selamat datang! Akun Google Anda telah berhasil terhubung. Pilih bagaimana Anda ingin menggunakan Saloka.id untuk melanjutkan.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-xs text-red-600 font-semibold border-l-4 border-red-500 text-left max-w-md mx-auto">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* MERCHANT CARD */}
          <button
            onClick={() => handleSelectRole('MERCHANT')}
            disabled={isPending}
            className={`group text-left p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[260px] cursor-pointer bg-white ${
              selectedRole === 'MERCHANT'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-emerald-500/50 hover:shadow-lg'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Store size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-poppins font-bold text-base text-slate-800">Mulai Jualan (Merchant)</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Buka toko online, pajang produk & jasa Anda, serta kelola transaksi UMKM digital.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
              {isPending && selectedRole === 'MERCHANT' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                'Buka Toko & Onboarding →'
              )}
            </div>
          </button>

          {/* CUSTOMER CARD */}
          <button
            onClick={() => handleSelectRole('CUSTOMER')}
            disabled={isPending}
            className={`group text-left p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[260px] cursor-pointer bg-white ${
              selectedRole === 'CUSTOMER'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-emerald-500/50 hover:shadow-lg'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <ShoppingBag size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-poppins font-bold text-base text-slate-800">Hanya Belanja (Customer)</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Cari dan beli berbagai macam produk fisik, jasa, dan kreasi UMKM berkualitas.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
              {isPending && selectedRole === 'CUSTOMER' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                'Mulai Belanja & Jelajahi →'
              )}
            </div>
          </button>

          {/* AFFILIATE CARD */}
          <button
            onClick={() => handleSelectRole('AFFILIATE')}
            disabled={isPending}
            className={`group text-left p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[260px] cursor-pointer bg-white ${
              selectedRole === 'AFFILIATE'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-emerald-500/50 hover:shadow-lg'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-poppins font-bold text-base text-slate-800">Cari Komisi (Affiliate)</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Promosikan produk UMKM orang lain ke sosial media Anda dan dapatkan komisi penjualan.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
              {isPending && selectedRole === 'AFFILIATE' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                'Gabung Program Afiliasi →'
              )}
            </div>
          </button>
        </div>

        <div className="text-[10px] text-text-secondary border-t border-slate-100 pt-6">
          Peran akun dapat diubah sewaktu-waktu melalui pengaturan profil Anda setelah masuk.
        </div>
      </div>
    </div>
  )
}
