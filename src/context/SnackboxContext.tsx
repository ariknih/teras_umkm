'use client'

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import {
  Kelurahan,
  SnackboxProduct,
  SnackboxCartItem,
  BoxType,
  SnackboxCart,
  CheckoutSummary
} from '@/types/snackbox'
import { mockKelurahans, defaultKelurahan } from '@/lib/mock-snackbox'

interface SnackboxContextValue {
  kelurahan: Kelurahan
  setKelurahan: (kel: Kelurahan) => void
  isKelurahanModalOpen: boolean
  setIsKelurahanModalOpen: (open: boolean) => void
  
  cart: SnackboxCart
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  
  addItem: (product: SnackboxProduct, qty?: number) => void
  removeItem: (productId: string) => void
  updateItemQty: (productId: string, qty: number) => void
  toggleItemSelection: (productId: string) => void
  selectAllItems: (select: boolean) => void
  setBoxType: (type: BoxType) => void
  setBoxCount: (count: number) => void
  clearCart: () => void
  
  totalItemTypesCount: number
  totalPiecesCount: number
  summary: CheckoutSummary
  deliveryFee: number
  setDeliveryFee: (fee: number) => void
  isInsuranceSelected: boolean
  setIsInsuranceSelected: (selected: boolean) => void
  promoCode: string
  setPromoCode: (code: string) => void
  discountAmount: number
  applyPromo: (code: string) => { success: boolean; message: string }
}

const SnackboxContext = createContext<SnackboxContextValue | undefined>(undefined)

const CART_STORAGE_KEY = 'saloka_snackbox_cart_v1'
const KELURAHAN_STORAGE_KEY = 'saloka_snackbox_kelurahan_v1'

export function SnackboxProvider({ children }: { children: ReactNode }) {
  const [kelurahan, setKelurahanState] = useState<Kelurahan>(defaultKelurahan)
  const [isKelurahanModalOpen, setIsKelurahanModalOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const [cart, setCart] = useState<SnackboxCart>({
    items: [],
    boxType: 'reguler',
    boxCount: 1,
    kelurahanId: defaultKelurahan.id,
    kelurahanName: defaultKelurahan.name
  })

  const [deliveryFee, setDeliveryFee] = useState(15000)
  const [isInsuranceSelected, setIsInsuranceSelected] = useState(true)
  const [promoCode, setPromoCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)

  // 1. Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const savedKel = localStorage.getItem(KELURAHAN_STORAGE_KEY)
      if (savedKel) {
        const parsed = JSON.parse(savedKel)
        setKelurahanState(parsed)
      }

      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        setCart(parsedCart)
      }
    } catch (e) {
      console.warn('Failed to load snackbox storage:', e)
    }
  }, [])

  // 2. Persist cart changes
  const saveCartToStorage = (newCart: SnackboxCart) => {
    setCart(newCart)
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart))
    } catch (e) {}
  }

  // 3. Set Kelurahan and sync with cart
  const setKelurahan = (newKel: Kelurahan) => {
    setKelurahanState(newKel)
    try {
      localStorage.setItem(KELURAHAN_STORAGE_KEY, JSON.stringify(newKel))
    } catch (e) {}
    
    // If cart has items from different kelurahan, we can update metadata
    saveCartToStorage({
      ...cart,
      kelurahanId: newKel.id,
      kelurahanName: newKel.name
    })
  }

  // 4. Cart Operations
  const addItem = (product: SnackboxProduct, qty = 1) => {
    const existingIndex = cart.items.findIndex(item => item.product.id === product.id)
    let updatedItems: SnackboxCartItem[] = []

    if (existingIndex > -1) {
      updatedItems = cart.items.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + qty, selected: true }
          : item
      )
    } else {
      updatedItems = [
        ...cart.items,
        {
          product,
          quantity: qty,
          selected: true
        }
      ]
    }

    saveCartToStorage({
      ...cart,
      items: updatedItems
    })
    setIsCartOpen(true)
  }

  const removeItem = (productId: string) => {
    const updatedItems = cart.items.filter(item => item.product.id !== productId)
    saveCartToStorage({
      ...cart,
      items: updatedItems
    })
  }

  const updateItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId)
      return
    }

    const updatedItems = cart.items.map(item =>
      item.product.id === productId
        ? { ...item, quantity: qty }
        : item
    )

    saveCartToStorage({
      ...cart,
      items: updatedItems
    })
  }

  const toggleItemSelection = (productId: string) => {
    const updatedItems = cart.items.map(item =>
      item.product.id === productId
        ? { ...item, selected: !item.selected }
        : item
    )
    saveCartToStorage({
      ...cart,
      items: updatedItems
    })
  }

  const selectAllItems = (select: boolean) => {
    const updatedItems = cart.items.map(item => ({
      ...item,
      selected: select
    }))
    saveCartToStorage({
      ...cart,
      items: updatedItems
    })
  }

  const setBoxType = (type: BoxType) => {
    saveCartToStorage({
      ...cart,
      boxType: type
    })
  }

  const setBoxCount = (count: number) => {
    const safeCount = Math.max(1, count)
    saveCartToStorage({
      ...cart,
      boxCount: safeCount
    })
  }

  const clearCart = () => {
    saveCartToStorage({
      items: [],
      boxType: 'reguler',
      boxCount: 1,
      kelurahanId: kelurahan.id,
      kelurahanName: kelurahan.name
    })
  }

  // 5. Promo Code Handler
  const applyPromo = (code: string) => {
    const trimmed = code.trim().toUpperCase()
    if (trimmed === 'SALOKASNACK' || trimmed === 'SNACKBOXHEMAT') {
      const discount = 15000
      setDiscountAmount(discount)
      return { success: true, message: `Voucher diskon Rp ${discount.toLocaleString('id-ID')} berhasil dipasang!` }
    } else if (trimmed === 'GRATISONGKIR') {
      const discount = deliveryFee
      setDiscountAmount(discount)
      return { success: true, message: 'Voucher Gratis Ongkir berhasil dipasang!' }
    } else {
      setDiscountAmount(0)
      return { success: false, message: 'Kode promo tidak valid atau telah kedaluwarsa.' }
    }
  }

  // 6. Real-time Summary Calculations
  const selectedItems = useMemo(() => {
    return cart.items.filter(item => item.selected)
  }, [cart.items])

  const totalItemTypesCount = useMemo(() => {
    return selectedItems.length
  }, [selectedItems])

  const totalPiecesCount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [selectedItems])

  const summary: CheckoutSummary = useMemo(() => {
    // Subtotal per box = total harga kue yang dipilih di dalam 1 box
    const subtotalPerBox = selectedItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)

    const totalItemsPerBox = totalPiecesCount
    const boxCount = cart.boxCount || 1

    // Subtotal kotor seluruh box
    const subtotalGross = subtotalPerBox * boxCount

    const insuranceFee = isInsuranceSelected && selectedItems.length > 0 ? 2000 : 0
    const serviceFee = selectedItems.length > 0 ? 1000 : 0
    const actualDelivery = selectedItems.length > 0 ? deliveryFee : 0

    const totalBill = Math.max(0, subtotalGross + actualDelivery + insuranceFee + serviceFee - discountAmount)

    return {
      subtotalPerBox,
      totalItemsPerBox,
      boxCount,
      subtotalGross,
      deliveryFee: actualDelivery,
      insuranceFee,
      serviceFee,
      discountAmount,
      totalBill
    }
  }, [selectedItems, totalPiecesCount, cart.boxCount, deliveryFee, isInsuranceSelected, discountAmount])

  return (
    <SnackboxContext.Provider
      value={{
        kelurahan,
        setKelurahan,
        isKelurahanModalOpen,
        setIsKelurahanModalOpen,
        cart,
        isCartOpen,
        setIsCartOpen,
        addItem,
        removeItem,
        updateItemQty,
        toggleItemSelection,
        selectAllItems,
        setBoxType,
        setBoxCount,
        clearCart,
        totalItemTypesCount,
        totalPiecesCount,
        summary,
        deliveryFee,
        setDeliveryFee,
        isInsuranceSelected,
        setIsInsuranceSelected,
        promoCode,
        setPromoCode,
        discountAmount,
        applyPromo
      }}
    >
      {children}
    </SnackboxContext.Provider>
  )
}

export function useSnackbox() {
  const context = useContext(SnackboxContext)
  if (!context) {
    throw new Error('useSnackbox must be used within a SnackboxProvider')
  }
  return context
}
