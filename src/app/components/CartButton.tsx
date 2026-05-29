'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CartButton() {
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      try {
        const storedCart = localStorage.getItem('teras_cart')
        if (storedCart) {
          const cart = JSON.parse(storedCart)
          const count = cart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
          setItemCount(count)
        } else {
          setItemCount(0)
        }
      } catch (e) {
        console.error('Failed to read cart count', e)
      }
    }

    updateCount()

    // Listen to changes across tabs
    window.addEventListener('storage', updateCount)
    
    // Poll to keep count in sync when doing same-tab routing
    const interval = setInterval(updateCount, 1000)

    return () => {
      window.removeEventListener('storage', updateCount)
      clearInterval(interval)
    }
  }, [])

  return (
    <Link
      href="/cart"
      className="relative p-2.5 rounded-lg border border-outline-variant/60 hover:bg-surface-container-low transition-colors flex items-center justify-center text-on-surface hover:text-primary group"
      id="global-cart-button"
      title="Keranjang Belanja"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-primary-container text-on-surface font-geist font-bold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-white animate-pulse">
          {itemCount}
        </span>
      )}
    </Link>
  )
}
