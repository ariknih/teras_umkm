'use client'

import React, { useState } from 'react'
import { Plus, Star, Check, ShieldCheck, Sparkles } from 'lucide-react'
import { SnackboxProduct } from '@/types/snackbox'
import { useSnackbox } from '@/context/SnackboxContext'

interface SnackboxProductCardProps {
  product: SnackboxProduct
}

export default function SnackboxProductCard({ product }: SnackboxProductCardProps) {
  const { addItem, cart } = useSnackbox()
  const [isAdded, setIsAdded] = useState(false)

  // Check if item is already in cart
  const cartItem = cart.items.find(item => item.product.id === product.id)
  const itemQuantityInCart = cartItem?.quantity || 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product, 1)
    setIsAdded(true)
    setTimeout(() => {
      setIsAdded(false)
    }, 1200)
  }

  return (
    <div
      onClick={handleAddToCart}
      className="group bg-white rounded-3xl border border-slate-200/90 hover:border-[#2DB24A]/60 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-white/95 text-slate-800 shadow-sm backdrop-blur-md">
            {product.category}
          </span>
          {product.isTrending && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Laris
            </span>
          )}
        </div>

        {/* Portion Weight Badge */}
        {product.portionWeight && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/70 text-white backdrop-blur-sm">
              ± {product.portionWeight} / pcs
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Middleman Trust Seal: NAMA SELLER TIDAK PERNAH DITAMPILKAN */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2DB24A]" />
            <span>Snackbox Resmi Saloka</span>
          </div>

          <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1 group-hover:text-[#2DB24A] transition-colors">
            {product.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-800">{product.rating.toFixed(1)}</span>
              <span>({product.soldCount.toLocaleString('id-ID')} terjual)</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-slate-900">
                Rp {product.price.toLocaleString('id-ID')}
              </span>
              {product.originalPrice && (
                <span className="text-[11px] text-slate-400 line-through">
                  Rp {product.originalPrice.toLocaleString('id-ID')}
                </span>
              )}
              <span className="text-[10px] text-slate-400">/ pcs</span>
            </div>
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer ${
              isAdded
                ? 'bg-emerald-600 text-white scale-95'
                : itemQuantityInCart > 0
                ? 'bg-emerald-50 text-[#2DB24A] border border-[#2DB24A]/40 hover:bg-[#2DB24A] hover:text-white'
                : 'bg-[#2DB24A] hover:bg-[#24943E] text-white active:scale-95'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Masuk!</span>
              </>
            ) : itemQuantityInCart > 0 ? (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah ({itemQuantityInCart})</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ke Box</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
