'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/app/actions/auth'

interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  stock: number
  imageUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  merchantId?: string
}

interface ProductListGridProps {
  initialProducts: Product[]
}

// Haversine formula to calculate distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return d
}

export default function ProductListGrid({ initialProducts }: ProductListGridProps) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locStatus, setLocStatus] = useState<'idle' | 'prompting' | 'loading' | 'success' | 'error'>('idle')
  const [sortByDistance, setSortByDistance] = useState(false)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    async function getUser() {
      try {
        const u = await getCurrentUser()
        setCurrentUser(u)
      } catch (_) {}
    }
    getUser()

    // Check if location was already allowed/cached in sessionStorage
    const saved = sessionStorage.getItem('user_coords')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCoords(parsed)
        setLocStatus('success')
      } catch (_) {}
    }
  }, [])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('error')
      return
    }

    setLocStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        setCoords(newCoords)
        setLocStatus('success')
        sessionStorage.setItem('user_coords', JSON.stringify(newCoords))
      },
      (error) => {
        // Silently handle — often caused by browser extensions or user denial
        setLocStatus('error')
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  // Update and sort products when coordinates or sortByDistance changes
  useEffect(() => {
    let list = [...initialProducts]
    if (coords) {
      // Add distance property
      const listWithDist = list.map(p => {
        const lat = p.latitude ?? -6.2088 // default fallback
        const lon = p.longitude ?? 106.8456
        const distance = getDistance(coords.latitude, coords.longitude, lat, lon)
        return { ...p, distance }
      })

      if (sortByDistance) {
        listWithDist.sort((a, b) => (a.distance || 0) - (b.distance || 0))
      }
      setProducts(listWithDist as any)
    } else {
      setProducts(list)
    }
  }, [coords, sortByDistance, initialProducts])

  return (
    <div className="space-y-6">
      {/* Geolocation Banner & Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-dark border border-border-subtle p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            locStatus === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-text-primary font-sora">
              Rekomendasi Berbasis Jarak
            </h4>
            <p className="text-[10px] text-text-secondary">
              {locStatus === 'success' 
                ? '✓ Lokasi terdeteksi. Jarak produk diperbarui secara real-time.' 
                : locStatus === 'loading'
                ? 'Mencari sinyal GPS...'
                : 'Izinkan akses lokasi untuk mengurutkan merchant terdekat.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {locStatus !== 'success' && (
            <button
              onClick={requestLocation}
              disabled={locStatus === 'loading'}
              className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-surface-dark text-xs font-bold font-geist rounded uppercase tracking-wider transition-colors"
            >
              {locStatus === 'loading' ? 'Mengakses...' : 'Akses Lokasi'}
            </button>
          )}

          {locStatus === 'success' && (
            <label className="flex items-center gap-2 cursor-pointer border border-border-subtle bg-surface-container/60 hover:border-primary/40 px-3 py-2 rounded text-xs select-none transition-colors">
              <input
                type="checkbox"
                checked={sortByDistance}
                onChange={(e) => setSortByDistance(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary cursor-pointer"
              />
              <span className="font-geist font-bold text-text-primary">Urutkan Jarak Terdekat</span>
            </label>
          )}
        </div>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 border border-border-subtle rounded-lg bg-surface-dark">
          <h3 className="font-sora text-lg font-bold text-text-primary mb-2">Produk Tidak Ditemukan</h3>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            Silakan periksa kata kunci Anda atau ganti kategori penyaringan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const dist = (product as any).distance
            return (
              <Link
                key={product.id}
                href={`/market/product/${product.id}`}
                className="group flex flex-col bg-surface-dark border border-border-subtle hover:border-primary/45 rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Product Image Panel */}
                <div className="aspect-[4/3] w-full bg-surface-container relative overflow-hidden border-b border-border-subtle flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-60 flex items-center justify-center">
                      <span className="text-[10px] font-geist font-bold text-primary/40 uppercase tracking-widest">
                        {product.category} IMAGE
                      </span>
                    </div>
                  )}
                  {/* Category Pill */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    <span className="px-2 py-0.5 bg-surface-dark/80 backdrop-blur border border-primary/20 rounded text-[9px] font-geist font-bold text-primary uppercase tracking-wider">
                      {product.category}
                    </span>
                    {currentUser && product.merchantId === currentUser.id && (
                      <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/35 rounded text-[9px] font-geist font-bold text-red-400 uppercase tracking-wider animate-pulse">
                        Produk Anda
                      </span>
                    )}
                  </div>
                  
                  {/* Stock tag */}
                  {product.stock <= 0 ? (
                    <span className="absolute top-3 right-3 px-2 py-0.5 bg-red-950/80 backdrop-blur border border-red-500/35 rounded text-[9px] font-geist font-bold text-red-400 uppercase tracking-wider">
                      Habis
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3 px-2 py-0.5 bg-green-950/80 backdrop-blur border border-green-500/35 rounded text-[9px] font-geist font-bold text-green-400 uppercase tracking-wider">
                      Stok: {product.stock}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="font-sora text-sm font-bold text-text-primary line-clamp-1 group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                    </div>
                    
                    {/* Geolocation Distance Badge */}
                    {dist !== undefined && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-geist font-semibold text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-2.5 h-2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        {dist.toFixed(1)} km dari Anda
                      </span>
                    )}

                    <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border-subtle">
                    <span className="text-xs font-geist text-text-secondary">Harga</span>
                    <span className="text-sm font-bold text-primary">
                      Rp {product.price.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
