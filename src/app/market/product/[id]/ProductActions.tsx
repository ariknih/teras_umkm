'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ProductActionsProps {
  product: {
    id: string
    title: string
    price: number
    stock: number
    merchantId?: string
  }
  affCode?: string
}

export default function ProductActions({ product, affCode }: ProductActionsProps) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const router = useRouter()

  // Save affiliate code if present
  useEffect(() => {
    if (affCode) {
      localStorage.setItem('teras_affiliate_id', affCode)
    }
  }, [affCode])

  const handleQtyChange = (val: number) => {
    if (val < 1) return
    if (val > product.stock) return
    setQty(val)
  }

  const getCart = () => {
    if (typeof window === 'undefined') return []
    try {
      const existing = localStorage.getItem('teras_cart')
      return existing ? JSON.parse(existing) : []
    } catch {
      return []
    }
  }

  const saveCart = (cart: any[]) => {
    localStorage.setItem('teras_cart', JSON.stringify(cart))
  }

  const handleAddToCart = () => {
    if (product.stock <= 0) return
    const cart = getCart()
    const idx = cart.findIndex((item: any) => item.productId === product.id)
    if (idx > -1) {
      cart[idx].quantity = Math.min(product.stock, cart[idx].quantity + qty)
    } else {
      cart.push({ productId: product.id, quantity: qty })
    }
    saveCart(cart)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
    router.refresh()
  }

  const handleBuyNow = () => {
    if (product.stock <= 0) return
    const cart = getCart()
    const idx = cart.findIndex((item: any) => item.productId === product.id)
    if (idx > -1) {
      cart[idx].quantity = qty
    } else {
      cart.push({ productId: product.id, quantity: qty })
    }
    saveCart(cart)
    router.push('/cart')
  }

  return (
    <div className="space-y-6">
      {/* Quantity Selector */}
      {product.stock > 0 && (
        <div className="flex items-center gap-4">
          <span className="text-xs font-geist font-bold text-text-secondary uppercase tracking-wider">
            Jumlah:
          </span>
          <div className="flex items-center border border-border-subtle bg-surface-container rounded">
            <button
              id="dec-qty"
              onClick={() => handleQtyChange(qty - 1)}
              className="px-3 py-1.5 hover:text-primary transition-colors text-sm font-bold"
            >
              -
            </button>
            <span id="qty-display" className="px-4 py-1.5 text-xs text-text-primary font-bold font-geist">
              {qty}
            </span>
            <button
              id="inc-qty"
              onClick={() => handleQtyChange(qty + 1)}
              className="px-3 py-1.5 hover:text-primary transition-colors text-sm font-bold"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {product.stock > 0 ? (
          <>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && product.merchantId) {
                  window.dispatchEvent(new CustomEvent('openTerasChat', {
                    detail: {
                      sellerId: product.merchantId,
                      productId: product.id
                    }
                  }))
                }
              }}
              className="py-4 px-5 bg-surface-container hover:bg-surface-container-high border border-primary/25 hover:border-primary/50 text-primary font-geist font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-1.5 transition-all duration-300"
              title="Chat dengan Penjual"
            >
              💬 Chat
            </button>
            <button
              id="btn-add-to-cart"
              onClick={handleAddToCart}
              className={`flex-1 py-4 font-geist font-bold text-xs uppercase tracking-wider rounded border transition-all duration-300 ${
                added
                  ? 'bg-green-950 border-green-500/50 text-green-400'
                  : 'bg-surface-container hover:bg-surface-container-high border-border-subtle hover:border-primary/40 text-text-primary'
              }`}
            >
              {added ? '✓ Berhasil Ditambahkan' : 'Masukkan Keranjang'}
            </button>
            <button
              id="btn-buy-now"
              onClick={handleBuyNow}
              className="flex-1 py-4 bg-primary hover:bg-primary-container text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded shadow-lg transition-all duration-300"
            >
              Beli Sekarang
            </button>
          </>
        ) : (
          <button
            id="btn-out-of-stock"
            disabled
            className="w-full py-4 bg-surface-container border border-border-subtle text-text-secondary font-geist font-bold text-xs uppercase tracking-wider rounded cursor-not-allowed opacity-50"
          >
            Stok Habis
          </button>
        )}
      </div>
    </div>
  )
}
