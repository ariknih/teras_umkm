'use client'

import React, { useState } from 'react'
import { Plus, Check, CheckCircle2 } from 'lucide-react'
import { SnackboxProduct } from '@/types/snackbox'
import { useSnackbox } from '@/context/SnackboxContext'

interface SnackboxProductCardProps {
  product: SnackboxProduct
}

export default function SnackboxProductCard({ product }: SnackboxProductCardProps) {
  const { addItem, cart } = useSnackbox()
  const [isAdded, setIsAdded] = useState(false)

  const cartItem = cart.items.find(item => item.product.id === product.id)
  const itemQuantityInCart = cartItem?.quantity || 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    addItem(product, 1)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1200)
  }

  // Calculate discount percentage if originalPrice exists
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : (product.isTrending ? 15 : 0)

  const originalPrice = product.originalPrice || (discountPercent > 0 ? Math.round(product.price * (100 / (100 - discountPercent))) : null)

  return (
    <div
      onClick={handleAddToCart}
      className="group flex flex-col bg-white border border-slate-200/90 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-[0_2px_8px_0_rgba(49,53,59,0.12)] hover:border-on-primary-container/40 h-full relative cursor-pointer"
    >
      {/* ── Square Image Container (Marketplace standard) ── */}
      <div className="aspect-square w-full bg-slate-100 relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px] font-semibold">
            Tanpa Foto
          </div>
        )}

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2 left-2 bg-primary-container text-on-primary-container font-extrabold text-[10px] px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
            {discountPercent}%
          </div>
        )}

        {/* Portion Weight / Category Tag */}
        {product.portionWeight && (
          <div className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
            ±{product.portionWeight}
          </div>
        )}

        {/* Quantity in Box Indicator Badge */}
        {itemQuantityInCart > 0 && (
          <div className="absolute top-2 right-2 bg-on-primary-container text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 animate-in zoom-in-75">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>{itemQuantityInCart} di Box</span>
          </div>
        )}
      </div>

      {/* ── Card Content Body ── */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Title */}
          <h3 className="text-xs font-medium text-slate-800 line-clamp-2 min-h-[32px] leading-snug group-hover:text-on-primary-container transition-colors">
            {product.title}
          </h3>

          {/* Price */}
          <div className="pt-1">
            <p className="text-sm font-extrabold text-slate-900 leading-tight">
              Rp {product.price.toLocaleString('id-ID')}
            </p>

            {/* Strikethrough discount price */}
            {originalPrice && discountPercent > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-slate-400 line-through">
                  Rp {originalPrice.toLocaleString('id-ID')}
                </span>
                <span className="bg-primary-container text-on-primary-container font-extrabold text-[9px] px-1 py-0.5 rounded border border-slate-200">
                  {discountPercent}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Metadata & Seller Row ── */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          {/* Rating & Sold Count — hidden until there's real data to show */}
          {(product.reviewCount > 0 || product.soldCount > 0) && (
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              {product.reviewCount > 0 && (
                <span className="text-amber-500 font-bold flex items-center gap-0.5">
                  ★ {product.rating.toFixed(1)}
                </span>
              )}
              {product.reviewCount > 0 && product.soldCount > 0 && <span>•</span>}
              {product.soldCount > 0 && <span>{product.soldCount.toLocaleString('id-ID')}+ terjual</span>}
            </div>
          )}

          {/* Seller: ALWAYS "Saloka" + Kelurahan (Middleman rule) */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate flex-1">
              <span className="text-on-primary-container font-bold text-xs">✔</span>
              <span className="truncate font-medium text-slate-600">Saloka • Kel. {product.kelurahanName}</span>
            </div>

            {/* Quick Add button */}
            <button
              type="button"
              onClick={handleAddToCart}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                isAdded
                  ? 'bg-on-primary-container text-white scale-95'
                  : itemQuantityInCart > 0
                  ? 'bg-primary-container text-on-primary-container border border-slate-200 hover:bg-on-primary-container hover:text-white'
                  : 'bg-on-primary-container hover:bg-primary-hover text-white'
              }`}
            >
              {isAdded ? (
                <span>Masuk!</span>
              ) : itemQuantityInCart > 0 ? (
                <>
                  <Plus className="w-3 h-3" />
                  <span>+{itemQuantityInCart}</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span>+ Box</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
