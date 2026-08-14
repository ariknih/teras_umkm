'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Scale, X, ShoppingCart, Star, Check } from 'lucide-react'

interface CompareProduct {
  id: string
  title: string
  price: number
  category: string
  stock?: number
  imageUrl?: string
}

export default function ProductCompareModal() {
  const [compareItems, setCompareItems] = useState<CompareProduct[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleAddCompare = (e: any) => {
      if (!e.detail) return
      setCompareItems((prev) => {
        if (prev.some((p) => p.id === e.detail.id)) return prev
        if (prev.length >= 3) return [...prev.slice(1), e.detail]
        return [...prev, e.detail]
      })
    }

    window.addEventListener('add-product-compare' as any, handleAddCompare)
    return () => {
      window.removeEventListener('add-product-compare' as any, handleAddCompare)
    }
  }, [])

  if (compareItems.length === 0) return null

  return (
    <>
      {/* Floating Compare Bar */}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-amber-400" />
          <span className="text-xs font-bold">
            Komparasi ({compareItems.length}/3 Produk)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {compareItems.map((p) => (
            <div key={p.id} className="relative group">
              <div className="w-7 h-7 rounded-lg bg-slate-800 overflow-hidden border border-slate-600">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[7px]">UMKM</div>
                )}
              </div>
              <button
                onClick={() => setCompareItems(prev => prev.filter(item => item.id !== p.id))}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 rounded-full flex items-center justify-center text-[8px] text-white hover:bg-rose-500 cursor-pointer"
                title="Hapus"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-3 py-1 bg-[#006E24] hover:bg-[#084e1b] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          Bandingkan
        </button>

        <button
          onClick={() => setCompareItems([])}
          className="p-1 text-slate-400 hover:text-white cursor-pointer"
          title="Tutup Bar"
        >
          <X size={14} />
        </button>
      </div>

      {/* Comparison Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-[#006E24]" />
                <h3 className="text-base font-extrabold text-slate-900">Perbandingan Produk UMKM</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-3 font-bold text-slate-500 w-1/4">Atribut</th>
                    {compareItems.map((p) => (
                      <th key={p.id} className="py-3 px-3 font-extrabold text-slate-900 w-1/4">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden mb-2 border border-slate-200">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px]">UMKM</div>
                          )}
                        </div>
                        <span className="line-clamp-2">{p.title}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-500">Harga Satuan</td>
                    {compareItems.map((p) => (
                      <td key={p.id} className="py-2.5 px-3 font-black text-[#006E24] font-mono text-sm">
                        Rp {p.price.toLocaleString('id-ID')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-500">Kategori</td>
                    {compareItems.map((p) => (
                      <td key={p.id} className="py-2.5 px-3 font-semibold uppercase text-[10px]">
                        {p.category}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-500">Status Stok</td>
                    {compareItems.map((p) => (
                      <td key={p.id} className="py-2.5 px-3 font-semibold">
                        {(p.stock || 0) > 0 ? (
                          <span className="text-[#006E24] font-bold">Tersedia ({p.stock} pcs)</span>
                        ) : (
                          <span className="text-rose-600 font-bold">Stok Habis</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-500">Rating Pembeli</td>
                    {compareItems.map((p) => (
                      <td key={p.id} className="py-2.5 px-3 font-bold text-amber-500 flex items-center gap-1">
                        <Star size={13} fill="currentColor" />
                        <span>4.9 / 5.0</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-500">Aksi</td>
                    {compareItems.map((p) => (
                      <td key={p.id} className="py-3 px-3">
                        <Link
                          href={`/market/product/${p.id}`}
                          onClick={() => setIsOpen(false)}
                          className="px-3 py-1.5 bg-[#006E24] hover:bg-[#084e1b] text-white text-[11px] font-bold rounded-xl inline-flex items-center gap-1 shadow-2xs"
                        >
                          <ShoppingCart size={12} />
                          <span>Lihat Produk</span>
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
