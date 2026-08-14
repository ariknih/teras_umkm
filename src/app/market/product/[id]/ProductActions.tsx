'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { Share2, Check, ShoppingCart, Zap, Plus, Minus, MessageCircle, Copy } from 'lucide-react'
import { goeyToast } from 'goey-toast'

interface ProductActionsProps {
  product: {
    id: string
    title: string
    price: number
    stock: number
    merchantId?: string
  }
  affCode?: string
  userId?: string
  userRole?: string
}

export default function ProductActions({ product, affCode, userId, userRole }: ProductActionsProps) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeUserId, setActiveUserId] = useState<string | undefined>(userId)
  const [activeUserRole, setActiveUserRole] = useState<string | undefined>(userRole)
  const [copiedLink, setCopiedLink] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (userId) {
      setActiveUserId(userId)
    } else {
      getCurrentUser().then(u => {
        if (u) {
          setActiveUserId(u.id)
          setActiveUserRole(u.role)
        }
      })
    }
    if (userRole) {
      setActiveUserRole(userRole)
    }
  }, [userId, userRole])

  // Save affiliate code if present
  useEffect(() => {
    if (affCode) {
      const existing = localStorage.getItem('teras_affiliate_id')
      if (!existing) {
        localStorage.setItem('teras_affiliate_id', affCode)
      }
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
      const cartKey = activeUserId ? `teras_cart_${activeUserId}` : 'teras_cart'
      const existing = localStorage.getItem(cartKey)
      return existing ? JSON.parse(existing) : []
    } catch {
      return []
    }
  }

  const saveCart = (cart: any[]) => {
    const cartKey = activeUserId ? `teras_cart_${activeUserId}` : 'teras_cart'
    localStorage.setItem(cartKey, JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
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
    goeyToast.success(`Berhasil menambahkan ${qty}x ${product.title} ke keranjang!`)
    setTimeout(() => setAdded(false), 2500)
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

  const handleShareWhatsApp = () => {
    if (typeof window === 'undefined') return
    const currentUrl = window.location.href
    const text = encodeURIComponent(`Beli ${product.title} seharga Rp ${product.price.toLocaleString('id-ID')} di Saloka.id: ${currentUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    goeyToast.success('Link produk berhasil disalin ke clipboard!')
    setTimeout(() => setCopiedLink(false), 3000)
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector & Subtotal preview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">Atur Jumlah:</span>
          <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
            <button
              onClick={() => handleQtyChange(qty - 1)}
              disabled={qty <= 1 || product.stock <= 0}
              className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              title="Kurang"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              value={qty}
              onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
              className="w-12 text-center text-xs font-black text-slate-900 border-none outline-none"
            />
            <button
              onClick={() => handleQtyChange(qty + 1)}
              disabled={qty >= product.stock || product.stock <= 0}
              className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              title="Tambah"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Subtotal Produk</span>
          <span className="text-base font-black text-slate-900 font-mono">
            Rp {(product.price * qty).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Main Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className="w-full py-3.5 bg-white hover:bg-emerald-50 text-[#006E24] border-2 border-[#006E24] rounded-xl font-extrabold text-xs transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {added ? <Check size={16} strokeWidth={3} /> : <ShoppingCart size={16} />}
          <span>{added ? 'Ditambahkan!' : '+ Keranjang'}</span>
        </button>

        <button
          onClick={handleBuyNow}
          disabled={product.stock <= 0}
          className="w-full py-3.5 bg-[#006E24] hover:bg-[#084e1b] text-white rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Zap size={16} className="fill-amber-300 text-amber-300" />
          <span>Beli Sekarang</span>
        </button>
      </div>

      {/* Social Share & Copy Link */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="text-slate-500 font-medium">Bagikan Produk:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#006E24] font-bold rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <MessageCircle size={13} />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? <Check size={13} className="text-[#006E24]" /> : <Copy size={13} />}
            <span>{copiedLink ? 'Tersalin' : 'Salin Link'}</span>
          </button>
        </div>
      </div>

      {/* ── STICKY MOBILE BOTTOM ACTION BAR ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-3 shadow-2xl flex items-center gap-2">
        <button
          onClick={handleShareWhatsApp}
          className="p-3 bg-emerald-50 text-[#006E24] border border-emerald-200 rounded-xl flex items-center justify-center shrink-0"
          title="Chat WhatsApp"
        >
          <MessageCircle size={18} />
        </button>
        <button
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className="flex-1 py-3 bg-white text-[#006E24] border-2 border-[#006E24] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5"
        >
          <ShoppingCart size={15} />
          <span>+ Keranjang</span>
        </button>
        <button
          onClick={handleBuyNow}
          disabled={product.stock <= 0}
          className="flex-1 py-3 bg-[#006E24] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
        >
          <Zap size={15} className="fill-amber-300 text-amber-300" />
          <span>Beli Sekarang</span>
        </button>
      </div>
    </div>
  )
}
