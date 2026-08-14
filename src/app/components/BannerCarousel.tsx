'use client'

import React, { useState, useEffect, useRef } from 'react'

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
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=85',
    linkUrl: '/market'
  },
  {
    id: 'default-2',
    title: 'Booking Jasa & Keahlian Profesional Terpercaya di Saloka',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=85',
    linkUrl: '/jasa'
  },
  {
    id: 'default-3',
    title: 'Program Afiliasi Koperasi Saloka — Dapatkan Komisi Multi-Tier',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1600&q=85',
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
    }, 5000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [displayBanners.length, isHovered])

  return (
    <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-full h-[180px] sm:h-[260px] md:h-[340px] lg:h-[380px] rounded-2xl md:rounded-3xl overflow-hidden shadow-md group bg-slate-100 border border-slate-200"
      >
        {displayBanners.map((banner, idx) => {
          const isActive = idx === currentIndex
          const content = (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={banner.imageUrl}
                alt={banner.title || `Banner Promosi ${idx + 1}`}
                className="w-full h-full object-cover"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
              
              {banner.title && (
                <div className="absolute bottom-0 inset-x-0 p-5 sm:p-8 md:p-10 text-white z-20 space-y-2 max-w-3xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006e24] text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                    <span>Promo Spesial UMKM</span>
                  </div>
                  <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight drop-shadow leading-tight text-white">
                    {banner.title}
                  </h3>
                </div>
              )}
            </div>
          )

          if (banner.linkUrl) {
            return (
              <a key={banner.id} href={banner.linkUrl} className="block w-full h-full">
                {content}
              </a>
            )
          }
          return content
        })}

        {/* Navigation Arrows */}
        {displayBanners.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault()
                setCurrentIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length)
              }}
              aria-label="Banner sebelumnya"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg border border-slate-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                setCurrentIndex((prev) => (prev + 1) % displayBanners.length)
              }}
              aria-label="Banner berikutnya"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg border border-slate-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>

            {/* Pagination Indicators */}
            <div className="absolute bottom-4 right-5 sm:right-8 z-30 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
              {displayBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer border-none ${
                    idx === currentIndex
                      ? 'w-6 bg-[#2db24a]'
                      : 'w-2 bg-white/60 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
