'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import HeaderNavigation from './HeaderNavigation'
import MobileBottomNav from '@/components/MobileBottomNav'
import FloatingChat from '@/components/FloatingChat'
import PwaInstallPrompt from './PwaInstallPrompt'
import ConnectivityStatus from './ConnectivityStatus'
import ProductCompareModal from './ProductCompareModal'
import { GsapScrollTrigger } from '@/components/GsapScrollTrigger'
import OnboardingGuard from './OnboardingGuard'

interface ClientLayoutWrapperProps {
  user: any
  dbUser: any
  wallet: any
  userSetupCompleted: boolean
  logoutAction: () => Promise<any>
  children: React.ReactNode
}

export default function ClientLayoutWrapper({
  user,
  dbUser,
  wallet,
  userSetupCompleted,
  logoutAction,
  children
}: ClientLayoutWrapperProps) {
  const pathname = usePathname() || ''
  const isAdminRoute = pathname.startsWith('/admin')
  const isBuilderRoute = pathname.startsWith('/merchant/builder')

  if (isAdminRoute || isBuilderRoute) {
    return (
      <div className={`min-h-full flex-grow flex flex-col ${isAdminRoute ? "bg-[#0c0d0e]" : "bg-[#e8eaed]"}`}>
        <main className="flex-grow flex flex-col">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-full flex-grow flex flex-col bg-bg-dark pb-16 md:pb-0">
      <GsapScrollTrigger />
      <OnboardingGuard isLoggedIn={!!user} userSetupCompleted={!!userSetupCompleted} userId={dbUser?.id || ''} />

      {/* ── RESPONSIVE NAVIGATION HEADER ──────────────────────────── */}
      <HeaderNavigation user={dbUser} wallet={wallet} logoutAction={logoutAction} />

      {/* Page Content */}
      <main className="flex-grow flex flex-col pt-[100px]">
        {children}
      </main>

      {/* ── GLOBAL FOOTER ──────────────────────────────────────────────── */}
      {/* ── GLOBAL FOOTER (Figma Screenshot 2 Exact Specs) ────────────────── */}
      <footer className="w-full py-12 md:py-16 border-t border-slate-200/80 bg-white print:hidden" suppressHydrationWarning>
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16" suppressHydrationWarning>
          {/* Column 1: Brand & Socials */}
          <div className="space-y-4" suppressHydrationWarning>
            <div className="flex items-center" suppressHydrationWarning>
              <img src="/images/Variant=Full.webp" alt="Saloka.id" width={160} height={40} loading="lazy" className="h-9 w-auto object-contain shrink-0" />
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-normal">
              Platform ekosistem digital terlengkap untuk pelaku UMKM Indonesia yang ingin berkembang.
            </p>
            {/* Social Icons (Instagram, TikTok, YouTube, Facebook) */}
            <div className="flex items-center gap-4 pt-2 text-slate-400" suppressHydrationWarning>
              {/* Instagram */}
              <a href="https://instagram.com/saloka.id" target="_blank" rel="noopener noreferrer" className="hover:text-[#2DB24A] transition-colors" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              {/* TikTok */}
              <a href="https://tiktok.com/@saloka.id" target="_blank" rel="noopener noreferrer" className="hover:text-[#2DB24A] transition-colors" aria-label="TikTok">
                <svg width="16" height="18" viewBox="0 0 448 512" fill="currentColor">
                  <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a href="https://youtube.com/@saloka.id" target="_blank" rel="noopener noreferrer" className="hover:text-[#2DB24A] transition-colors" aria-label="YouTube">
                <svg width="20" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="https://facebook.com/saloka.id" target="_blank" rel="noopener noreferrer" className="hover:text-[#2DB24A] transition-colors" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Platform */}
          <div className="space-y-3" suppressHydrationWarning>
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2DB24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              Platform
            </h5>
            <nav className="flex flex-col gap-2.5">
              <Link href="/market" className="text-xs text-slate-500 hover:text-[#2DB24A] transition-colors font-medium">Marketplace</Link>
              <Link href="/jasa" className="text-xs text-slate-500 hover:text-[#2DB24A] transition-colors font-medium">Booking Jasa & Keahlian</Link>
              <Link href="/community" className="text-xs text-slate-500 hover:text-[#2DB24A] transition-colors font-medium">Community</Link>
              <Link href="/affiliate" className="text-xs text-slate-500 hover:text-[#2DB24A] transition-colors font-medium">Affiliate Hub</Link>
              <Link href="/academy" className="text-xs text-slate-500 hover:text-[#2DB24A] transition-colors font-medium">Saloka Academy</Link>
            </nav>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-3" suppressHydrationWarning>
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2DB24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Legal
            </h5>
            <nav className="flex flex-col gap-2.5">
              <Link href="/privacy" className="text-xs text-slate-500 hover:text-[#2DB24A] transition-colors font-medium">Kebijakan Privasi</Link>
              <Link href="/terms" className="text-xs text-slate-500 hover:text-[#2DB24A] transition-colors font-medium">Syarat & Ketentuan</Link>
              <Link href="/terms" className="text-xs text-slate-500 hover:text-[#2DB24A] transition-colors font-medium">Merchant Agreement</Link>
              <Link href="/cs" className="text-xs text-slate-500 hover:text-[#2DB24A] transition-colors font-medium">Pusat Bantuan</Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar (Copyright) */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 mt-10 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left" suppressHydrationWarning>
          <p className="text-xs text-slate-400 font-normal">
            © 2026 Saloka.id. Dibuat dengan <span className="text-slate-600">❤</span> untuk UMKM Indonesia.
          </p>
        </div>
      </footer>

      <MobileBottomNav isLoggedIn={!!user} />
      <FloatingChat />
      <PwaInstallPrompt />
      <ConnectivityStatus />
      <ProductCompareModal />
    </div>
  )
}
