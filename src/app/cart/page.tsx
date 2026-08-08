'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { getProducts } from '@/app/actions/products'
import { checkoutCart, getWalletDetails, getActivePaymentMethods } from '@/app/actions/wallet-affiliate'
import { getCurrentUser, getCurrentUserProfile } from '@/app/actions/auth'
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api'

interface CartItem {
  productId: string
  quantity: number
}

interface ProductDetails {
  id: string
  title: string
  price: number
  category: string
  stock: number
  imageUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  merchantId?: string
  merchant?: {
    id: string
    name: string
    email: string
    role: string
    latitude?: number | null
    longitude?: number | null
  } | null
}

interface CourierRate {
  courier_code: string;
  courier_name: string;
  price: number;
  etd: string;
}

interface SavedAddress {
  id: string
  name: string
  phone: string
  label: string // 'Utama', 'Rumah', 'Kantor'
  addressText: string
  latitude: number
  longitude: number
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [products, setProducts] = useState<ProductDetails[]>([])
  const cartDetails = cart
    .map((item) => {
      const prod = products.find((p) => p.id === item.productId)
      return prod ? { ...prod, quantity: item.quantity } : null
    })
    .filter(Boolean) as Array<ProductDetails & { quantity: number }>

  const [viewMode, setViewMode] = useState<'cart' | 'checkout'>('cart')
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())

  const [affiliateId, setAffiliateId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentUserProfile, setCurrentUserProfileData] = useState<any>(null)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPendingCheckout, setIsPendingCheckout] = useState(false)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [manualOrderId, setManualOrderId] = useState<string>('')
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  // Shipping & Geolocation
  const [useGps, setUseGps] = useState(false)
  const [buyerCoords, setBuyerCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [selectedCourier, setSelectedCourier] = useState<string>('jne')
  const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY')
  const [shippingAddress, setShippingAddress] = useState('')
  const [shippingDistKm, setShippingDistKm] = useState(0)
  const [courierRates, setCourierRates] = useState<CourierRate[]>([])
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false)
  const [shippingSource, setShippingSource] = useState<'komerce' | 'mock'>('mock')

  // Address Modals & Lists (Shopee-Style)
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr-default')
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showAddAddressModal, setShowAddAddressModal] = useState(false)

  // Add Address Form State
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formProvinceCity, setFormProvinceCity] = useState('')
  const [formStreetName, setFormStreetName] = useState('')
  const [formDetails, setFormDetails] = useState('')
  const [formLabel, setFormLabel] = useState<'Rumah' | 'Kantor'>('Rumah')
  const [formCoords, setFormCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [addressSearchQuery, setAddressSearchQuery] = useState('')

  // Fallback mock cities
  const mockCities: Record<string, { name: string, lat: number, lng: number }> = {
    jakarta: { name: 'Jakarta (Pusat)', lat: -6.2088, lng: 106.8456 },
    bandung: { name: 'Bandung (Jawa Barat)', lat: -6.9175, lng: 106.6191 },
    surabaya: { name: 'Surabaya (Jawa Timur)', lat: -7.2575, lng: 112.7521 },
    medan: { name: 'Medan (Sumatera Utara)', lat: 3.5952, lng: 98.6722 },
    makassar: { name: 'Makassar (Sulawesi Selatan)', lat: -5.1477, lng: 119.4327 }
  }
  const [selectedMockCity, setSelectedMockCity] = useState('jakarta')

  // Coupons
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null)

  // Coins redemption
  const [useCoins, setUseCoins] = useState(false)

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'MIDTRANS' | 'WALLET' | 'COD' | 'MANUAL'>('MIDTRANS')
  const [activePaymentSubId, setActivePaymentSubId] = useState<string>('MIDTRANS_QRIS')
  const [dynamicPaymentMethods, setDynamicPaymentMethods] = useState<any[]>([])

  // Google Maps state
  const [map, setMap] = useState<any>(null)
  const [distanceText, setDistanceText] = useState('')
  const [durationText, setDurationText] = useState('')

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: ['places']
  })

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const pms = await getActivePaymentMethods()
        setDynamicPaymentMethods(pms)
      } catch (e) {
        console.error(e)
      }
    }
    fetchPayments()
  }, [])

  // Get seller coordinates
  const getSellerCoords = () => {
    if (cartDetails.length > 0) {
      const lat = cartDetails[0].latitude ?? cartDetails[0].merchant?.latitude ?? -6.2088;
      const lng = cartDetails[0].longitude ?? cartDetails[0].merchant?.longitude ?? 106.8456;
      return { lat, lng };
    }
    return { lat: -6.2088, lng: 106.8456 };
  };

  const getBuyerCoordsObj = () => {
    if (formCoords) return { lat: formCoords.latitude, lng: formCoords.longitude }
    return {
      lat: buyerCoords ? buyerCoords.latitude : mockCities[selectedMockCity].lat,
      lng: buyerCoords ? buyerCoords.longitude : mockCities[selectedMockCity].lng
    };
  };

  const updateCourierRates = (distKm: number) => {
    const totalWeight = cartDetails.reduce((sum, item) => sum + item.quantity * 1000, 0);
    const weightKg = Math.max(1, Math.ceil(totalWeight / 1000));
    const couriers = [
      { code: 'jne',     name: 'JNE REG',       ratePerKm: 40, baseFee: 15000, minFee: 9000,  speedFactor: 0 },
      { code: 'jnt',     name: 'J&T Express',   ratePerKm: 45, baseFee: 16000, minFee: 9000,  speedFactor: -1 },
      { code: 'sicepat', name: 'SiCepat REG',   ratePerKm: 50, baseFee: 18000, minFee: 10000, speedFactor: -1 },
      { code: 'tiki',    name: 'TIKI REG',       ratePerKm: 35, baseFee: 14000, minFee: 9000,  speedFactor: 1 },
      { code: 'pos',     name: 'POS Indonesia', ratePerKm: 30, baseFee: 12000, minFee: 8000,  speedFactor: 2 },
    ];
    const getEtd = (km: number, shift: number): string => {
      let minD: number, maxD: number;
      if (km < 50)       { minD = 1; maxD = 2; }
      else if (km < 200) { minD = 2; maxD = 3; }
      else if (km < 800) { minD = 3; maxD = 5; }
      else               { minD = 5; maxD = 7; }
      minD = Math.max(1, minD + shift);
      maxD = Math.max(minD + 1, maxD + shift);
      return `${minD}-${maxD} hari`;
    };
    const rates = couriers.map((c) => {
      const costPerKg = c.baseFee + Math.round(distKm * c.ratePerKm / 100) * 100;
      const price = Math.max(c.minFee, costPerKg * weightKg);
      return { courier_code: c.code, courier_name: c.name, price, etd: getEtd(distKm, c.speedFactor) };
    });
    setCourierRates(rates);
    if (!selectedCourier || !rates.some(r => r.courier_code === selectedCourier)) {
      setSelectedCourier(rates[0].courier_code);
    }
  };

  // Recalculate distance & courier rates whenever buyer coordinates change
  useEffect(() => {
    if (cartDetails.length === 0 || !buyerCoords) return;
    const seller = getSellerCoords();
    const dist = getDistance(buyerCoords.latitude, buyerCoords.longitude, seller.lat, seller.lng);
    setShippingDistKm(dist);
    setDistanceText(`${dist.toFixed(1)} km`);
    setDurationText(dist < 50 ? '< 1 jam' : dist < 200 ? '2–4 jam' : dist < 800 ? '1–2 hari' : '2–3 hari');
    updateCourierRates(dist);
    
    // Reverse Geocode
    if (window.google && apiKey && (!shippingAddress || shippingAddress.startsWith('Lokasi Terdaftar'))) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: buyerCoords.latitude, lng: buyerCoords.longitude } }, (results, status) => {
        if (status === 'OK' && results?.[0]) setShippingAddress(results[0].formatted_address);
      });
    }
  }, [buyerCoords, cartDetails.length]);

  const handleMarkerDragEnd = (e: any) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (showAddAddressModal) {
        setFormCoords({ latitude: lat, longitude: lng })
      } else {
        setBuyerCoords({ latitude: lat, longitude: lng });
        setUseGps(true);
      }
    }
  };

  const handleGeocodeSearch = () => {
    if (!addressSearchQuery.trim()) return;
    if (window.google && apiKey) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: addressSearchQuery }, (results, status) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          const coords = { latitude: loc.lat(), longitude: loc.lng() };
          if (showAddAddressModal) {
            setFormCoords(coords)
          } else {
            setBuyerCoords(coords);
            setUseGps(true);
            setShippingAddress(results[0].formatted_address);
          }
          if (map) {
            map.panTo(loc);
            map.setZoom(14);
          }
        } else {
          setError('Alamat tidak ditemukan.');
        }
      });
    } else {
      const query = addressSearchQuery.toLowerCase();
      const match = Object.keys(mockCities).find(key => query.includes(key));
      if (match) {
        const city = mockCities[match];
        const coords = { latitude: city.lat, longitude: city.lng }
        if (showAddAddressModal) {
          setFormCoords(coords)
        } else {
          setBuyerCoords(coords);
          setUseGps(true);
          setShippingAddress(city.name);
        }
      } else {
        setError('Alamat tidak ditemukan (Mode Fallback). Coba: Bandung, Surabaya, Medan, Makassar.');
      }
    }
  };

  const handleRequestGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
          if (showAddAddressModal) {
            setFormCoords(coords)
          } else {
            setBuyerCoords(coords)
            setUseGps(true)
          }
          setSuccessMessage('Sukses mengambil lokasi GPS browser!')
          setTimeout(() => setSuccessMessage(null), 3000)
          fetchCourierRates(null, null, coords.latitude, coords.longitude)
        },
        (err) => {
          console.error(err)
          setError('Gagal mengambil GPS browser. Menggunakan mock lokasi.')
          setUseGps(false)
        }
      )
    } else {
      setError('Browser tidak mendukung Geolocation.')
    }
  }

  // Search destination via Komerce API
  const handleDestinationSearch = async (keyword: string) => {
    setDestinationSearch(keyword)
    if (keyword.trim().length < 2) {
      setDestinationResults([])
      return
    }
    setIsSearchingDest(true)
    try {
      const res = await fetch(`/api/shipping/destination?keyword=${encodeURIComponent(keyword.trim())}`)
      const data = await res.json()
      setDestinationResults(data.data || [])
    } catch (e) {
      setDestinationResults([])
    } finally {
      setIsSearchingDest(false)
    }
  }
  const [destinationSearch, setDestinationSearch] = useState('')
  const [destinationResults, setDestinationResults] = useState<{id: string; label: string}[]>([])
  const [isSearchingDest, setIsSearchingDest] = useState(false)

  const handleSelectDestination = (dest: {id: string; label: string}) => {
    setDestinationSearch(dest.label)
    setDestinationResults([])
    const productLat = cartDetails.length > 0 ? (cartDetails[0].latitude ?? -6.2088) : -6.2088
    const productLng = cartDetails.length > 0 ? (cartDetails[0].longitude ?? 106.8456) : 106.8456
    fetchCourierRates(dest.id, productLat + ',' + productLng, null, null)
  }

  const fetchCourierRates = async (
    receiverDestId: string | null,
    shipperPin: string | null,
    receiverLat: number | null,
    receiverLng: number | null
  ) => {
    setIsCalculatingShipping(true)
    setError(null)
    try {
      let shipperLat = -6.2088
      let shipperLng = 106.8456
      if (cartDetails.length > 0) {
        const lats = cartDetails.map(p => p.latitude ?? -6.2088)
        const lngs = cartDetails.map(p => p.longitude ?? 106.8456)
        shipperLat = lats.reduce((a, b) => a + b, 0) / lats.length
        shipperLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
      }

      const bLat = receiverLat ?? (buyerCoords ? buyerCoords.latitude : mockCities[selectedMockCity].lat)
      const bLng = receiverLng ?? (buyerCoords ? buyerCoords.longitude : mockCities[selectedMockCity].lng)
      const totalWeight = cartDetails.reduce((sum, item) => sum + item.quantity * 1000, 0)

      const params = new URLSearchParams({
        shipper_lat: String(shipperLat),
        shipper_lng: String(shipperLng),
        receiver_lat: String(bLat),
        receiver_lng: String(bLng),
        weight: String(totalWeight),
        item_value: String(subtotal),
      })

      if (receiverDestId) params.set('receiver_dest_id', receiverDestId)

      const res = await fetch(`/api/shipping/calculate?${params.toString()}`)
      const data = await res.json()

      if (data.data && data.data.length > 0) {
        setCourierRates(data.data)
        setShippingSource(data.source === 'komerce' ? 'komerce' : 'mock')
        setShippingDistKm(data.distance_km || 0)
        if (!selectedCourier || !data.data.find((r: CourierRate) => r.courier_code === selectedCourier)) {
          setSelectedCourier(data.data[0].courier_code)
        }
      }
    } catch (err: any) {
      console.error('Fetch courier rates error:', err)
    } finally {
      setIsCalculatingShipping(false)
    }
  }

  // Load cart, affiliate, wallet, and address list data
  useEffect(() => {
    async function loadData() {
      try {
        const u = await getCurrentUser()
        setCurrentUser(u)
        
        const cartKey = u?.id ? `teras_cart_${u.id}` : 'teras_cart'
        const storedCart = localStorage.getItem(cartKey)
        const storedAff = localStorage.getItem('teras_affiliate_id')
        if (storedCart) {
          try {
            setCart(JSON.parse(storedCart))
          } catch (e) {}
        }
        if (storedAff) {
          setAffiliateId(storedAff)
        }
        
        const list = await getProducts()
        setProducts(list as any)

        const profile = await getCurrentUserProfile()
        if (profile) {
          setCurrentUserProfileData(profile)
          const profileCoords = { 
            latitude: profile.latitude || -6.2088, 
            longitude: profile.longitude || 106.8456 
          }
          setBuyerCoords(profileCoords)
          setUseGps(true)

          const defaultAddrString = profile.landingPageConfig
            ? JSON.parse(profile.landingPageConfig).detailAddress || ''
            : 'Jalan Turangga No. 37, Lkr. Sel, KOTA BANDUNG, JAWA BARAT, ID 40263'
          
          setShippingAddress(defaultAddrString)

          // Load Saved Addresses from localStorage
          const localAddrKey = `teras_addresses_${profile.id}`
          const storedAddr = localStorage.getItem(localAddrKey)
          let addrList: SavedAddress[] = []
          
          if (storedAddr) {
            try {
              addrList = JSON.parse(storedAddr)
            } catch (e) {}
          }

          if (addrList.length === 0) {
            addrList = [{
              id: 'addr-default',
              name: profile.name,
              phone: profile.landingPageConfig ? JSON.parse(profile.landingPageConfig).phone || '08123456789' : '08123456789',
              label: 'Utama',
              addressText: defaultAddrString,
              latitude: profileCoords.latitude,
              longitude: profileCoords.longitude
            }]
            localStorage.setItem(localAddrKey, JSON.stringify(addrList))
          }

          setAddresses(addrList)
        }

        const wallet = await getWalletDetails()
        if (wallet) {
          setWalletBalance(wallet.balance)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Auto-calculate courier rates once cart items are loaded
  useEffect(() => {
    if (cartDetails.length > 0 && courierRates.length === 0 && buyerCoords) {
      const seller = getSellerCoords();
      const dist = getDistance(buyerCoords.latitude, buyerCoords.longitude, seller.lat, seller.lng);
      setShippingDistKm(dist);
      updateCourierRates(dist);
    }
  }, [cartDetails.length, buyerCoords])

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart)
    const cartKey = currentUser?.id ? `teras_cart_${currentUser.id}` : 'teras_cart'
    localStorage.setItem(cartKey, JSON.stringify(newCart))
  }

  const handleUpdateQuantity = (productId: string, newQty: number, maxStock: number) => {
    if (newQty < 1) return
    if (newQty > maxStock) {
      setError(`Maksimal stok tersedia adalah ${maxStock}`)
      return
    }
    setError(null)
    const updated = cart.map((item) => {
      if (item.productId === productId) {
        return { ...item, quantity: newQty }
      }
      return item
    })
    saveCart(updated)
  }

  const handleRemoveItem = (productId: string) => {
    const updated = cart.filter((item) => item.productId !== productId)
    saveCart(updated)
  }

  const verifyCheckout = async (orderId: string, simulate: boolean = false) => {
    setIsVerifying(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const res = await fetch('/api/midtrans/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, simulate }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal memverifikasi checkout.')
      }

      if (data.processed) {
        const cartKey = currentUser?.id ? `teras_cart_${currentUser.id}` : 'teras_cart'
        localStorage.removeItem(cartKey)
        localStorage.removeItem('teras_affiliate_id')
        setCart([])
        setAffiliateId('')
        setPendingOrderId(null)
        router.push(`/orders/${orderId}`)
      } else {
        setError(data.message || 'Transaksi belum dibayar atau status pending.')
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi status pembayaran.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleApplyCoupon = (code: string) => {
    setCouponError(null)
    setCouponSuccess(null)
    const cleaned = code.toUpperCase().trim()

    if (cleaned === 'DISKON10') {
      const disc = subtotal * 0.1
      setCouponDiscount(disc)
      setCouponSuccess(`Kupon DISKON10 berhasil dipasang! Potongan Rp ${disc.toLocaleString('id-ID')}`)
    } else if (cleaned === 'SALOKA.ID') {
      const disc = Math.min(20000, subtotal)
      setCouponDiscount(disc)
      setCouponSuccess(`Kupon Saloka.id berhasil dipasang! Potongan Rp ${disc.toLocaleString('id-ID')}`)
    } else if (cleaned === 'GRATISONGKIR') {
      setCouponDiscount(shippingFee)
      setCouponSuccess(`Kupon GRATISONGKIR berhasil dipasang! Potongan Ongkir Rp ${shippingFee.toLocaleString('id-ID')}`)
    } else {
      setCouponError('Kode kupon tidak valid atau telah kedaluwarsa.')
      setCouponDiscount(0)
    }
  }

  // Address Functions (Shopee-Style)
  const selectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id)
    setBuyerCoords({ latitude: addr.latitude, longitude: addr.longitude })
    setShippingAddress(addr.addressText)
    setShowAddressModal(false)
  }

  const createNewAddress = () => {
    if (!formName || !formPhone || !formProvinceCity || !formStreetName) {
      setError('Harap lengkapi semua kolom alamat baru.')
      return
    }

    const localCoords = formCoords || buyerCoords || { latitude: -6.2088, longitude: 106.8456 }
    const fullText = `${formStreetName}, ${formDetails ? formDetails + ', ' : ''}${formProvinceCity}`
    
    const newAddr: SavedAddress = {
      id: `addr-${Date.now()}`,
      name: formName,
      phone: formPhone,
      label: formLabel,
      addressText: fullText,
      latitude: localCoords.latitude,
      longitude: localCoords.longitude
    }

    const localAddrKey = `teras_addresses_${currentUser?.id || 'guest'}`
    const updatedList = [...addresses, newAddr]
    
    setAddresses(updatedList)
    localStorage.setItem(localAddrKey, JSON.stringify(updatedList))
    
    // Set as active address
    setSelectedAddressId(newAddr.id)
    setBuyerCoords({ latitude: newAddr.latitude, longitude: newAddr.longitude })
    setShippingAddress(newAddr.addressText)

    // Clear form
    setFormName('')
    setFormPhone('')
    setFormProvinceCity('')
    setFormStreetName('')
    setFormDetails('')
    setFormCoords(null)
    
    setShowAddAddressModal(false)
    setShowAddressModal(false)
    setSuccessMessage('Alamat baru berhasil ditambahkan!')
    setTimeout(() => setSuccessMessage(null), 3500)
  }

  // Checkout Execution
  const handleCheckout = async () => {
    setError(null)
    setSuccessMessage(null)
    setIsPendingCheckout(true)

    // Build items payload
    const itemsPayload = cartDetails.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }))

    const merchantObj = cartDetails[0]?.merchant;
    let merchantAddress = '';
    if ((merchantObj as any)?.landingPageConfig) {
      try {
        const config = JSON.parse((merchantObj as any).landingPageConfig);
        merchantAddress = config.detailAddress || config.locationName || '';
      } catch (e) {}
    }
    if (!merchantAddress) merchantAddress = 'Alamat Toko UMKM';

    const shippingDetails = {
      shippingFee,
      courier: deliveryMethod === 'PICKUP' ? 'pickup' : selectedCourier,
      shippingAddress: deliveryMethod === 'PICKUP' ? `[PICKUP] Ambil di Toko: ${merchantAddress}` : shippingAddress,
      couponCode: couponSuccess ? couponCode : undefined,
      discountAmount: couponDiscount,
    }

    // Direct wallet checkout
    if (paymentMethod === 'WALLET') {
      try {
        const res = await checkoutCart(itemsPayload, affiliateId || undefined, 'WALLET', shippingDetails)
        if (res.error || !res.order) throw new Error(res.error || 'Gagal melakukan checkout via dompet.')
        
        // Success
        setSuccessMessage('Pembayaran dengan Saldo Dompet berhasil.')
        await verifyCheckout(res.order!.id, false)
        setIsPendingCheckout(false)
      } catch (err: any) {
        setError(err.message || 'Pembayaran gagal.')
        setIsPendingCheckout(false)
      }
      return
    }

    if (paymentMethod === 'MANUAL') {
      try {
        const res = await checkoutCart(itemsPayload, affiliateId || undefined, `MANUAL_${activePaymentSubId}`, {
          ...shippingDetails,
          bumpSales: `MANUAL_${activePaymentSubId}`
        })
        if (res.error) throw new Error(res.error)
        
        const cartKey = currentUser?.id ? `teras_cart_${currentUser.id}` : 'teras_cart'
        localStorage.removeItem(cartKey)
        localStorage.removeItem('teras_affiliate_id')
        setCart([])
        setAffiliateId('')
        router.push(`/orders/${res.order!.id}`)
        
        setIsPendingCheckout(false)
      } catch (err: any) {
        setError(err.message || 'Checkout gagal.')
        setIsPendingCheckout(false)
      }
      return
    }

    // Direct COD checkout (Simulation)
    if (paymentMethod === 'COD') {
      try {
        const res = await checkoutCart(itemsPayload, affiliateId || undefined, 'MIDTRANS', {
          ...shippingDetails,
          bumpSales: 'COD' // tag as COD
        })
        if (res.error || !res.order) throw new Error(res.error || 'Gagal melakukan checkout COD.')
        
        const cartKey = currentUser?.id ? `teras_cart_${currentUser.id}` : 'teras_cart'
        localStorage.removeItem(cartKey)
        localStorage.removeItem('teras_affiliate_id')
        setCart([])
        setAffiliateId('')
        router.push(`/orders/${res.order.id}`)
      } catch (err: any) {
        setError(err.message || 'Gagal melakukan checkout COD.')
        setIsPendingCheckout(false)
      }
      return
    }

    // Midtrans checkout
    try {
      const res = await fetch('/api/midtrans/snap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'checkout',
          items: itemsPayload,
          affiliateId: affiliateId || undefined,
          shippingDetails
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal memproses pembayaran.')
      }

      setPendingOrderId(data.orderId)

      const snap = (window as any).snap
      if (snap) {
        snap.pay(data.token, {
          onSuccess: async (result: any) => {
            setSuccessMessage('Pembayaran berhasil! Memverifikasi kas...')
            await verifyCheckout(result.order_id || data.orderId, false)
            setIsPendingCheckout(false)
          },
          onPending: (result: any) => {
            const ordId = result.order_id || data.orderId
            setPendingOrderId(ordId)
            const cartKey = currentUser?.id ? `teras_cart_${currentUser.id}` : 'teras_cart'
            localStorage.removeItem(cartKey)
            localStorage.removeItem('teras_affiliate_id')
            setCart([])
            setAffiliateId('')
            router.push(`/orders/${ordId}`)
          },
          onError: (result: any) => {
            setError('Terjadi kesalahan pada pembayaran Midtrans.')
            setIsPendingCheckout(false)
          },
          onClose: () => {
            setError(`Pembayaran belum selesai. Silakan selesaikan pembayaran atau coba lagi.`)
            setIsPendingCheckout(false)
          }
        })
      } else {
        setError(`Pembayaran sedang diproses. Jika sudah membayar, silakan tunggu beberapa saat.`)
        setIsPendingCheckout(false)
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung dengan Midtrans.')
      setIsPendingCheckout(false)
    }
  }

  // Calculations
  const getProductPriceWithWholesale = (basePrice: number, qty: number) => {
    if (qty >= 10) return basePrice * 0.80;
    if (qty >= 5) return basePrice * 0.90;
    if (qty >= 3) return basePrice * 0.95;
    return basePrice;
  };

  const subtotal = cartDetails.reduce((sum, item) => {
    const price = getProductPriceWithWholesale(item.price, item.quantity);
    return sum + price * item.quantity;
  }, 0);

  const selectedCourierRate = courierRates.find((r) => r.courier_code === selectedCourier);
  const shippingFee = deliveryMethod === 'PICKUP' ? 0 : (selectedCourierRate ? selectedCourierRate.price : 0);
  
  // Coin calculation (Redeem: 1 coin = Rp 1.500)
  const userCoins = currentUserProfile?.coinBalance || 0;
  const maxCoinsVal = userCoins * 1500;
  const coinRedemptionValue = useCoins ? Math.min(subtotal * 0.5, maxCoinsVal) : 0; // limit coin to max 50% subtotal
  const coinsRedeemed = coinRedemptionValue / 1500;

  const total = Math.max(0, subtotal + shippingFee - couponDiscount - coinRedemptionValue);

  // Check if cart contains user's own products
  const hasOwnProduct = currentUser && cartDetails.some(item => item.merchantId === currentUser.id);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#F5F7F9]">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 border-4 border-[#2DB24A]/20 border-t-[#2DB24A] rounded-full animate-spin mb-2" />
          <span className="text-xs font-bold text-[#2DB24A] tracking-widest uppercase">
            MEMUAT HALAMAN CHECKOUT...
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Ganti jadi</span>
          <span className="text-xs text-slate-400">↓</span>
          <span className="text-xs text-slate-700 font-semibold">
            Memuat keranjang belanjaan-mu
          </span>
        </div>
      </div>
    )
  }

  if (checkoutSuccess) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#F5F7F9] py-12 px-6">
        <div className="relative z-10 w-full max-w-md text-center border border-slate-100 bg-white shadow-xl p-8 rounded-3xl">
          <div className="w-16 h-16 bg-emerald-50 text-[#2DB24A] flex items-center justify-center mx-auto rounded-full mb-6 text-2xl font-bold">
            ✓
          </div>
          <h2 className="font-sora text-2xl font-bold text-slate-900 mb-3">Pesanan Berhasil dibuat!</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Pesanan Anda telah berhasil tercatat di sistem Saloka UMKM.
          </p>
          <div className="bg-slate-50 border border-slate-100 p-4 mb-8 rounded-2xl text-left text-xs text-slate-600 space-y-2">
            <div className="flex justify-between"><span>Poin Diperoleh (1%):</span><span className="text-[#2DB24A] font-bold">+{Math.round(total * 0.01)} Poin</span></div>
            <div className="flex justify-between"><span>Cashback Dompet (5%):</span><span className="text-[#2DB24A] font-bold">Rp {Math.round(total * 0.05).toLocaleString('id-ID')}</span></div>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/orders"
              className="py-3.5 bg-[#2DB24A] hover:bg-[#259a3f] text-white font-bold text-xs rounded-xl text-center transition-all shadow-md"
            >
              Lihat Detail Tagihan & Status Pesanan
            </Link>
            <Link
              href="/market"
              className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl text-center transition-colors"
            >
              Kembali Belanja
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="relative min-h-screen bg-[#F8F9FA] pt-6 pb-24 px-4 md:px-8 font-sans">
      
      <div className="relative z-10 max-w-[1160px] mx-auto space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2">
            ⚠️ <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2">
            ✓ <span>{successMessage}</span>
          </div>
        )}

        {cartDetails.length === 0 ? (
          /* EMPTY CART VIEW (Screenshot 2) */
          <div className="space-y-10">
            <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs max-w-lg mx-auto">
              <div className="w-20 h-20 bg-[#E8F7EC] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10 text-[#2DB24A]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-1">Keranjangmu kosong nih</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6 leading-relaxed">
                Yuk jelajahi produk-produk yang ada lalu tambahkan ke keranjang!
              </p>
              <Link
                href="/market"
                className="px-7 py-2.5 bg-[#2DB24A] hover:bg-[#259a3f] text-white font-bold text-xs rounded-full transition-colors shadow-xs inline-block cursor-pointer"
              >
                Cari produk lagi
              </Link>
            </div>

            {/* Rekomendasi produk untuk kamu */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">Rekomendasi produk untuk kamu</h3>
                <Link href="/market" className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1">
                  Pindah ke marketplace &gt;
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.slice(0, 8).map(prod => (
                  <Link key={prod.id} href={`/products/${prod.id}`} className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-[#2DB24A] transition-all group">
                    <div className="aspect-square bg-slate-50 relative overflow-hidden">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <h4 className="font-medium text-slate-800 text-xs line-clamp-2 group-hover:text-[#2DB24A] transition-colors">{prod.title}</h4>
                      <p className="font-bold text-slate-900 text-sm">Rp {prod.price.toLocaleString('id-ID')}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                        <span>⭐ 4.9</span>
                        <span>•</span>
                        <span>Bandung</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : viewMode === 'cart' ? (
          /* STAGE 1: KERANJANG BELANJAMU VIEW (Screenshot 3) */
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Keranjang Belanjamu</h1>
              <p className="text-xs text-slate-400 mt-0.5">Kamu punya {cartDetails.length} produk di keranjangmu</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Items */}
              <div className="lg:col-span-8 space-y-4">
                {/* Select all bar */}
                <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3 text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={selectedItemIds.size === cartDetails.length && cartDetails.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItemIds(new Set(cartDetails.map(i => i.id)))
                      } else {
                        setSelectedItemIds(new Set())
                      }
                    }}
                    className="w-4 h-4 text-[#2DB24A] accent-[#2DB24A] rounded cursor-pointer"
                  />
                  <span>Pilih semua barang ({cartDetails.length})</span>
                </div>

                {/* Items grouped by Merchant */}
                {(() => {
                  const groups: Record<string, typeof cartDetails> = {};
                  cartDetails.forEach(item => {
                    const mId = item.merchantId || 'unknown';
                    if (!groups[mId]) groups[mId] = [];
                    groups[mId].push(item);
                  });

                  return Object.entries(groups).map(([mId, items]) => {
                    const shopName = items[0]?.merchant?.name || 'Toko Bunga Abadi';
                    return (
                      <div key={mId} className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                          <input
                            type="checkbox"
                            checked={items.every(i => selectedItemIds.has(i.id))}
                            onChange={(e) => {
                              const next = new Set(selectedItemIds)
                              items.forEach(i => {
                                if (e.target.checked) next.add(i.id)
                                else next.delete(i.id)
                              })
                              setSelectedItemIds(next)
                            }}
                            className="w-4 h-4 text-[#2DB24A] accent-[#2DB24A] rounded cursor-pointer"
                          />
                          <span className="w-2 h-2 rounded-full bg-[#2DB24A]" />
                          <span className="font-bold text-xs text-slate-800">{shopName}</span>
                        </div>

                        <div className="space-y-4">
                          {items.map(item => {
                            const wholesalePrice = getProductPriceWithWholesale(item.price, item.quantity);
                            const isChecked = selectedItemIds.has(item.id) || selectedItemIds.size === 0;

                            return (
                              <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0 text-xs">
                                <div className="flex gap-3 items-center flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const next = new Set(selectedItemIds)
                                      if (e.target.checked) next.add(item.id)
                                      else next.delete(item.id)
                                      setSelectedItemIds(next)
                                    }}
                                    className="w-4 h-4 text-[#2DB24A] accent-[#2DB24A] rounded cursor-pointer"
                                  />
                                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shrink-0 relative">
                                    {item.imageUrl ? (
                                      <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xl bg-slate-100">📦</div>
                                    )}
                                  </div>
                                  <div className="space-y-0.5">
                                    <h4 className="font-bold text-slate-800 line-clamp-1 text-xs">{item.title}</h4>
                                    <p className="text-[11px] text-slate-400">Color: Oatmeal White</p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                  <div className="font-bold text-slate-900 text-xs">
                                    Rp {(wholesalePrice * item.quantity).toLocaleString('id-ID')}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(item.id)}
                                      className="text-slate-400 hover:text-red-500 text-xs font-medium cursor-pointer"
                                    >
                                      Hapus
                                    </button>
                                    <div className="inline-flex items-center border border-slate-200 rounded-md bg-slate-50 overflow-hidden">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.stock)}
                                        className="px-2.5 py-1 text-xs hover:bg-slate-200 font-bold text-slate-600 cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <span className="px-2.5 font-bold text-slate-800 text-xs">{item.quantity}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.stock)}
                                        className="px-2.5 py-1 text-xs hover:bg-slate-200 font-bold text-slate-600 cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Right Column: Ringkasan Belanja */}
              <div className="lg:col-span-4 space-y-4 sticky top-24">
                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="font-bold text-xs text-slate-900">Ringkasan Belanja</h3>

                  <div className="flex justify-between items-center text-xs text-slate-600 pt-1">
                    <span>Total</span>
                    <span className="font-extrabold text-slate-900 text-base">
                      Rp {subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewMode('checkout')}
                    className="w-full py-3 bg-[#2DB24A] hover:bg-[#259a3f] text-white font-bold text-xs rounded-xl transition-colors shadow-xs text-center cursor-pointer"
                  >
                    Beli ({cartDetails.length})
                  </button>

                  <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-4 text-center space-y-2.5 mt-4">
                    <p className="text-xs text-slate-700 font-medium">Masih ingin cari barang lainnya?</p>
                    <Link
                      href="/market"
                      className="block w-full py-2 bg-white border border-[#2DB24A] text-[#2DB24A] font-bold text-xs rounded-lg hover:bg-emerald-50 transition-colors text-center"
                    >
                      Lanjut belanja
                    </Link>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom section: Rekomendasi produk untuk kamu */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">Rekomendasi produk untuk kamu</h3>
                <Link href="/market" className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1">
                  Pindah ke marketplace &gt;
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.slice(0, 8).map(prod => (
                  <Link key={prod.id} href={`/products/${prod.id}`} className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-[#2DB24A] transition-all group">
                    <div className="aspect-square bg-slate-50 relative overflow-hidden">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <h4 className="font-medium text-slate-800 text-xs line-clamp-2 group-hover:text-[#2DB24A] transition-colors">{prod.title}</h4>
                      <p className="font-bold text-slate-900 text-sm">Rp {prod.price.toLocaleString('id-ID')}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                        <span>⭐ 4.9</span>
                        <span>•</span>
                        <span>Bandung</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* STAGE 2: CHECKOUT VIEW (Screenshot 4) */
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-1">Checkout</h1>
                <button
                  type="button"
                  onClick={() => setViewMode('cart')}
                  className="text-xs text-[#2DB24A] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  ← Kembali ke Keranjang Belanja
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (Address & Merchant Items) */}
              <div className="lg:col-span-8 space-y-4">

                {/* 1. Address Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Pengiriman</div>
                  {(() => {
                    const activeAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];
                    return activeAddress ? (
                      <div>
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className="px-2.5 py-0.5 bg-[#E8F7EC] text-[#2DB24A] font-bold text-[11px] rounded-full flex items-center gap-1">
                            📍 {activeAddress.label || 'Alamat 1'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowAddressModal(true)}
                            className="text-slate-400 font-medium text-xs hover:text-[#2DB24A] underline cursor-pointer"
                          >
                            Ganti Alamat
                          </button>
                        </div>
                        <p className="text-slate-600 text-xs font-normal leading-relaxed mt-1">
                          <strong className="text-slate-800 font-semibold">{activeAddress.name} ({activeAddress.phone})</strong> — {activeAddress.addressText}
                        </p>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Belum ada alamat pengiriman diatur.</span>
                        <button
                          type="button"
                          onClick={() => setShowAddAddressModal(true)}
                          className="text-[#2DB24A] hover:underline font-bold"
                        >
                          + Tambah Alamat
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Merchant Store Card & Items */}
                {(() => {
                  const groups: Record<string, typeof cartDetails> = {};
                  cartDetails.forEach(item => {
                    const mId = item.merchantId || 'unknown';
                    if (!groups[mId]) groups[mId] = [];
                    groups[mId].push(item);
                  });

                  return Object.entries(groups).map(([mId, items]) => {
                    const shopName = items[0]?.merchant?.name || '[Nama Merchant]';
                    return (
                      <div key={mId} className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="font-bold text-xs text-slate-800 border-b border-slate-100 pb-2">
                          {shopName}
                        </div>

                        <div className="space-y-3">
                          {items.map(item => {
                            const wholesalePrice = getProductPriceWithWholesale(item.price, item.quantity);
                            return (
                              <div key={item.id} className="flex items-center justify-between gap-4 pb-3 border-b border-slate-50 last:border-b-0 text-xs">
                                <div className="flex gap-3 items-center">
                                  <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shrink-0">
                                    {item.imageUrl ? (
                                      <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xl bg-slate-100">📦</div>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-xs">{item.title}</h4>
                                    <p className="text-[11px] text-slate-400">Color: Oatmeal White</p>
                                  </div>
                                </div>

                                <div className="text-right font-bold text-slate-900">
                                  <div>Rp {(wholesalePrice * item.quantity).toLocaleString('id-ID')}</div>
                                  <div className="text-[10px] text-slate-400 font-normal">{item.quantity}pcs x Rp{wholesalePrice.toLocaleString('id-ID')}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Shipping selector per merchant */}
                        <div className="pt-1 border-t border-slate-100 space-y-2">
                          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800">Ekonomi (Rp9.000)</span>
                              <span className="text-[11px] text-slate-400">Estimasi tiba 28 - 31 Jul</span>
                            </div>
                            <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer pt-1 border-t border-slate-200/40">
                              <input type="checkbox" defaultChecked className="w-3.5 h-3.5 text-[#2DB24A] accent-[#2DB24A] rounded" />
                              <span>Pakai Asuransi Pengiriman (Rp 2.000)</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}

              </div>

              {/* Right Column (Payment Method, Promo Code, Transaction Summary) */}
              <div className="lg:col-span-4 space-y-4 sticky top-24">
                
                {/* 1. Metode Pembayaran Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <h3 className="font-bold text-xs text-slate-800">Metode pembayaran</h3>

                  <div className="space-y-2">
                    {[
                      { id: 'MIDTRANS_BANK', label: 'BRI Virtual Account', icon: '🏦' },
                      { id: 'MIDTRANS_BANK_BCA', label: 'BCA Virtual Account', icon: '🏦' },
                      { id: 'MIDTRANS_QRIS', label: 'QRIS', icon: '📱' },
                      { id: 'COD', label: 'Alfamart', icon: '🏬' },
                      { id: 'WALLET', label: `Saldo Dompet (Rp ${(walletBalance ?? 0).toLocaleString('id-ID')})`, icon: '⚡' },
                      ...dynamicPaymentMethods.map(m => ({
                        id: m.id,
                        label: m.providerName + (m.accountName ? ` (${m.accountName})` : ''),
                        isManual: true,
                        icon: '🏦',
                        original: m
                      }))
                    ].map(opt => {
                      const isSelected = 
                        (opt.id === 'WALLET' && paymentMethod === 'WALLET') ||
                        (opt.id === 'COD' && paymentMethod === 'COD') ||
                        (['MIDTRANS_QRIS', 'MIDTRANS_BANK', 'MIDTRANS_BANK_BCA', 'MIDTRANS_CARD'].includes(opt.id) && paymentMethod === 'MIDTRANS' && activePaymentSubId === opt.id) ||
                        ((opt as any).isManual && paymentMethod === 'MANUAL' && activePaymentSubId === opt.id);

                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            if (opt.id === 'WALLET') {
                              setPaymentMethod('WALLET');
                              setActivePaymentSubId('');
                            } else if (opt.id === 'COD') {
                              setPaymentMethod('COD');
                              setActivePaymentSubId('');
                            } else if ((opt as any).isManual) {
                              setPaymentMethod('MANUAL');
                              setActivePaymentSubId(opt.id);
                            } else {
                              setPaymentMethod('MIDTRANS');
                              setActivePaymentSubId(opt.id);
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#F0FDF4] border-[#2DB24A] text-[#2DB24A]'
                              : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{opt.icon}</span>
                            <span>{opt.label}</span>
                          </div>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#2DB24A]' : 'border-slate-300'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#2DB24A]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button type="button" className="text-xs font-bold text-[#2DB24A] hover:underline pt-1">
                    Lihat semua metode pembayaran &gt;
                  </button>
                </div>

                {/* 2. State Kode Promo Card */}
                <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode promo"
                      className={`bg-slate-50 border rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none flex-1 ${
                        couponSuccess ? 'border-[#2DB24A] bg-[#F0FDF4]' : couponError ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-[#2DB24A]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon(couponCode)}
                      className="bg-[#2DB24A] hover:bg-[#259a3f] text-white text-xs font-bold rounded-lg px-4 py-2 transition-colors cursor-pointer shrink-0"
                    >
                      Gunakan
                    </button>
                  </div>
                  {couponSuccess && <p className="text-[11px] text-[#2DB24A] font-bold">✔ Kode promo berhasil dipasang!</p>}
                  {couponError && <p className="text-[11px] text-red-500 font-medium">Kode promo tidak ditemukan, pastikan kode promo sudah benar</p>}
                </div>

                {/* 3. Cek ringkasan transaksi dulu ya! Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <h3 className="font-bold text-xs text-slate-800">Cek ringkasan transaksi dulu ya!</h3>

                  <div className="space-y-2 text-xs text-slate-600 pt-1">
                    <div className="flex justify-between items-center">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-800">Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pengiriman</span>
                      <span className="font-semibold text-[#2DB24A] font-bold">{shippingFee === 0 ? 'Gratis' : `Rp ${shippingFee.toLocaleString('id-ID')}`}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between items-center text-[#2DB24A] font-bold">
                        <span>Diskon Voucher</span>
                        <span>-Rp {couponDiscount.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-800">Total Tagihan</span>
                      <span className="font-extrabold text-slate-900 text-lg">
                        Rp {total.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <button
                    id="cart-checkout"
                    onClick={handleCheckout}
                    disabled={
                      isPending ||
                      isPendingCheckout ||
                      isVerifying ||
                      cart.length === 0 ||
                      hasOwnProduct ||
                      (paymentMethod === 'WALLET' && (walletBalance === null || walletBalance < total))
                    }
                    className="w-full py-3 bg-[#2DB24A] hover:bg-[#259a3f] text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                  >
                    {isPendingCheckout 
                      ? 'Memproses Transaksi...' 
                      : isVerifying 
                      ? 'Memverifikasi Pembayaran...' 
                      : paymentMethod === 'WALLET' 
                      ? (walletBalance === null || walletBalance < total) 
                        ? 'Saldo Dompet Tidak Mencukupi' 
                        : '⚡ Bayar Sekarang (Dompet)' 
                      : 'Bayar Sekarang'}
                  </button>

                  {hasOwnProduct && (
                    <p className="text-[10px] text-red-500 font-semibold text-center mt-1">
                      ⚠️ Hapus produk toko Anda sendiri untuk membuat pesanan.
                    </p>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}
      </div>
    </div>

      {/* ─── MODAL ALAMAT SAYA (Shopee Style) ─── */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-sora font-bold text-slate-800 text-sm">Alamat Saya</h3>
              <button 
                type="button" 
                onClick={() => setShowAddressModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {addresses.map(addr => (
                <div 
                  key={addr.id} 
                  className="py-4 border-b border-slate-100 flex items-start gap-3 cursor-pointer select-none"
                  onClick={() => selectAddress(addr)}
                >
                  {/* Radio selector dot */}
                  <div className="mt-1 shrink-0">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedAddressId === addr.id ? 'border-[#2DB24A]' : 'border-slate-300'}`}>
                      {selectedAddressId === addr.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#2DB24A]" />
                      )}
                    </div>
                  </div>

                  {/* Details block */}
                  <div className="flex-1 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-[13px]">{addr.name}</span>
                        <span className="text-slate-400 text-[11px]">{addr.phone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAddress(addr);
                        }}
                        className="text-[#2DB24A] hover:text-[#0F5132] hover:underline text-xs"
                      >
                        Ubah
                      </button>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      {addr.addressText}
                    </p>
                    <div className="flex gap-1.5">
                      <span className="px-1.5 py-0.5 border border-[#2DB24A] text-[#2DB24A] text-[9px] font-semibold rounded uppercase scale-90 origin-left">
                        {addr.label}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 flex flex-col gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowAddAddressModal(true)}
                className="w-full h-11 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                + Tambah Alamat Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL TAMBAH ALAMAT BARU (Shopee Style) ─── */}
      {showAddAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-sora font-bold text-slate-800 text-sm">Alamat Baru</h3>
              <button 
                type="button" 
                onClick={() => setShowAddAddressModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full h-10 px-3 border border-slate-200 rounded focus:outline-none focus:border-[#2DB24A] bg-[#FDFDFD]"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Nomor Telepon</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="Nomor Telepon"
                    className="w-full h-10 px-3 border border-slate-200 rounded focus:outline-none focus:border-[#2DB24A] bg-[#FDFDFD]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">Provinsi, Kota, Kecamatan, Kode Pos</label>
                <input
                  type="text"
                  value={formProvinceCity}
                  onChange={e => setFormProvinceCity(e.target.value)}
                  placeholder="Provinsi, Kota, Kecamatan, Kode Pos"
                  className="w-full h-10 px-3 border border-slate-200 rounded focus:outline-none focus:border-[#2DB24A] bg-[#FDFDFD]"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">Nama Jalan, Gedung, No. Rumah</label>
                <input
                  type="text"
                  value={formStreetName}
                  onChange={e => setFormStreetName(e.target.value)}
                  placeholder="Nama Jalan, Gedung, No. Rumah"
                  className="w-full h-10 px-3 border border-slate-200 rounded focus:outline-none focus:border-[#2DB24A] bg-[#FDFDFD]"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">Detail Lainnya (Blok/Unit/Patokan)</label>
                <input
                  type="text"
                  value={formDetails}
                  onChange={e => setFormDetails(e.target.value)}
                  placeholder="Detail Lainnya (Cth: Blok / Unit No., Patokan)"
                  className="w-full h-10 px-3 border border-slate-200 rounded focus:outline-none focus:border-[#2DB24A] bg-[#FDFDFD]"
                />
              </div>

              {/* Draggable Map picker inside Add Address Modal */}
              <div className="space-y-2">
                <label className="block text-slate-500 font-medium">Pin Lokasi Peta</label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addressSearchQuery}
                    onChange={e => setAddressSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleGeocodeSearch() }}
                    placeholder="Cari kelurahan/kecamatan/jalan untuk dipin..."
                    className="flex-grow h-10 px-3 border border-slate-200 rounded focus:outline-none focus:border-[#2DB24A]"
                  />
                  <button
                    type="button"
                    onClick={handleGeocodeSearch}
                    className="px-4 h-10 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-bold rounded cursor-pointer"
                  >
                    Cari Pin
                  </button>
                </div>

                <div className="relative w-full h-36 border border-slate-200 rounded overflow-hidden">
                  {apiKey && isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={getBuyerCoordsObj()}
                      zoom={14}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                      }}
                      onLoad={map => setMap(map)}
                    >
                      <Marker
                        position={getBuyerCoordsObj()}
                        draggable={true}
                        onDragEnd={handleMarkerDragEnd}
                      />
                    </GoogleMap>
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 relative">
                      <div className="text-center p-4">
                        <span className="text-2xl block mb-1">🗺️</span>
                        <span className="text-[10px] text-slate-400">Peta Offline - Pilih Lokasi Menggunakan Form di Atas</span>
                      </div>
                    </div>
                  )}

                  {/* Overlapping button "+ Tambah Lokasi" / GPS to request GPS permission or configure location */}
                  <button
                    type="button"
                    onClick={handleRequestGps}
                    className="absolute top-2 right-2 bg-white/95 border border-slate-200 text-[#2DB24A] hover:bg-slate-50 px-2.5 py-1 text-[10px] font-bold rounded shadow-sm flex items-center gap-1 cursor-pointer z-10"
                  >
                    📍 GPS Saya
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 font-medium">Tandai Sebagai:</label>
                <div className="flex gap-2">
                  {['Rumah', 'Kantor'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormLabel(type as any)}
                      className={`h-9 px-4 border text-xs font-bold rounded transition-colors ${
                        formLabel === type
                          ? 'border-[#2DB24A] text-[#2DB24A] bg-[#2DB24A]/5'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowAddAddressModal(false)}
                className="h-10 px-5 text-slate-500 hover:text-slate-700 font-bold uppercase tracking-wider cursor-pointer"
              >
                Nanti Saja
              </button>
              <button
                type="button"
                onClick={createNewAddress}
                className="h-10 px-6 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-bold uppercase tracking-wider rounded shadow-sm cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      <Script
        src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true' 
          ? "https://app.midtrans.com/snap/snap.js" 
          : "https://app.sandbox.midtrans.com/snap/snap.js"
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-sFQP1v53tr2M3CQd'}
        strategy="lazyOnload"
      />
    </>
  )
}
