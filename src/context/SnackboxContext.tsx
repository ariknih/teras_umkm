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
import { calculateDistance } from '@/lib/utils'

interface SnackboxContextValue {
  kelurahan: Kelurahan
  setKelurahan: (kel: Kelurahan) => void
  isKelurahanModalOpen: boolean
  setIsKelurahanModalOpen: (open: boolean) => void
  isDetectingLocation: boolean
  locationSource: 'gps' | 'ip' | 'manual' | 'saved'
  detectLocation: () => Promise<Kelurahan | null>
  
  cart: SnackboxCart
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  cartBumpTick: number

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
const LOCATION_META_STORAGE_KEY = 'saloka_snackbox_location_meta_v1'
// ponytail: kelurahan boundaries aren't modeled, so "still the same location" is a flat-radius
// guess rather than a real polygon check — fine for deciding whether to re-detect, not for
// precise geofencing. Upgrade to real kelurahan boundary polygons if that precision matters later.
const SAME_LOCATION_RADIUS_KM = 1.5

type LocationMeta = {
  source: 'gps' | 'ip' | 'manual'
  coords: { latitude: number; longitude: number } | null
}

export function SnackboxProvider({ children }: { children: ReactNode }) {
  const [kelurahan, setKelurahanState] = useState<Kelurahan>(defaultKelurahan)
  const [isKelurahanModalOpen, setIsKelurahanModalOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartBumpTick, setCartBumpTick] = useState(0)

  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationSource, setLocationSource] = useState<'gps' | 'ip' | 'manual' | 'saved'>('saved')

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

  const persistLocationMeta = (meta: LocationMeta) => {
    try {
      localStorage.setItem(LOCATION_META_STORAGE_KEY, JSON.stringify(meta))
    } catch (e) {}
  }

  // 1. Set Kelurahan and sync with cart & localStorage
  // Manual selection (e.g. the switcher modal) — auto-detection re-checks are skipped for
  // this until the user is detected somewhere else, since they picked this on purpose.
  const setKelurahan = (newKel: Kelurahan) => {
    setKelurahanState(newKel)
    try {
      localStorage.setItem(KELURAHAN_STORAGE_KEY, JSON.stringify(newKel))
    } catch (e) {}
    persistLocationMeta({ source: 'manual', coords: null })

    setCart((prevCart) => {
      const updated = {
        ...prevCart,
        kelurahanId: newKel.id,
        kelurahanName: newKel.name
      }
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated))
        window.dispatchEvent(new Event('storage'))
      } catch (e) {}
      return updated
    })
  }

  // 2. Automated Location Detection — GPS first (most accurate), IP only as a fallback
  // when GPS is denied, unavailable, or times out.
  const detectLocation = async (): Promise<Kelurahan | null> => {
    setIsDetectingLocation(true)
    try {
      // Step A: Ask for GPS permission up front.
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        const gpsResult = await new Promise<{ kel: Kelurahan; coords: { latitude: number; longitude: number } } | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                const { latitude, longitude } = pos.coords
                const revRes = await fetch(`/api/geolocation/reverse?lat=${latitude}&lng=${longitude}`)
                if (revRes.ok) {
                  const revJson = await revRes.json()
                  if (revJson.success && revJson.kelurahan) {
                    resolve({ kel: revJson.kelurahan as Kelurahan, coords: { latitude, longitude } })
                    return
                  }
                }
                resolve(null)
              } catch (err) {
                console.warn('GPS reverse geocode error:', err)
                resolve(null)
              }
            },
            (geoErr) => {
              console.log('GPS permission status:', geoErr.message)
              resolve(null)
            },
            { timeout: 8000, enableHighAccuracy: true }
          )
        })

        if (gpsResult) {
          setKelurahan(gpsResult.kel)
          setLocationSource('gps')
          persistLocationMeta({ source: 'gps', coords: gpsResult.coords })
          setIsDetectingLocation(false)
          return gpsResult.kel
        }
      }

      // Step B: GPS denied/unavailable/failed — fall back to IP geolocation.
      try {
        const ipRes = await fetch('/api/geolocation/detect')
        if (ipRes.ok) {
          const json = await ipRes.json()
          if (json.success && json.kelurahan) {
            const kel = json.kelurahan as Kelurahan
            setKelurahan(kel)
            setLocationSource('ip')
            persistLocationMeta({ source: 'ip', coords: json.coords || null })
            setIsDetectingLocation(false)
            return kel
          }
        }
      } catch (e) {
        console.warn('IP location detection error:', e)
      }

      setIsDetectingLocation(false)
      return null
    } catch (err) {
      console.error('Location detection failed:', err)
      setIsDetectingLocation(false)
      return null
    }
  }

  // 3. Hydrate from localStorage or trigger auto-detection on client mount
  useEffect(() => {
    let hasSavedKel = false
    try {
      const savedKel = localStorage.getItem(KELURAHAN_STORAGE_KEY)
      if (savedKel) {
        const parsed = JSON.parse(savedKel)
        // Accept any valid Kelurahan object from all of Indonesia
        if (parsed?.id && parsed?.name && (parsed?.kota || parsed?.province)) {
          setKelurahanState(parsed)
          hasSavedKel = true
        } else {
          localStorage.removeItem(KELURAHAN_STORAGE_KEY)
        }
      }

      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        setCart(parsedCart)
      }
    } catch (e) {
      console.warn('Failed to load snackbox storage:', e)
    }

    if (!hasSavedKel) {
      // No previous location saved — detect immediately via IP & GPS.
      detectLocation()
      return
    }

    // A location was saved. A manual pick sticks until the user is auto-detected
    // somewhere else — never silently override a deliberate choice.
    let meta: LocationMeta | null = null
    try {
      const savedMeta = localStorage.getItem(LOCATION_META_STORAGE_KEY)
      if (savedMeta) meta = JSON.parse(savedMeta)
    } catch (e) {}

    if (meta?.source === 'manual') return

    if (meta?.coords && typeof window !== 'undefined' && 'geolocation' in navigator) {
      // Cheap re-check: is the user still roughly where we last detected them?
      // Only re-run full detection (IP + GPS + reverse geocode) if they've moved.
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const dist = calculateDistance(
            pos.coords.latitude, pos.coords.longitude,
            meta!.coords!.latitude, meta!.coords!.longitude
          )
          if (dist > SAME_LOCATION_RADIUS_KM) detectLocation()
        },
        () => detectLocation(), // GPS denied/unavailable — can't confirm cheaply, just re-detect
        { timeout: 5000 }
      )
      return
    }

    // No coords on record (legacy saved value, or IP-only fallback with no coords) —
    // can't confirm "still the same" cheaply, so refresh once.
    detectLocation()
  }, [])

  // 4. Persist cart changes helper
  const saveCartToStorage = (newCart: SnackboxCart) => {
    setCart(newCart)
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart))
      window.dispatchEvent(new Event('storage'))
    } catch (e) {}
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
    setCartBumpTick(tick => tick + 1)
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
      boxType: type,
      boxCount: type === 'reguler' ? 1 : cart.boxCount
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
        isDetectingLocation,
        locationSource,
        detectLocation,
        cart,
        isCartOpen,
        setIsCartOpen,
        cartBumpTick,
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
