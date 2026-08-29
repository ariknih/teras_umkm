'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CartButton({ userId, communityId }: { userId?: string; communityId?: string }) {
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      try {
        const cartKey = userId 
          ? (communityId ? `teras_cart_${userId}_${communityId}` : `teras_cart_${userId}`) 
          : 'teras_cart'
        const storedCart = localStorage.getItem(cartKey)
        let count = 0
        if (storedCart) {
          const cart = JSON.parse(storedCart)
          count = cart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
        }

        const storedSnackbox = localStorage.getItem('saloka_snackbox_cart_v1')
        if (storedSnackbox) {
          const snackboxCart = JSON.parse(storedSnackbox)
          if (snackboxCart?.items?.length > 0) count += 1
        }

        setItemCount(count)
      } catch (e) {
        console.error('Failed to read cart count', e)
      }
    }

    updateCount()

    // Listen to changes across tabs & local custom events
    window.addEventListener('storage', updateCount)
    window.addEventListener('cart-updated', updateCount)
    window.addEventListener('focus', updateCount)

    // Relaxed fallback sync every 15 seconds
    const interval = setInterval(updateCount, 15000)

    return () => {
      window.removeEventListener('storage', updateCount)
      window.removeEventListener('cart-updated', updateCount)
      window.removeEventListener('focus', updateCount)
      clearInterval(interval)
    }
  }, [userId, communityId])

  return (
    <Link
      href={communityId ? `/cart?communityId=${communityId}` : '/cart'}
      aria-label="Keranjang Belanja"
      className="relative w-8 h-8 rounded-full border border-outline-variant/15 hover:border-primary bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-text-secondary hover:text-primary transition-all duration-300 cursor-pointer shadow-sm outline-none group"
      id="global-cart-button"
      title="Keranjang Belanja"
    >
      <img
        src="/images/cart icon.svg"
        alt="Keranjang Belanja"
        className="w-4 h-4 object-contain group-hover:scale-110 transition-transform duration-300"
      />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-white rounded-full font-black text-[10px] flex items-center justify-center border-2 border-white">
          {itemCount}
        </span>
      )}
    </Link>
  )
}
