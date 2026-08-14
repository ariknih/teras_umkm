'use client'

import React, { useState, useEffect } from 'react'

interface Banner {
  id: string
  title?: string
  imageUrl: string
  linkUrl?: string
}

const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'default-1',
    title: 'Pesta Diskon UMKM Nusantara - Hemat Hingga 50%',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1400&q=80',
    linkUrl: '/market'
  },
  {
    id: 'default-2',
    title: 'Booking Jasa Profesional & Terpercaya di Saloka.id',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
    linkUrl: '/jasa'
  },
  {
    id: 'default-3',
    title: 'Program Afiliasi Saloka - Dapatkan Komisi Multi-Tier',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1400&q=80',
    linkUrl: '/affiliate'
  }
]

export default function BannerCarousel({ banners }: { banners?: Banner[] }) {
  const displayBanners = banners && banners.length > 0 ? banners : DEFAULT_BANNERS
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (displayBanners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayBanners.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [displayBanners.length])

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 md:px-20 pt-6">
      <div className="relative w-full h-[200px] sm:h-[300px] md:h-[380px] rounded-3xl overflow-hidden shadow-lg group bg-slate-900">
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
                alt={banner.title || `Banner ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {banner.title && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white">
                  <h3 className="text-xl md:text-2xl font-bold">{banner.title}</h3>
                </div>
              )}
            </div>
          )

          if (banner.linkUrl) {
            return (
              <a key={banner.id} href={banner.linkUrl} target="_blank" rel="noreferrer">
                {content}
              </a>
            )
          }
          return content
        })}

        {/* Carousel Navigation Buttons */}
        {displayBanners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer border-none"
            >
              ❮
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % displayBanners.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer border-none"
            >
              ❯
            </button>

            {/* Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {displayBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 border-none cursor-pointer ${
                    idx === currentIndex ? 'bg-[#2db24a] w-8' : 'bg-white/60 hover:bg-white'
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
