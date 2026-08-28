'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Banner {
  id: string
  title?: string
  imageUrl: string
  linkUrl?: string
}

const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'default-1',
    title: 'Pesta Diskon UMKM Nusantara — Hemat Hingga 50%',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1400&q=80',
    linkUrl: '/market'
  },
  {
    id: 'default-2',
    title: 'Booking Jasa & Keahlian Profesional Terpercaya di Saloka',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
    linkUrl: '/jasa'
  },
  {
    id: 'default-3',
    title: 'Program Afiliasi Koperasi Saloka — Dapatkan Komisi Multi-Tier',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1400&q=80',
    linkUrl: '/affiliate'
  }
]

export default function BannerCarousel({ banners }: { banners?: Banner[] }) {
  const displayBanners = banners && banners.length > 0 ? banners : DEFAULT_BANNERS
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (displayBanners.length <= 1 || isHovered) return

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayBanners.length)
    }, 4500)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [displayBanners.length, isHovered])

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-6">
      {/* ── TOKOPEDIA-STYLE SLEEK HERO BANNER CONTAINER ── */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-full h-[140px] sm:h-[190px] md:h-[240px] lg:h-[275px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-shadow group bg-slate-100 border border-slate-200/90"
      >
        {displayBanners.map((banner, idx) => {
          const isActive = idx === currentIndex
          const content = (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Banner Image */}
              <img
                src={banner.imageUrl}
                alt={banner.title || `Promo Banner ${idx + 1}`}
                className="w-full h-full object-cover"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />

              {/* Gradient Backdrop for Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent pointer-events-none" />

              {/* Text & CTA overlay (Tokopedia Banner Typography) */}
              {banner.title && (
                <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-4 sm:px-8 md:px-12 text-white z-20 space-y-1.5 sm:space-y-2.5 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#006E24] text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-white shadow-xs w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                    <span>Promo Saloka</span>
                  </div>

                  <h3 className="text-sm sm:text-lg md:text-2xl font-extrabold tracking-tight drop-shadow leading-snug line-clamp-2 text-white">
                    {banner.title}
                  </h3>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 bg-white hover:bg-emerald-50 text-[#006E24] font-extrabold text-[10px] sm:text-xs rounded-xl shadow-sm transition-all duration-150">
                      <span>Cek Sekarang</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                      </svg>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )

          if (banner.linkUrl) {
            return (
              <Link key={banner.id} href={banner.linkUrl} className="block w-full h-full">
                {content}
              </Link>
            )
          }
          return content
        })}

        {/* ── NAVIGATION CONTROLS (TOKOPEDIA-STYLE) ── */}
        {displayBanners.length > 1 && (
          <>
            {/* Left Prev Arrow */}
            <button
              onClick={(e) => {
                e.preventDefault()
                setCurrentIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length)
              }}
              aria-label="Banner sebelumnya"
              className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md border border-slate-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>

            {/* Right Next Arrow */}
            <button
              onClick={(e) => {
                e.preventDefault()
                setCurrentIndex((prev) => (prev + 1) % displayBanners.length)
              }}
              aria-label="Banner berikutnya"
              className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md border border-slate-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>

            {/* ── TOKOPEDIA BOTTOM-LEFT DOT INDICATORS ── */}
            <div className="absolute bottom-2.5 sm:bottom-3 left-3 sm:left-6 z-30 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
              {displayBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`rounded-full transition-all duration-300 cursor-pointer border-none ${
                    idx === currentIndex
                      ? 'w-4 sm:w-5 h-1.5 sm:h-2 bg-emerald-400 shadow-xs'
                      : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/70 hover:bg-white'
                  }`}
                />
              ))}
            </div>

            {/* ── TOKOPEDIA BOTTOM-RIGHT "LIHAT PROMO LAINNYA" PILL ── */}
            <Link
              href="/market"
              className="absolute bottom-2.5 sm:bottom-3 right-3 sm:right-6 z-30 text-[10px] sm:text-xs font-bold text-white bg-black/60 hover:bg-black/80 backdrop-blur-xs px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 border border-white/20 transition-all shadow-xs"
            >
              <span>Lihat Promo Lainnya</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
