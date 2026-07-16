'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { getProducts } from '@/app/actions/products'
import { checkoutCart, getWalletDetails } from '@/app/actions/wallet-affiliate'
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
  const [paymentMethod, setPaymentMethod] = useState<'MIDTRANS' | 'WALLET' | 'COD'>('MIDTRANS')
  const [activePaymentSubId, setActivePaymentSubId] = useState<string>('MIDTRANS_QRIS')

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
        const cartKey = currentUser?.id ? `teras_cart_${currentUser.id}` : 'teras_cart'
        localStorage.removeItem(cartKey)
        localStorage.removeItem('teras_affiliate_id')
        setCart([])
        setAffiliateId('')
        router.push(`/orders/${res.order.id}`)
      } catch (err: any) {
        setError(err.message || 'Gagal melakukan checkout via dompet.')
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
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2DB24A]/20 border-t-[#2DB24A] rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-[#2DB24A] tracking-widest uppercase">
            Memuat Halaman Checkout...
          </span>
        </div>
      </div>
    )
  }

  if (checkoutSuccess) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#F5F5F5] py-12 px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(45,178,74,0.04)_0%,transparent_65%)] pointer-events-none z-0" />
        <div className="relative z-10 w-full max-w-md text-center border border-slate-200 bg-white shadow-lg p-8 rounded-lg">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center mx-auto rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="font-sora text-2xl font-bold text-slate-800 mb-3">Transaksi Berhasil!</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Pesanan Anda telah berhasil dibuat dan data transaksi telah disinkronkan.
          </p>
          <div className="bg-slate-50 border border-slate-200/50 p-4 mb-8 rounded-xl text-left text-xs text-slate-600 space-y-2">
            <div className="flex justify-between"><span>Poin Diperoleh (1%):</span><span className="text-[#2DB24A] font-bold">+{Math.round(total * 0.01)} Poin</span></div>
            <div className="flex justify-between"><span>Cashback Dompet (5%):</span><span className="text-[#2DB24A] font-bold">Rp {Math.round(total * 0.05).toLocaleString('id-ID')}</span></div>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/wallet"
              className="py-3 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-bold text-xs uppercase tracking-wider rounded text-center transition-colors shadow"
            >
              Buka Dompet / Ledger
            </Link>
            <Link
              href="/market"
              className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded text-center transition-colors"
            >
              Kembali Belanja
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#F5F5F5] pt-6 pb-24 px-4 md:px-10">
      
      {/* 1. Header Checkout (Shopee Style) */}
      <div className="max-w-[1200px] mx-auto mb-5 bg-white border border-slate-200/70 p-4 rounded flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/market" className="font-sora text-xl font-black text-[#2DB24A] tracking-tight">
            Saloka <span className="text-slate-700 font-normal">| Checkout</span>
          </Link>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">Sistem Pembayaran Terenkripsi Aman</div>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto">
        {error && (
          <div className="mb-4 p-4 rounded bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
            ⚠️ {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 rounded bg-green-50 border border-green-200 text-xs text-green-600 font-medium">
            ✓ {successMessage}
          </div>
        )}

        {cartDetails.length === 0 ? (
          <div className="text-center py-20 border border-slate-200 bg-white rounded shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300 mx-auto mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <h3 className="font-sora text-base font-bold text-slate-800 mb-2">Keranjang Anda Kosong</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6">
              Kembali ke pasar dan isi keranjang belanja Anda untuk melakukan checkout.
            </p>
            <Link
              href="/market"
              className="px-6 py-2.5 bg-[#2DB24A] hover:bg-[#2DB24A]/95 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors inline-block shadow-sm"
            >
              Belanja Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 2. Shopee-Style Shipping Address Panel */}
            <div className="bg-white border border-slate-200/80 rounded shadow-sm overflow-hidden relative">
              {/* Ribbon border */}
              <div 
                className="h-1.5 w-full" 
                style={{
                  background: 'repeating-linear-gradient(-45deg, #2DB24A, #2DB24A 12px, #FFFFFF 12px, #FFFFFF 20px, #0F5132 20px, #0F5132 32px, #FFFFFF 32px, #FFFFFF 40px)'
                }}
              />
              
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-1.5 text-[#0F5132] font-bold text-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  Alamat Pengiriman
                </div>

                {(() => {
                  const activeAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];
                  return activeAddress ? (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-6 gap-y-1.5 flex-1">
                        <strong className="text-slate-800 text-[13px] shrink-0 sm:w-48">
                          {activeAddress.name} ({activeAddress.phone})
                        </strong>
                        <p className="text-slate-600 leading-relaxed text-[12px] flex flex-wrap items-center gap-2">
                          <span>{activeAddress.addressText}</span>
                          <span className="px-1.5 py-0.5 border border-[#2DB24A] text-[#2DB24A] text-[9px] font-semibold rounded shrink-0 scale-90 uppercase">
                            {activeAddress.label}
                          </span>
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(true)}
                        className="text-[#2DB24A] hover:text-[#0F5132] hover:underline font-bold text-xs uppercase tracking-wide shrink-0 md:w-12 text-right"
                      >
                        Ubah
                      </button>
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
            </div>

            {/* 3. Products Grouped by Store / Merchant */}
            <div className="bg-white border border-slate-200/80 rounded shadow-sm overflow-hidden p-5">
              <div className="grid grid-cols-6 text-slate-400 font-bold text-xs pb-3 border-b border-slate-100 mb-4 hidden md:grid">
                <div className="col-span-3">Produk Dipesan</div>
                <div className="text-center">Harga Satuan</div>
                <div className="text-center">Jumlah</div>
                <div className="text-right">Subtotal Produk</div>
              </div>

              <div className="space-y-8">
                {(() => {
                  const groups: Record<string, typeof cartDetails> = {};
                  cartDetails.forEach(item => {
                    const mId = item.merchantId || 'unknown';
                    if (!groups[mId]) groups[mId] = [];
                    groups[mId].push(item);
                  });

                  return Object.entries(groups).map(([mId, items]) => {
                    const shopName = items[0]?.merchant?.name || 'Toko UMKM';
                    const merchantObj = items[0]?.merchant;
                    let merchantAddress = '';
                    if ((merchantObj as any)?.landingPageConfig) {
                      try {
                        const config = JSON.parse((merchantObj as any).landingPageConfig);
                        merchantAddress = config.detailAddress || config.locationName || '';
                      } catch (e) {}
                    }
                    if (!merchantAddress) merchantAddress = 'Alamat Toko UMKM (Silakan konfirmasi via Chat)';
                    
                    return (
                      <div key={mId} className="space-y-4">
                        {/* Shop Header */}
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100/50">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-600"><path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4L3 12v2c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3zm-12 1H6v-2h3v2zm5 0h-3v-2h3v2zm4 0h-3v-2h3v2z"/></svg>
                          <span className="font-sora font-extrabold text-xs text-slate-800">{shopName}</span>
                          <span className="text-[10px] text-slate-400">|</span>
                          <Link href={`/chat?sellerId=${mId}`} className="text-xs text-[#2DB24A] hover:underline flex items-center gap-1">
                            <span className="text-[10px]">💬</span> chat sekarang
                          </Link>
                        </div>

                        {/* Items Rows */}
                        <div className="space-y-4">
                          {items.map(item => {
                            const wholesalePrice = getProductPriceWithWholesale(item.price, item.quantity);
                            const hasDiscount = wholesalePrice < item.price;
                            const isOwnProduct = currentUser && item.merchantId === currentUser.id;

                            return (
                              <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center justify-between pb-4 border-b border-slate-100/50 last:border-b-0 last:pb-0 text-xs">
                                
                                {/* Info / Title */}
                                <div className="col-span-1 md:col-span-3 flex gap-3">
                                  <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded overflow-hidden flex-shrink-0 relative">
                                    {item.imageUrl ? (
                                      <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-lg bg-slate-100">📦</div>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="font-bold text-slate-800 line-clamp-1">{item.title}</h4>
                                    <div className="flex flex-wrap gap-1 items-center">
                                      <span className="px-1 py-0.2 bg-[#2DB24A]/10 text-[8px] text-[#2DB24A] font-bold rounded">
                                        {item.category}
                                      </span>
                                      <span className="px-1 py-0.2 bg-slate-100 text-[8px] text-slate-500 rounded">
                                        Variasi: Standard
                                      </span>
                                      {isOwnProduct && (
                                        <span className="px-1 py-0.2 bg-red-500/10 text-[8px] text-red-500 font-bold rounded">
                                          Toko Sendiri
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Harga Satuan */}
                                <div className="text-left md:text-center font-semibold text-slate-700">
                                  {hasDiscount ? (
                                    <div className="flex md:flex-col items-center md:justify-center gap-1">
                                      <span className="line-through text-slate-400 text-[10px]">Rp {item.price.toLocaleString('id-ID')}</span>
                                      <span>Rp {wholesalePrice.toLocaleString('id-ID')}</span>
                                    </div>
                                  ) : (
                                    <span>Rp {item.price.toLocaleString('id-ID')}</span>
                                  )}
                                </div>

                                {/* Jumlah */}
                                <div className="text-left md:text-center">
                                  <div className="inline-flex items-center border border-slate-200 rounded">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.stock)}
                                      className="px-2 py-0.5 text-xs hover:bg-slate-50 font-bold text-slate-500"
                                    >
                                      -
                                    </button>
                                    <span className="px-2 font-bold text-slate-700">{item.quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.stock)}
                                      className="px-2 py-0.5 text-xs hover:bg-slate-50 font-bold text-slate-500"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="text-red-500 hover:text-red-600 block text-[9px] mt-1 md:mx-auto font-medium"
                                  >
                                    Hapus
                                  </button>
                                </div>

                                {/* Subtotal Produk */}
                                <div className="text-right font-bold text-slate-800 text-[13px]">
                                  Rp {(wholesalePrice * item.quantity).toLocaleString('id-ID')}
                                </div>

                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Shipping Option & Message */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-100 rounded text-xs mt-3">
                          <div className="space-y-1">
                            <label className="block text-slate-500 font-medium">Catatan Pesanan:</label>
                            <input
                              type="text"
                              placeholder="(Opsional) Tinggalkan pesan ke penjual..."
                              className="w-full h-10 px-3 bg-white border border-slate-200 rounded focus:outline-none focus:border-[#2DB24A]"
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1.5 pb-2.5 border-b border-slate-200/60">
                              <span className="text-slate-500 font-medium block">Metode Pengiriman:</span>
                              <div className="flex flex-wrap gap-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input 
                                    type="radio" 
                                    name="delivery-method"
                                    value="DELIVERY"
                                    checked={deliveryMethod === 'DELIVERY'}
                                    onChange={() => setDeliveryMethod('DELIVERY')}
                                    className="w-4 h-4 text-[#2DB24A] border-slate-300 focus:ring-[#2DB24A] cursor-pointer accent-[#2DB24A]"
                                  />
                                  <span className="font-bold text-slate-700">Kirim via Kurir / Ekspedisi</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input 
                                    type="radio" 
                                    name="delivery-method"
                                    value="PICKUP"
                                    checked={deliveryMethod === 'PICKUP'}
                                    onChange={() => setDeliveryMethod('PICKUP')}
                                    className="w-4 h-4 text-[#2DB24A] border-slate-300 focus:ring-[#2DB24A] cursor-pointer accent-[#2DB24A]"
                                  />
                                  <span className="font-bold text-slate-700">Ambil Sendiri / Pickup (Rp 0)</span>
                                </label>
                              </div>
                            </div>

                            {deliveryMethod === 'DELIVERY' ? (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">Opsi Pengiriman:</span>
                                  <span className="font-bold text-slate-800">
                                    {selectedCourierRate ? selectedCourierRate.courier_name : 'REGULAR'}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between items-center text-[11px] text-slate-400">
                                  <span>Estimasi Tiba:</span>
                                  <span>{selectedCourierRate ? selectedCourierRate.etd : '2-3 hari'}</span>
                                </div>

                                <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
                                  <span className="text-slate-500">Ongkos Kirim:</span>
                                  <span className="font-extrabold text-slate-800 text-[13px]">
                                    Rp {shippingFee.toLocaleString('id-ID')}
                                  </span>
                                </div>

                                <div className="text-right">
                                  <select
                                    value={selectedCourier}
                                    onChange={(e) => setSelectedCourier(e.target.value)}
                                    className="mt-1 px-2.5 py-1 border border-slate-200 bg-white rounded text-[10px] font-bold text-slate-600 focus:outline-none cursor-pointer"
                                  >
                                    {courierRates.map(rate => (
                                      <option key={rate.courier_code} value={rate.courier_code}>
                                        {rate.courier_name} (Rp {rate.price.toLocaleString('id-ID')})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">Opsi Pengiriman:</span>
                                  <span className="font-bold text-slate-800">Ambil Sendiri / Pickup</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-slate-400">
                                  <span>Estimasi Tiba:</span>
                                  <span>Bisa diambil langsung / janjian</span>
                                </div>
                                <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-200/50">
                                  <span className="text-slate-500 font-medium">Alamat Pengambilan / Toko:</span>
                                  <span className="font-bold text-slate-800 bg-green-50/50 p-2 border border-[#2DB24A]/20 rounded text-[11px] leading-relaxed">
                                    📍 {merchantAddress}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                  <span className="text-slate-500">Ongkos Kirim:</span>
                                  <span className="font-extrabold text-green-600 text-[13px]">Gratis (Rp 0)</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Store Subtotal Footer */}
                        <div className="text-right text-xs text-slate-500 pt-2 flex justify-end gap-2 items-center">
                          <span>Total Pesanan ({items.reduce((a, b) => a + b.quantity, 0)} Produk):</span>
                          <strong className="text-[#2DB24A] text-sm font-extrabold">
                            Rp {(items.reduce((s, i) => s + getProductPriceWithWholesale(i.price, i.quantity) * i.quantity, 0) + shippingFee).toLocaleString('id-ID')}
                          </strong>
                        </div>

                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* 4. Voucher & Coins (Shopee Platform Selection Style) */}
            <div className="bg-white border border-slate-200/80 rounded shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 mb-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500"><path d="M2 17h20v2H2zm11.84-5.43L11.02 8.75l1.41-1.41 2.83 2.83zm-2.02-4.24l-2.83-2.83 1.41-1.41 2.83 2.83zM10 20c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z"/></svg>
                Voucher & Koin Saloka
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coupon Panel */}
                <div className="border border-slate-200/70 p-4 rounded bg-slate-50/50 space-y-3">
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">🏷️ Klaim Voucher Saloka</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="DISKON10, GRATISONGKIR"
                      className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2DB24A]"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon(couponCode)}
                      className="px-4 h-9 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-bold text-xs rounded transition-colors uppercase tracking-wider"
                    >
                      Klaim
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] text-red-500 font-bold">{couponError}</p>}
                  {couponSuccess && <p className="text-[10px] text-green-600 font-bold">{couponSuccess}</p>}
                </div>

                {/* Coins redemption box */}
                <div className="border border-slate-200/70 p-4 rounded bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">🪙 Tukarkan Koin Saloka</span>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Koin Anda: {userCoins.toLocaleString('id-ID')} koin (Senilai Rp {maxCoinsVal.toLocaleString('id-ID')})
                        <br />
                        <span className="italic text-[9px] text-slate-500">*Maksimal penukaran adalah 50% dari subtotal produk.</span>
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      disabled={userCoins <= 0}
                      checked={useCoins}
                      onChange={(e) => setUseCoins(e.target.checked)}
                      className="w-4 h-4 text-[#2DB24A] border-slate-300 rounded focus:ring-[#2DB24A] cursor-pointer accent-[#2DB24A] disabled:opacity-50"
                    />
                  </div>

                  {useCoins && coinRedemptionValue > 0 && (
                    <div className="pt-2 text-right text-xs text-[#2DB24A] font-bold">
                      Koin Terpakai: {coinsRedeemed.toFixed(1)} Koin (-Rp {coinRedemptionValue.toLocaleString('id-ID')})
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Payment Methods & Final Bill Summary */}
            <div className="bg-white border border-slate-200/80 rounded shadow-sm p-5 space-y-6">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 mb-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#2DB24A]"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                Metode Pembayaran
              </div>

              {/* Grid buttons matching Shopee layout */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'DEBIT_INSTAN', label: 'Debit Instan', disabled: true },
                  { id: 'WALLET', label: `Saldo Dompet (Rp ${(walletBalance ?? 0).toLocaleString('id-ID')})`, disabled: false },
                  { id: 'COD', label: 'COD (Bayar di Tempat)', disabled: false },
                  { id: 'COD_CEK_DULU', label: 'COD - Cek Dulu', disabled: true },
                  { id: 'MIDTRANS_QRIS', label: 'QRIS', disabled: false },
                  { id: 'MIDTRANS_BANK', label: 'Transfer Bank', disabled: false },
                  { id: 'MIDTRANS_CARD', label: 'Kartu Kredit/Debit', disabled: false },
                  { id: 'MITRA_AGEN', label: 'Bayar Tunai di Mitra/Agen', disabled: true },
                ].map(opt => {
                  const isSelected = 
                    (opt.id === 'WALLET' && paymentMethod === 'WALLET') ||
                    (opt.id === 'COD' && paymentMethod === 'COD') ||
                    (['MIDTRANS_QRIS', 'MIDTRANS_BANK', 'MIDTRANS_CARD'].includes(opt.id) && paymentMethod === 'MIDTRANS' && activePaymentSubId === opt.id);

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => {
                        if (opt.id === 'WALLET') {
                          setPaymentMethod('WALLET');
                          setActivePaymentSubId('');
                        } else if (opt.id === 'COD') {
                          setPaymentMethod('COD');
                          setActivePaymentSubId('');
                        } else {
                          setPaymentMethod('MIDTRANS');
                          setActivePaymentSubId(opt.id);
                        }
                      }}
                      className={`h-11 px-3 border text-xs font-bold rounded transition-all flex items-center justify-center text-center relative ${
                        opt.disabled
                          ? 'bg-[#F9FAFB] border-slate-100 text-slate-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-white border-[#2DB24A] text-[#2DB24A] shadow-sm after:content-[""] after:absolute after:bottom-0 after:right-0 after:w-0 after:h-0 after:border-t-[12px] after:border-t-transparent after:border-r-[12px] after:border-r-[#2DB24A] before:content-["✓"] before:absolute before:bottom-0 before:right-0 before:text-white before:text-[7px] before:font-bold before:z-10 before:leading-none before:p-0.5'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 cursor-pointer'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/50 p-3.5 rounded leading-relaxed">
                {paymentMethod === 'WALLET' && (
                  <div>
                    <strong>Saldo Dompet Saloka</strong>
                    <p className="mt-0.5 text-slate-400">⚡ Potong saldo instan 1-Click dari Dompet Saloka Anda.</p>
                  </div>
                )}
                {paymentMethod === 'COD' && (
                  <div>
                    <strong>COD (Cash on Delivery)</strong>
                    <p className="mt-0.5 text-slate-400">📦 Bayar tunai kepada kurir ekspedisi saat paket sampai di alamat rumah Anda.</p>
                  </div>
                )}
                {paymentMethod === 'MIDTRANS' && activePaymentSubId === 'MIDTRANS_QRIS' && (
                  <div>
                    <strong>QRIS (Midtrans)</strong>
                    <p className="mt-0.5 text-slate-400">📱 Scan QRIS menggunakan Gopay, OVO, Dana, LinkAja, ShopeePay, atau BCA Mobile.</p>
                  </div>
                )}
                {paymentMethod === 'MIDTRANS' && activePaymentSubId === 'MIDTRANS_BANK' && (
                  <div>
                    <strong>Transfer Bank / Virtual Account (Midtrans)</strong>
                    <p className="mt-0.5 text-slate-400">🏦 Bayar melalui Virtual Account bank pilihan Anda (BCA, Mandiri, BNI, BRI, Permata, dll).</p>
                  </div>
                )}
                {paymentMethod === 'MIDTRANS' && activePaymentSubId === 'MIDTRANS_CARD' && (
                  <div>
                    <strong>Kartu Kredit/Debit (Midtrans)</strong>
                    <p className="mt-0.5 text-slate-400">💳 Pembayaran instan aman menggunakan kartu kredit berlogo Visa, Mastercard, atau JCB.</p>
                  </div>
                )}
              </div>

              {/* Invoice calculation layout */}
              <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                
                {/* Stats panel on left */}
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="flex gap-2"><span>Poin Diperoleh:</span><span className="text-[#2DB24A] font-bold">+{Math.round(total * 0.01)} Poin</span></div>
                  <div className="flex gap-2"><span>Cashback Dompet:</span><span className="text-[#2DB24A] font-bold">Rp {Math.round(total * 0.05).toLocaleString('id-ID')}</span></div>
                </div>

                {/* Subtotals on right */}
                <div className="w-full md:w-auto space-y-2.5 text-xs text-right">
                  <div className="flex justify-between md:justify-end gap-12 text-slate-500">
                    <span>Subtotal untuk Produk:</span>
                    <span className="w-28 font-semibold text-slate-800">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between md:justify-end gap-12 text-slate-500">
                    <span>Subtotal Pengiriman:</span>
                    <span className="w-28 font-semibold text-slate-800">Rp {shippingFee.toLocaleString('id-ID')}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between md:justify-end gap-12 text-[#2DB24A] font-bold">
                      <span>Voucher Potongan:</span>
                      <span className="w-28">-Rp {couponDiscount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {coinRedemptionValue > 0 && (
                    <div className="flex justify-between md:justify-end gap-12 text-[#2DB24A] font-bold">
                      <span>Koin Ditukarkan:</span>
                      <span className="w-28">-Rp {coinRedemptionValue.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between md:justify-end gap-12 text-slate-800 font-extrabold border-t border-slate-100 pt-3 items-center">
                    <span className="text-sm">Total Pembayaran:</span>
                    <span className="w-36 text-2xl font-black text-[#2DB24A] font-geist">
                      Rp {total.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="pt-4 flex md:justify-end">
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
                      className="w-full md:w-60 h-12 bg-[#2DB24A] hover:bg-[#2DB24A]/95 text-white font-bold text-sm uppercase tracking-wider rounded shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPendingCheckout 
                        ? 'Memproses Transaksi...' 
                        : isVerifying 
                        ? 'Memverifikasi Pembayaran...' 
                        : paymentMethod === 'WALLET' 
                        ? (walletBalance === null || walletBalance < total) 
                          ? 'Saldo Dompet Tidak Mencukupi' 
                          : '⚡ Buat Pesanan (Dompet)' 
                        : 'Buat Pesanan'}
                    </button>
                  </div>
                  
                  {hasOwnProduct && (
                    <p className="text-[10px] text-red-500 font-semibold mt-2 text-center md:text-right">
                      ⚠️ Hapus produk toko Anda sendiri untuk membuat pesanan.
                    </p>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}
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

    </div>
  )
}
