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

interface CourierRate {
  courier_code: string;
  courier_name: string;
  price: number;
  etd: string;
}

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
  const [shippingAddress, setShippingAddress] = useState('')

  // Komerce Shipping API
  const [destinationSearch, setDestinationSearch] = useState('')
  const [destinationResults, setDestinationResults] = useState<{id: string; label: string}[]>([])
  const [selectedDestId, setSelectedDestId] = useState('')
  const [selectedDestLabel, setSelectedDestLabel] = useState('')
  const [isSearchingDest, setIsSearchingDest] = useState(false)
  const [courierRates, setCourierRates] = useState<CourierRate[]>([])
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false)
  const [shippingSource, setShippingSource] = useState<'komerce' | 'mock'>('mock')
  const [shippingDistKm, setShippingDistKm] = useState(0)

  // Fallback mock cities
  const mockCities: Record<string, { name: string, lat: number, lng: number }> = {
    jakarta: { name: 'Jakarta (Pusat)', lat: -6.2088, lng: 106.8456 },
    bandung: { name: 'Bandung (Jawa Barat)', lat: -6.9175, lng: 107.6191 },
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

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'MIDTRANS' | 'WALLET'>('MIDTRANS')

  // Google Maps state
  const [map, setMap] = useState<any>(null)
  const [distanceText, setDistanceText] = useState('')
  const [durationText, setDurationText] = useState('')
  const [addressSearchQuery, setAddressSearchQuery] = useState('')

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
    return {
      lat: useGps && buyerCoords ? buyerCoords.latitude : mockCities[selectedMockCity].lat,
      lng: useGps && buyerCoords ? buyerCoords.longitude : mockCities[selectedMockCity].lng
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

  // Recalculate distance & courier rates whenever buyer/cart location changes (haversine only - no Directions API)
  useEffect(() => {
    if (cartDetails.length === 0) return;
    const buyer = getBuyerCoordsObj();
    const seller = getSellerCoords();
    const dist = getDistance(buyer.lat, buyer.lng, seller.lat, seller.lng);
    setShippingDistKm(dist);
    setDistanceText(`${dist.toFixed(1)} km`);
    setDurationText(dist < 50 ? '< 1 jam' : dist < 200 ? '2–4 jam' : dist < 800 ? '1–2 hari' : '2–3 hari');
    updateCourierRates(dist);
    // Geocode to readable address via Google Geocoding (no Directions needed)
    if (useGps && buyerCoords && window.google && apiKey && (!shippingAddress || shippingAddress.startsWith('Lokasi Terdaftar'))) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: buyer.lat, lng: buyer.lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) setShippingAddress(results[0].formatted_address);
      });
    }
  }, [buyerCoords, selectedMockCity, useGps, cartDetails.length]);

  const handleMarkerDragEnd = (e: any) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setBuyerCoords({ latitude: lat, longitude: lng });
      setUseGps(true);
      
      if (window.google) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            setShippingAddress(results[0].formatted_address);
          }
        });
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
          setBuyerCoords(coords);
          setUseGps(true);
          setShippingAddress(results[0].formatted_address);
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
        setBuyerCoords({ latitude: city.lat, longitude: city.lng });
        setUseGps(true);
        setShippingAddress(city.name);
      } else {
        setError('Alamat tidak ditemukan (Mode Fallback). Coba: Bandung, Surabaya, Medan, Makassar.');
      }
    }
  };


  // Fetch GPS coordinates
  const handleRequestGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
          setBuyerCoords(coords)
          setUseGps(true)
          setSuccessMessage('Sukses mengambil lokasi GPS browser!')
          setTimeout(() => setSuccessMessage(null), 3000)
          // Auto-calculate shipping when GPS acquired
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

  // Select a destination from results
  const handleSelectDestination = (dest: {id: string; label: string}) => {
    setSelectedDestId(dest.id)
    setSelectedDestLabel(dest.label)
    setDestinationSearch(dest.label)
    setDestinationResults([])
    // Trigger shipping rate calculation
    const productLat = cartDetails.length > 0 ? (cartDetails[0].latitude ?? -6.2088) : -6.2088
    const productLng = cartDetails.length > 0 ? (cartDetails[0].longitude ?? 106.8456) : 106.8456
    fetchCourierRates(dest.id, productLat + ',' + productLng, null, null)
  }

  // Fetch courier rates from our API route
  const fetchCourierRates = async (
    receiverDestId: string | null,
    shipperPin: string | null,
    receiverLat: number | null,
    receiverLng: number | null
  ) => {
    setIsCalculatingShipping(true)
    setError(null)
    try {
      // Get average shipper location from cart products
      let shipperLat = -6.2088
      let shipperLng = 106.8456
      if (cartDetails.length > 0) {
        const lats = cartDetails.map(p => p.latitude ?? -6.2088)
        const lngs = cartDetails.map(p => p.longitude ?? 106.8456)
        shipperLat = lats.reduce((a, b) => a + b, 0) / lats.length
        shipperLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
      }

      // Buyer location
      const bLat = receiverLat ?? (useGps && buyerCoords ? buyerCoords.latitude : mockCities[selectedMockCity].lat)
      const bLng = receiverLng ?? (useGps && buyerCoords ? buyerCoords.longitude : mockCities[selectedMockCity].lng)

      const totalWeight = cartDetails.reduce((sum, item) => sum + item.quantity * 1000, 0) // 1kg per item

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
        // Auto-select first courier
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

  // Load cart, affiliate, wallet data
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

        // Load full user profile coordinates
        const profile = await getCurrentUserProfile()
        if (profile && profile.latitude && profile.longitude) {
          const coords = { latitude: profile.latitude, longitude: profile.longitude }
          setBuyerCoords(coords)
          setUseGps(true)
          
          if (window.google) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat: profile.latitude, lng: profile.longitude } }, (results, status) => {
              if (status === 'OK' && results?.[0]) {
                setShippingAddress(results[0].formatted_address);
              } else {
                setShippingAddress(`Lokasi Terdaftar di Profil (${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)})`);
              }
            });
          } else {
            setShippingAddress(`Lokasi Terdaftar di Profil (${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)})`);
          }
        }

        // Clean up cart from items that do not exist in database products list
        if (storedCart) {
          try {
            const parsedCart: CartItem[] = JSON.parse(storedCart)
            const validCart = parsedCart.filter(item => list.some((p: any) => p.id === item.productId))
            if (validCart.length !== parsedCart.length) {
              setCart(validCart)
              localStorage.setItem(cartKey, JSON.stringify(validCart))
            }
          } catch (err) {
            console.error('Error parsing cart logic', err)
          }
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
    if (cartDetails.length > 0 && courierRates.length === 0) {
      const buyer = {
        lat: useGps && buyerCoords ? buyerCoords.latitude : mockCities[selectedMockCity].lat,
        lng: useGps && buyerCoords ? buyerCoords.longitude : mockCities[selectedMockCity].lng,
      }
      const seller = {
        lat: cartDetails[0].latitude ?? cartDetails[0].merchant?.latitude ?? -6.2088,
        lng: cartDetails[0].longitude ?? cartDetails[0].merchant?.longitude ?? 106.8456,
      }
      const dist = getDistance(buyer.lat, buyer.lng, seller.lat, seller.lng)
      setShippingDistKm(dist)
      updateCourierRates(dist)
    }
  }, [cartDetails.length])

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart)
    const cartKey = currentUser?.id ? `teras_cart_${currentUser.id}` : 'teras_cart'
    localStorage.setItem(cartKey, JSON.stringify(newCart))
  }

  const handleUpdateQuantity = (productId: string, quantity: number, maxStock: number) => {
    if (quantity < 1) return
    if (quantity > maxStock) return
    const updated = cart.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    )
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
        setCheckoutSuccess(true)
        router.refresh()
      } else {
        setError(data.message || 'Transaksi belum dibayar atau status pending.')
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi status pembayaran.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Calculate pricing logic with wholesale (dimsale)
  const getProductPriceWithWholesale = (basePrice: number, qty: number) => {
    if (qty >= 10) return basePrice * 0.80; // 20% off
    if (qty >= 5) return basePrice * 0.90;  // 10% off
    if (qty >= 3) return basePrice * 0.95;  // 5% off
    return basePrice;
  };

  const subtotal = cartDetails.reduce((sum, item) => {
    const wholesalePrice = getProductPriceWithWholesale(item.price, item.quantity)
    return sum + wholesalePrice * item.quantity
  }, 0)

  // Distance calculation based on buyer coordinates
  const activeBuyerLat = useGps && buyerCoords ? buyerCoords.latitude : mockCities[selectedMockCity].lat
  const activeBuyerLng = useGps && buyerCoords ? buyerCoords.longitude : mockCities[selectedMockCity].lng

  // Shipping fee from selected courier in Komerce rates (or fallback haversine)
  const shippingFee = (() => {
    if (courierRates.length > 0) {
      const found = courierRates.find(r => r.courier_code === selectedCourier)
      return found ? found.price : (courierRates[0]?.price ?? 0)
    }
    // Haversine fallback
    if (cartDetails.length === 0) return 0
    const shipperLat = cartDetails[0].latitude ?? -6.2088
    const shipperLng = cartDetails[0].longitude ?? 106.8456
    const dist = getDistance(activeBuyerLat, activeBuyerLng, shipperLat, shipperLng)
    
    const totalWeight = cartDetails.reduce((sum, item) => sum + item.quantity * 1000, 0)
    const weightKg = Math.max(1, Math.ceil(totalWeight / 1000))
    
    const courierRateMap: Record<string, { ratePerKm: number; baseFee: number; minFee: number }> = {
      jne: { ratePerKm: 40, baseFee: 15000, minFee: 9000 },
      jnt: { ratePerKm: 45, baseFee: 16000, minFee: 9000 },
      sicepat: { ratePerKm: 50, baseFee: 18000, minFee: 10000 },
      tiki: { ratePerKm: 35, baseFee: 14000, minFee: 9000 },
      pos: { ratePerKm: 30, baseFee: 12000, minFee: 8000 },
    }
    
    const cr = courierRateMap[selectedCourier] || courierRateMap.jne
    const costPerKg = cr.baseFee + Math.round(dist * cr.ratePerKm / 100) * 100
    return Math.max(cr.minFee, costPerKg * weightKg)
  })()

  // Display distance
  const avgDistance = (() => {
    if (shippingDistKm > 0) return shippingDistKm
    if (cartDetails.length === 0) return 0
    const lats = cartDetails.map(p => p.latitude ?? -6.2088)
    const lngs = cartDetails.map(p => p.longitude ?? 106.8456)
    const sLat = lats.reduce((a, b) => a + b, 0) / lats.length
    const sLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
    return getDistance(activeBuyerLat, activeBuyerLng, sLat, sLng)
  })()

  // Recalculate coupon discount reactively
  let activeCouponDiscount = couponDiscount
  if (couponSuccess) {
    const upper = couponCode.toUpperCase()
    if (upper === 'DISKON10') {
      activeCouponDiscount = subtotal * 0.1
    } else if (upper === 'Saloka.id') {
      activeCouponDiscount = Math.min(20000, subtotal)
    } else if (upper === 'GRATISONGKIR') {
      activeCouponDiscount = shippingFee
    }
  } else {
    activeCouponDiscount = 0
  }

  const total = Math.max(0, subtotal + shippingFee - activeCouponDiscount)
  const hasOwnProduct = process.env.NODE_ENV === 'production'
    ? cartDetails.some((item) => currentUser && item.merchantId === currentUser.id)
    : false

  const handleApplyCoupon = (code: string) => {
    setCouponError(null)
    setCouponSuccess(null)
    const upperCode = code.trim().toUpperCase()
    if (upperCode === 'DISKON10') {
      setCouponSuccess('Kupon DISKON10 berhasil dipasang! (Diskon 10%)')
    } else if (upperCode === 'Saloka.id') {
      setCouponSuccess('Kupon Saloka.id berhasil dipasang! (Diskon Rp 20.000)')
    } else if (upperCode === 'GRATISONGKIR') {
      setCouponSuccess('Kupon GRATISONGKIR berhasil dipasang! (Gratis Ongkir)')
    } else {
      setCouponError('Kode kupon tidak valid.')
    }
  }

  const handleCheckout = async () => {
    setError(null)
    setSuccessMessage(null)
    if (cart.length === 0) return

    if (hasOwnProduct) {
      setError('Anda tidak diperbolehkan membeli produk Anda sendiri. Hapus produk Anda terlebih dahulu untuk checkout.')
      return
    }

    const shippingDetails = {
      shippingFee,
      courier: selectedCourier.toUpperCase(),
      shippingAddress: shippingAddress || `Terkirim ke ${useGps ? 'GPS Lokasi' : mockCities[selectedMockCity].name}`,
      couponCode: couponSuccess ? couponCode.toUpperCase() : undefined,
      discountAmount: activeCouponDiscount,
    }

    if (paymentMethod === 'WALLET') {
      setIsPendingCheckout(true)
      try {
        const itemsPayload = cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
        }))

        const res = await checkoutCart(itemsPayload, affiliateId || undefined, 'WALLET', shippingDetails)
        if (res.error) {
          throw new Error(res.error)
        }

        const cartKey = currentUser?.id ? `teras_cart_${currentUser.id}` : 'teras_cart'
        localStorage.removeItem(cartKey)
        localStorage.removeItem('teras_affiliate_id')
        setCart([])
        setAffiliateId('')
        setCheckoutSuccess(true)
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'Gagal checkout menggunakan dompet.')
      } finally {
        setIsPendingCheckout(false)
      }
      return
    }

    // Midtrans Checkout Flow
    setIsPendingCheckout(true)
    try {
      const itemsPayload = cart.map((c) => ({
        productId: c.productId,
        quantity: c.quantity,
      }))

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
          },
          onPending: (result: any) => {
            setPendingOrderId(result.order_id || data.orderId)
            setSuccessMessage('Menunggu pembayaran diselesaikan. Silakan bayar atau simulasikan di bawah.')
          },
          onError: (result: any) => {
            setError('Terjadi kesalahan pada pembayaran Midtrans.')
          },
          onClose: () => {
            setError(`Transaksi dibuat: ${data.orderId}. Selesaikan atau verifikasi di panel bawah.`)
          }
        })
      } else {
        setError(`Token Midtrans berhasil dibuat: ${data.orderId}. Silakan simulasikan pembayaran di bawah.`)
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung dengan Midtrans.')
    } finally {
      setIsPendingCheckout(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-surface">
        <span className="text-xs font-geist font-bold text-primary tracking-widest uppercase animate-pulse">
          Memuat Keranjang Belanja Premium...
        </span>
      </div>
    )
  }

  if (checkoutSuccess) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-surface py-12 px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.06)_0%,transparent_65%)] pointer-events-none z-0" />
        <div className="relative z-10 w-full max-w-md text-center border border-border-subtle bg-surface shadow-[var(--shadow-md)] p-8 rounded-[var(--radius-brand)]">
          <div className="btn-primary w-16 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="font-sora text-2xl font-bold text-foreground mb-3">Transaksi Berhasil!</h2>
          <p className="text-xs text-foreground/70 leading-relaxed mb-4">
            Pembayaran Anda telah diaudit dan disinkronkan ke ledger kami. 
          </p>
          <div className="btn-primary bg-primary/5 border border-primary/10 p-3 mb-8 text-left text-[11px] text-foreground/70 space-y-1">
            <div className="flex justify-between"><span className="text-foreground/70/60">Points Diperoleh (1%):</span><span className="text-primary font-bold">+{Math.round(total * 0.01)} Poin</span></div>
            <div className="flex justify-between"><span className="text-foreground/70/60">Cashback Wallet (5%):</span><span className="text-primary font-bold">Rp {Math.round(total * 0.05).toLocaleString('id-ID')}</span></div>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/wallet"
              className="btn-primary text-xs"
            >
              Buka Dompet / Ledger
            </Link>
            <Link
              href="/market"
              className="py-3 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-foreground font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors"
            >
              Kembali Belanja
            </Link>
          </div>
        </div>
      </div>
    )
  }


  const renderCoupons = () => (
    <div className="bg-surface-container/30 border border-border-subtle p-5 rounded-[var(--radius-brand)] space-y-3">
      <h4 className="font-sora text-xs font-bold text-foreground mb-1">🏷️ Kupon Diskon</h4>
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="DISKON10, Saloka.id"
          className="flex-1 px-3 py-2 bg-surface border border-border-subtle rounded text-xs text-foreground placeholder:text-foreground/70/40 focus:outline-none focus:border-primary/50"
        />
        <button
          type="button"
          onClick={() => handleApplyCoupon(couponCode)}
          className="btn-primary text-[11px]"
        >
          PASANG
        </button>
      </div>

      {couponError && <p className="text-[10px] text-red-400 font-semibold">{couponError}</p>}
      {couponSuccess && <p className="text-[10px] text-green-400 font-semibold">{couponSuccess}</p>}
      <div className="text-[9px] text-foreground/70/60 leading-relaxed">
        Kupon Demo: <strong>DISKON10</strong> (10%), <strong>Saloka.id</strong> (Rp 20.000), <strong>GRATISONGKIR</strong>.
      </div>
    </div>
  )


  const renderSimulatePanel = () => (
    (pendingOrderId || manualOrderId) && (
      <div className="border border-yellow-500/20 bg-yellow-500/5 p-6 rounded-[var(--radius-brand)] mt-6">
        <span className="block text-[10px] font-geist font-bold text-yellow-500 uppercase tracking-widest mb-2">
          🛠️ Panel Simulasi & Verifikasi Midtrans Sandbox / Offline
        </span>
        <p className="text-[10px] text-foreground/70 mb-4 leading-relaxed">
          Gunakan panel ini untuk memverifikasi transaksi secara manual atau klik <strong>Simulasikan Berhasil</strong> untuk memproses checkout secara instan untuk pengujian offline.
        </p>
        
        <div className="flex flex-col gap-2">
          <div className="text-[10px] text-foreground/70 font-mono break-all bg-surface-container/55 p-2 rounded border border-border-subtle">
            <strong>Order ID:</strong> {pendingOrderId || 'Belum ada'}
          </div>
          <input
            type="text"
            value={manualOrderId || pendingOrderId || ''}
            onChange={(e) => setManualOrderId(e.target.value)}
            placeholder="Masukkan Order ID manual jika ada"
            className="w-full h-10 px-3 bg-surface-container border border-border-subtle rounded text-xs text-foreground focus:outline-none focus:border-primary/50"
          />
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              disabled={isVerifying || (!manualOrderId && !pendingOrderId)}
              onClick={() => verifyCheckout(manualOrderId || pendingOrderId || '', false)}
              className="flex-1 h-10 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-primary font-geist font-bold text-[10px] uppercase tracking-wider rounded transition-colors"
            >
              Cek Status
            </button>
            <button
              type="button"
              disabled={isVerifying || (!manualOrderId && !pendingOrderId)}
              onClick={() => verifyCheckout(manualOrderId || pendingOrderId || '', true)}
              className="flex-1 h-10 bg-yellow-600 hover:bg-yellow-500 text-black font-geist font-bold text-[10px] uppercase tracking-wider rounded transition-colors"
            >
              Simulasikan
            </button>
          </div>
        </div>
      </div>
    )
  )

  const renderAffiliateIdCard = () => {
    if (!affiliateId) return null;
    return (
      <div className="btn-primary border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-primary font-sora font-extrabold text-xs">
          <span className="btn-primary w-2 animate-pulse" />
          Tautan Referral Teman Aktif
        </div>
        <p className="text-[11px] text-foreground/70 mt-1.5 leading-relaxed">
          Pesanan ini terhubung dengan kode referensi <strong className="text-foreground">{affiliateId}</strong>. Komisi belanja akan otomatis dialokasikan ke teman Anda.
        </p>
      </div>
    );
  };


  return (
    <div className="relative min-h-screen bg-surface pt-12 pb-24 px-6 md:px-10">
      {/* Load Midtrans Snap dynamically */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-sFQP1v53tr2M3CQd'}
        strategy="afterInteractive"
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(45,178,74,0.03)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1200px] mx-auto">
        <h1 className="font-sora text-2xl font-bold text-foreground mb-1">
          Checkout <span className="text-[#0F5132]">Pesanan.</span>
        </h1>
        <p className="text-xs text-foreground/70 mb-8 font-geist">
          Selesaikan pesanan Anda dengan data pengiriman dan opsi kurir real-time.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-[var(--radius-brand)] bg-red-500/10 border border-red-500/20 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-[var(--radius-brand)] bg-green-500/10 border border-green-500/20 text-xs text-green-600 font-medium">
            {successMessage}
          </div>
        )}

        {cartDetails.length === 0 ? (
          <div className="text-center py-20 border border-border-subtle bg-surface rounded-[var(--radius-brand)] shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300 mx-auto mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <h3 className="font-sora text-base font-bold text-foreground mb-2">Keranjang Anda Kosong</h3>
            <p className="text-xs text-foreground/70 max-w-xs mx-auto mb-6">
              Jelajahi pasar kami dan temukan produk terbaik untuk kebutuhan Anda.
            </p>
            <Link
              href="/market"
              className="px-5 py-2.5 bg-[#2DB24A] hover:bg-[#2DB24A]/95 text-white font-geist font-bold text-xs uppercase tracking-wider rounded-[var(--radius-brand)] transition-colors inline-block shadow-sm"
            >
              Belanja Sekarang
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fadeIn text-foreground">
            
            {/* Left Column: Delivery Address & Shop Groups */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 1. Shopee-Style Shipping Address Card */}
              <div className="bg-surface border border-border-subtle rounded-[var(--radius-brand)] shadow-sm overflow-hidden relative">
                {/* Diagonal repeating blue/red Shopee-style address ribbon */}
                <div 
                />
                
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-secondary font-sora font-extrabold text-sm">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      Alamat Pengiriman
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestGps}
                      className={`px-3 py-1 rounded-full text-[10px] font-geist font-bold uppercase tracking-wider transition-colors border ${
                        useGps
                          ? 'bg-green-500/10 border-green-500/30 text-green-600'
                          : 'bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary'
                      }`}
                    >
                      {useGps ? '📍 GPS Aktif' : 'Gunakan GPS'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Name & Phone */}
                    <div className="font-bold border-r border-border-subtle pr-4">
                      <p className="text-foreground text-[13px]">{currentUser?.name || 'Nama Penerima'}</p>
                      <p className="text-foreground/70 text-[11px] mt-1 font-geist">{currentUser?.email || ''}</p>
                    </div>

                    {/* Detail Address & Maps preview */}
                    <div className="md:col-span-2 space-y-3">
                      {/* Address query search */}
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={addressSearchQuery}
                          onChange={e => setAddressSearchQuery(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleGeocodeSearch() }}
                          placeholder="Cari lokasi/alamat tujuan..."
                          className="flex-1 px-3 py-1.5 bg-surface-container-low border border-border-subtle rounded-[var(--radius-brand)] text-xs placeholder:text-foreground/70/40 text-foreground focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={handleGeocodeSearch}
                          className="px-3 py-1.5 bg-[#0F5132] hover:bg-[#0F5132]/95 text-white font-geist font-bold text-[10px] uppercase tracking-wider rounded-[var(--radius-brand)] transition-all"
                        >
                          Cari
                        </button>
                      </div>

                      {/* Detailed Shipping Address Textarea */}
                      <textarea
                        rows={2}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Detail alamat (Nama jalan, RT/RW, no rumah, kelurahan, kecamatan)..."
                        className="w-full px-3 py-2 bg-surface-container-low border border-border-subtle rounded-[var(--radius-brand)] text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-foreground/70/40"
                      />

                      {/* Draggable Map Preview (Compact & Light theme) */}
                      <div className="border border-border-subtle rounded-[var(--radius-brand)] overflow-hidden shadow-sm">
                        <div className="px-3 py-2 bg-surface-container-low border-b border-border-subtle flex justify-between items-center text-[10px] font-geist text-foreground/70">
                          <span>Geser pin peta untuk titik jemput akurat:</span>
                          <span className="font-bold text-primary">{distanceText || `${avgDistance.toFixed(1)} km`}</span>
                        </div>
                        
                        {apiKey && isLoaded ? (
                          <div className="w-full h-40">
                            <GoogleMap
                              mapContainerStyle={{ width: '100%', height: '100%' }}
                              center={getBuyerCoordsObj()}
                              zoom={13}
                              options={{
                                styles: [],
                                disableDefaultUI: true,
                                zoomControl: true,
                                mapTypeControl: false,
                                streetViewControl: false,
                              }}
                              onLoad={map => setMap(map)}
                            >
                              <Marker
                                position={getSellerCoords()}
                                label={{ text: '🏪', fontSize: '14px' }}
                                title="Merchant"
                              />
                              <Marker
                                position={getBuyerCoordsObj()}
                                draggable={true}
                                onDragEnd={handleMarkerDragEnd}
                                label={{ text: '📍', fontSize: '14px' }}
                                title="Tujuan Anda (Seret Pin)"
                              />
                            </GoogleMap>
                          </div>
                        ) : (
                          <div className="relative w-full h-32 bg-[#EEF2F7] flex flex-col items-center justify-center p-4 text-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25A7.5 7.5 0 1119.5 10.5z"/></svg>
                            <p className="text-[10px] text-foreground/70 mt-1.5 leading-relaxed">
                              Estimasi jarak: <strong className="text-foreground">{distanceText || `${avgDistance.toFixed(1)} km`}</strong> ({durationText || '1 jam 30 menit'})
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Cities preset selector */}
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-foreground/70 uppercase tracking-wider">Kota Tujuan Cepat:</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(mockCities).map(key => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                const city = mockCities[key];
                                setBuyerCoords({ latitude: city.lat, longitude: city.lng });
                                setSelectedMockCity(key);
                                setUseGps(true);
                                setShippingAddress(city.name);
                              }}
                              className={`px-2 py-0.5 border rounded-md text-[9px] font-bold transition-all ${
                                selectedMockCity === key
                                  ? 'bg-[#0F5132] border-[#0F5132] text-white'
                                  : 'bg-surface border-border-subtle text-foreground/70 hover:text-foreground'
                              }`}
                            >
                              {mockCities[key].name.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Shop Groupings (Produk Dipesan) */}
              <div className="space-y-4">
                {(() => {
                  // Group items by merchantId
                  const groups: Record<string, typeof cartDetails> = {};
                  cartDetails.forEach(item => {
                    const mId = item.merchantId || 'unknown';
                    if (!groups[mId]) groups[mId] = [];
                    groups[mId].push(item);
                  });

                  return Object.entries(groups).map(([mId, items]) => {
                    const shopName = items[0]?.merchant?.name || 'Toko UMKM';
                    
                    return (
                      <div key={mId} className="bg-surface border border-border-subtle rounded-[var(--radius-brand)] shadow-sm p-5 space-y-4">
                        {/* Shop Header */}
                        <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-secondary"><path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4L3 12v2c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3zm-12 1H6v-2h3v2zm5 0h-3v-2h3v2zm4 0h-3v-2h3v2z"/></svg>
                          <span className="font-sora font-extrabold text-xs text-secondary">{shopName}</span>
                        </div>

                        {/* Items rows */}
                        <div className="space-y-4">
                          {items.map(item => {
                            const wholesalePrice = getProductPriceWithWholesale(item.price, item.quantity);
                            const hasDiscount = wholesalePrice < item.price;
                            const isOwnProduct = currentUser && item.merchantId === currentUser.id;

                            return (
                              <div key={item.id} className="flex items-center gap-4 justify-between border-b border-border-subtle/50 pb-4 last:border-b-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 bg-surface-container-low rounded-[var(--radius-brand)] border border-border-subtle overflow-hidden flex-shrink-0 relative">
                                    {item.imageUrl ? (
                                      <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xl bg-slate-100">📦</div>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="font-bold text-xs text-foreground line-clamp-1">{item.title}</h4>
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-1.5 py-0.2 bg-[#2DB24A]/10 border border-[#2DB24A]/25 text-[7px] text-[#2DB24A] font-bold rounded uppercase">
                                        {item.category}
                                      </span>
                                      {isOwnProduct && (
                                        <span className="px-1.5 py-0.2 bg-red-500/10 border border-red-500/25 text-[7px] text-red-500 font-bold rounded uppercase">
                                          Own Product
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs font-bold text-secondary">
                                      {hasDiscount ? (
                                        <div className="flex items-center gap-1.5">
                                          <span className="line-through text-foreground/70/50 text-[10px]">Rp {item.price.toLocaleString('id-ID')}</span>
                                          <span>Rp {wholesalePrice.toLocaleString('id-ID')}</span>
                                        </div>
                                      ) : (
                                        <span>Rp {item.price.toLocaleString('id-ID')}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  {/* Qty selector */}
                                  <div className="flex items-center border border-border-subtle bg-surface-container-low rounded-md">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.stock)}
                                      className="px-2 py-1 text-xs hover:text-primary font-bold text-foreground/70"
                                    >
                                      -
                                    </button>
                                    <span className="px-2 text-[10px] text-foreground font-bold">{item.quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.stock)}
                                      className="px-2 py-1 text-xs hover:text-primary font-bold text-foreground/70"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* Delete item */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="text-red-500 hover:text-red-600 text-[10px] font-bold"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Courier / Shipping cost selection block inside this shop */}
                        <div className="bg-surface-container-low border border-border-subtle rounded-[var(--radius-brand)] p-4 mt-2 space-y-2.5">
                          <label className="block text-xs font-bold text-secondary">
                            Pilih Opsi Pengiriman ({shopName})
                          </label>
                          <div className="relative">
                            <select
                              value={selectedCourier}
                              onChange={(e) => setSelectedCourier(e.target.value)}
                              className="w-full px-3.5 py-3 bg-surface border border-border-subtle rounded-[var(--radius-brand)] text-xs text-foreground font-medium focus:outline-none focus:border-primary/50 cursor-pointer appearance-none pr-10 shadow-sm"
                            >
                              {courierRates.length === 0 ? (
                                <option value="" disabled>Menghitung ongkos kirim...</option>
                              ) : (
                                courierRates.map(rate => (
                                  <option key={rate.courier_code} value={rate.courier_code} className="bg-surface text-foreground">
                                    {rate.courier_name} ({rate.etd}) — Rp {rate.price.toLocaleString('id-ID')}
                                  </option>
                                ))
                              )}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-foreground/70">
                              <svg className="fill-current h-4 w-4 text-foreground/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  });
                })()}
              </div>

              {/* 3. Coupon / Voucher */}
              <div className="bg-surface border border-border-subtle rounded-[var(--radius-brand)] shadow-sm p-5">
                <div className="flex items-center gap-2 text-secondary font-sora font-extrabold text-sm border-b border-border-subtle pb-3 mb-4">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500"><path d="M2 17h20v2H2zm11.84-5.43L11.02 8.75l1.41-1.41 2.83 2.83zm-2.02-4.24l-2.83-2.83 1.41-1.41 2.83 2.83zM10 20c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z"/></svg>
                  Kupon Diskon
                </div>
                {renderCoupons()}
              </div>

            </div>

            {/* Right Column: Order Payout Summary & Payment Selectors */}
            <div className="space-y-6">
              
              {/* 4. Ledger Billing Summary */}
              <div className="bg-surface border border-border-subtle rounded-[var(--radius-brand)] shadow-sm p-5 space-y-4">
                <h3 className="font-sora font-extrabold text-secondary text-sm border-b border-border-subtle pb-3">
                  Ringkasan Belanja
                </h3>
                
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between text-foreground/70">
                    <span>Subtotal Produk</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex justify-between text-foreground/70">
                    <span>Total Ongkir</span>
                    <span>Rp {shippingFee.toLocaleString('id-ID')}</span>
                  </div>


                  {couponSuccess && activeCouponDiscount > 0 && (
                    <div className="flex justify-between text-[#2DB24A] bg-[#2DB24A]/5 px-2 py-1.5 rounded border border-[#2DB24A]/10 font-bold">
                      <span>Potongan Voucher</span>
                      <span>-Rp {activeCouponDiscount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  {affiliateId && (
                    <div className="flex justify-between text-secondary bg-secondary/5 px-2 py-1.5 rounded border border-secondary/10 font-bold">
                      <span>Komisi Referral (10% include)</span>
                      <span>Rp {(subtotal * 0.1).toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="border-t border-border-subtle pt-3.5 space-y-3">
                    <div className="flex justify-between items-center text-foreground font-bold">
                      <span className="text-sm">Total Pembayaran</span>
                      <span className="text-secondary font-black text-base font-geist">
                        Rp {total.toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="text-[10px] text-foreground/70/70 flex justify-between">
                      <span>Poin UMKM Diperoleh:</span>
                      <span className="text-primary font-bold">+{Math.round(total * 0.01)} Poin</span>
                    </div>
                    <div className="text-[10px] text-foreground/70/70 flex justify-between">
                      <span>Cashback Saloka (5%):</span>
                      <span className="text-secondary font-bold">Rp {Math.round(total * 0.05).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Payment selector */}
                <div className="border-t border-border-subtle pt-4 space-y-3">
                  <label className="block text-[10px] font-bold text-foreground/70 uppercase tracking-wider">Pilih Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MIDTRANS')}
                      className={`py-3 px-2.5 border rounded-[var(--radius-brand)] text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                        paymentMethod === 'MIDTRANS'
                          ? 'bg-secondary border-secondary text-white shadow-md'
                          : 'bg-surface border-border-subtle text-foreground/70 hover:border-slate-300'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                      Midtrans Snap
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('WALLET')}
                      className={`py-3 px-2.5 border rounded-[var(--radius-brand)] text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-0.5 ${
                        paymentMethod === 'WALLET'
                          ? 'bg-secondary border-secondary text-white shadow-md'
                          : 'bg-surface border-border-subtle text-foreground/70 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h1.08c-.05.32-.08.66-.08 1 0 2.21 1.79 4 4 4 .76 0 1.47-.22 2-.59.53.37 1.24.59 2 .59 2.21 0 4-1.79 4-4 0-.34-.03-.68-.08-1H20v6z"/></svg>
                        Dompet Saloka
                      </span>
                      {walletBalance !== null && (
                        <span className="text-[8px] font-normal opacity-90">Sld: Rp {walletBalance.toLocaleString('id-ID')}</span>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  id="cart-checkout"
                  onClick={handleCheckout}
                  disabled={isPending || isPendingCheckout || isVerifying || cart.length === 0 || hasOwnProduct}
                  className="w-full py-3.5 bg-[#2DB24A] hover:bg-[#2DB24A]/95 text-white font-geist font-bold text-xs uppercase tracking-wider rounded-[var(--radius-brand)] shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPendingCheckout ? 'Memproses Transaksi...' : (isVerifying ? 'Memverifikasi Pembayaran...' : (paymentMethod === 'WALLET' ? '⚡ 1-Click Checkout via Dompet' : 'Bayar & Selesaikan Order (Midtrans)'))}
                </button>

                {hasOwnProduct && (
                  <p className="text-[10px] text-red-500 font-semibold text-center mt-3 leading-relaxed bg-red-50 border border-red-200 p-2.5 rounded-[var(--radius-brand)]">
                    ⚠️ Terdapat produk Anda sendiri di keranjang belanja. Harap hapus produk Anda terlebih dahulu untuk checkout.
                  </p>
                )}
              </div>

              {renderAffiliateIdCard()}
              {renderSimulatePanel()}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
