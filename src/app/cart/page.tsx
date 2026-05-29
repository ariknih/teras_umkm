'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { getProducts } from '../actions/products'
import { checkoutCart, getWalletDetails } from '../actions/wallet-affiliate'
import { getCurrentUser } from '../actions/auth'
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api'

// Premium Dark Theme Style for Google Maps
const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#1e1d1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1e1d1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#c6a96b' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#e5c178' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#c6a96b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a1f16' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#688c53' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2925' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1d1b18' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8c8070' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4a4135' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2d271f' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#dfc08b' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#262421' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#c6a96b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#12151a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3a4454' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#12151a' }] }
];

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

  // A/B Testing Variant Selection
  const [variant, setVariant] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('A')

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

  // Bump Sales Options
  const [garansiPremium, setGaransiPremium] = useState(false)
  const [boxKayu, setBoxKayu] = useState(false)
  const [kertasKado, setKertasKado] = useState(false)

  // Coupons
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null)

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'MIDTRANS' | 'WALLET'>('MIDTRANS')

  // Wizard Steps (Variant B)
  const [wizardStep, setWizardStep] = useState<number>(1)

  // Google Maps state
  const [map, setMap] = useState<any>(null)
  const [directionsResponse, setDirectionsResponse] = useState<any>(null)
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

  useEffect(() => {
    if (cartDetails.length > 0) {
      const seller = getSellerCoords();
      const buyer = getBuyerCoordsObj();
      
      if (window.google && apiKey) {
        calculateRoute(seller, buyer);
      } else {
        const dist = getDistance(buyer.lat, buyer.lng, seller.lat, seller.lng);
        setShippingDistKm(dist);
        setDistanceText(`${dist.toFixed(1)} km`);
        setDurationText(dist < 50 ? '1 jam' : dist < 200 ? '4 jam' : '1 hari');
        updateCourierRates(dist);
      }
    }
  }, [buyerCoords, selectedMockCity, useGps, cartDetails.length, isLoaded]);

  const updateCourierRates = (distKm: number) => {
    const couriers = [
      { code: 'jne', name: 'JNE REG', ratePerKm: 2000, minFee: 9000 },
      { code: 'jnt', name: 'J&T Express', ratePerKm: 2100, minFee: 9000 },
      { code: 'sicepat', name: 'SiCepat REG', ratePerKm: 2200, minFee: 10000 },
      { code: 'tiki', name: 'TIKI REG', ratePerKm: 1800, minFee: 9000 },
      { code: 'pos', name: 'POS Indonesia', ratePerKm: 1500, minFee: 8000 },
    ];
    const etdByDist = (km: number) =>
      km < 50 ? '1-2 hari' : km < 200 ? '2-3 hari' : km < 800 ? '3-5 hari' : '5-7 hari';

    const rates = couriers.map((c) => ({
      courier_code: c.code,
      courier_name: c.name,
      price: Math.max(c.minFee, Math.round(distKm * c.ratePerKm / 100) * 100),
      etd: etdByDist(distKm),
    }));
    setCourierRates(rates);
    if (!selectedCourier || !rates.some(r => r.courier_code === selectedCourier)) {
      setSelectedCourier(rates[0].courier_code);
    }
  };

  const calculateRoute = async (origin: { lat: number, lng: number }, destination: { lat: number, lng: number }) => {
    if (!window.google) return;
    const directionsService = new window.google.maps.DirectionsService();
    try {
      const results = await directionsService.route({
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      setDirectionsResponse(results);
      if (results.routes[0]?.legs[0]) {
        const leg = results.routes[0].legs[0];
        const distKm = (leg.distance?.value ?? 0) / 1000;
        setShippingDistKm(distKm);
        setDistanceText(leg.distance?.text || `${distKm.toFixed(1)} km`);
        setDurationText(leg.duration?.text || '');
        updateCourierRates(distKm);
      }
    } catch (err) {
      console.error('Directions request failed:', err);
    }
  };

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
    try {
      const storedCart = localStorage.getItem('teras_cart')
      const storedAff = localStorage.getItem('teras_affiliate_id')
      if (storedCart) {
        setCart(JSON.parse(storedCart))
      }
      if (storedAff) {
        setAffiliateId(storedAff)
      }
    } catch (e) {
      console.error('Failed to parse cart items', e)
    }

    async function loadData() {
      try {
        const u = await getCurrentUser()
        setCurrentUser(u)
        
        const list = await getProducts()
        setProducts(list as any)

        // Clean up cart from items that do not exist in database products list
        const storedCart = localStorage.getItem('teras_cart')
        if (storedCart) {
          try {
            const parsedCart: CartItem[] = JSON.parse(storedCart)
            const validCart = parsedCart.filter(item => list.some((p: any) => p.id === item.productId))
            if (validCart.length !== parsedCart.length) {
              setCart(validCart)
              localStorage.setItem('teras_cart', JSON.stringify(validCart))
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

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem('teras_cart', JSON.stringify(newCart))
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
        localStorage.removeItem('teras_cart')
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
    const courierRateMap: Record<string, { ratePerKm: number; minFee: number }> = {
      jne: { ratePerKm: 2000, minFee: 9000 },
      pos: { ratePerKm: 1500, minFee: 8000 },
      tiki: { ratePerKm: 1800, minFee: 9000 },
      sicepat: { ratePerKm: 2200, minFee: 10000 },
      jnt: { ratePerKm: 2100, minFee: 9000 },
    }
    const cr = courierRateMap[selectedCourier] || courierRateMap.jne
    return Math.max(cr.minFee, Math.round(dist * cr.ratePerKm))
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

  // Bump Sales Sum
  let bumpSalesTotal = 0
  if (garansiPremium) bumpSalesTotal += 25000
  if (boxKayu) bumpSalesTotal += 15000
  if (kertasKado) bumpSalesTotal += 5000

  // Recalculate coupon discount reactively
  let activeCouponDiscount = couponDiscount
  if (couponSuccess) {
    const upper = couponCode.toUpperCase()
    if (upper === 'DISKON10') {
      activeCouponDiscount = subtotal * 0.1
    } else if (upper === 'TERASUMKM') {
      activeCouponDiscount = Math.min(20000, subtotal)
    } else if (upper === 'GRATISONGKIR') {
      activeCouponDiscount = shippingFee
    }
  } else {
    activeCouponDiscount = 0
  }

  const total = Math.max(0, subtotal + shippingFee + bumpSalesTotal - activeCouponDiscount)
  const hasOwnProduct = cartDetails.some((item) => currentUser && item.merchantId === currentUser.id)

  const handleApplyCoupon = (code: string) => {
    setCouponError(null)
    setCouponSuccess(null)
    const upperCode = code.trim().toUpperCase()
    if (upperCode === 'DISKON10') {
      setCouponSuccess('Kupon DISKON10 berhasil dipasang! (Diskon 10%)')
    } else if (upperCode === 'TERASUMKM') {
      setCouponSuccess('Kupon TERASUMKM berhasil dipasang! (Diskon Rp 20.000)')
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

    const activeBumps = []
    if (garansiPremium) activeBumps.push('GARANSI_PREMIUM')
    if (boxKayu) activeBumps.push('BOX_KAYU')
    if (kertasKado) activeBumps.push('KERTAS_KADO')

    const shippingDetails = {
      shippingFee,
      courier: selectedCourier.toUpperCase(),
      shippingAddress: shippingAddress || `Terkirim ke ${useGps ? 'GPS Lokasi' : mockCities[selectedMockCity].name}`,
      couponCode: couponSuccess ? couponCode.toUpperCase() : undefined,
      discountAmount: activeCouponDiscount,
      bumpSales: activeBumps.join(',') || undefined
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

        localStorage.removeItem('teras_cart')
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
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark">
        <span className="text-xs font-geist font-bold text-primary tracking-widest uppercase animate-pulse">
          Memuat Keranjang Belanja Premium...
        </span>
      </div>
    )
  }

  if (checkoutSuccess) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark py-12 px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.06)_0%,transparent_65%)] pointer-events-none z-0" />
        <div className="relative z-10 w-full max-w-md text-center border border-border-subtle bg-surface-dark glow-card p-8 rounded-lg">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="font-sora text-2xl font-bold text-text-primary mb-3">Transaksi Berhasil!</h2>
          <p className="text-xs text-text-secondary leading-relaxed mb-4">
            Pembayaran Anda telah diaudit dan disinkronkan ke ledger kami. 
          </p>
          <div className="bg-primary/5 border border-primary/10 rounded p-3 mb-8 text-left text-[11px] text-text-secondary space-y-1">
            <div className="flex justify-between"><span className="text-text-secondary/60">Points Diperoleh (1%):</span><span className="text-primary font-bold">+{Math.round(total * 0.01)} Poin</span></div>
            <div className="flex justify-between"><span className="text-text-secondary/60">Cashback Wallet (5%):</span><span className="text-primary font-bold">Rp {Math.round(total * 0.05).toLocaleString('id-ID')}</span></div>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/wallet"
              className="py-3 bg-primary hover:bg-primary/95 text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors"
            >
              Buka Dompet / Ledger
            </Link>
            <Link
              href="/market"
              className="py-3 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-text-primary font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors"
            >
              Kembali Belanja
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // RENDER SELLER & CART DETAILS COMMON VIEW FOR SIMPLE RETRIEVAL
  const renderItemRows = () => (
    <div className="space-y-4">
      {cartDetails.map((item) => {
        const wholesalePrice = getProductPriceWithWholesale(item.price, item.quantity)
        const hasDiscount = wholesalePrice < item.price
        const isOwnProduct = currentUser && item.merchantId === currentUser.id
        return (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 border border-border-subtle bg-surface-dark/90 rounded-lg justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-surface-container rounded border border-border-subtle overflow-hidden relative flex items-center justify-center flex-shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-[8px] font-bold text-primary/40 uppercase">{item.category}</span>
                )}
              </div>
              <div>
                <h3 className="font-sora text-xs font-bold text-text-primary mb-1 line-clamp-1">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block px-1.5 py-0.2 bg-primary/10 border border-primary/20 rounded text-[7px] font-geist font-bold text-primary uppercase tracking-wider">
                    {item.category}
                  </span>
                  {isOwnProduct && (
                    <span className="inline-block px-1.5 py-0.2 bg-red-500/20 border border-red-500/35 rounded text-[7px] font-geist font-bold text-red-400 uppercase tracking-wider animate-pulse">
                      Produk Anda
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-primary">
                  {hasDiscount ? (
                    <span className="flex items-center gap-1.5">
                      <span className="line-through text-text-secondary/60 text-[10px]">Rp {item.price.toLocaleString('id-ID')}</span>
                      <span>Rp {wholesalePrice.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] text-green-400 font-normal">(Grosir Qty {item.quantity})</span>
                    </span>
                  ) : (
                    <span>Rp {item.price.toLocaleString('id-ID')}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border-subtle bg-surface-container rounded">
                <button
                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.stock)}
                  className="px-2 py-0.5 hover:text-primary transition-colors text-xs font-bold"
                >
                  -
                </button>
                <span className="px-2.5 py-0.5 text-[10px] text-text-primary font-bold">
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.stock)}
                  className="px-2 py-0.5 hover:text-primary transition-colors text-xs font-bold"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="text-[10px] font-semibold text-red-400 hover:text-red-300 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderShippingOptions = () => (
    <div className="bg-surface-container/30 border border-border-subtle p-5 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-sora text-xs font-bold text-text-primary flex items-center gap-2">
          🚚 Hitung Ongkos Kirim Real
          {apiKey && isLoaded && (
            <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/30 text-primary rounded text-[8px] font-geist">GOOGLE MAPS</span>
          )}
        </h4>
        <button
          type="button"
          onClick={handleRequestGps}
          className={`px-2.5 py-1 rounded text-[9px] font-geist font-bold uppercase tracking-wider transition-colors border ${
            useGps
              ? 'bg-green-500/20 border-green-500/30 text-green-400'
              : 'bg-primary/10 border-primary/20 hover:bg-primary/25 text-primary'
          }`}
        >
          {useGps ? '📍 GPS AKTIF' : 'GUNAKAN GPS'}
        </button>
      </div>

      {/* Geocoding Address Search Bar */}
      <div className="space-y-2 relative">
        <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider">Cari Alamat Tujuan</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={addressSearchQuery}
            onChange={e => setAddressSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleGeocodeSearch() }}
            placeholder="Masukkan alamat pengiriman... (Cari via Google Geocoding)"
            className="flex-1 px-3 py-2 bg-surface-dark border border-border-subtle rounded text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50"
          />
          <button
            type="button"
            onClick={handleGeocodeSearch}
            className="px-4 py-2 bg-primary hover:bg-primary/95 text-surface-dark font-geist font-bold text-[10px] uppercase tracking-wider rounded transition-all"
          >
            Cari
          </button>
        </div>
      </div>

      {/* 🗺️ DYNAMIC GOOGLE MAPS CARD */}
      <div className="border border-border-subtle bg-neutral-950 rounded-lg p-4 space-y-3 shadow-inner">
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-bold text-text-primary flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Peta Rute Pengiriman
          </span>
          <span className="text-[9px] text-text-secondary/70 font-geist">
            Toko: {cartDetails[0]?.merchant?.name || 'Artisan Toko'}
          </span>
        </div>

        {apiKey && isLoaded ? (
          <div className="w-full h-64 bg-[#12151a] border border-border-subtle/50 rounded overflow-hidden relative shadow">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={getBuyerCoordsObj()}
              zoom={12}
              options={{
                styles: mapStyles,
                disableDefaultUI: true,
                zoomControl: true,
              }}
              onLoad={map => setMap(map)}
            >
              {/* Seller marker */}
              <Marker
                position={getSellerCoords()}
                label={{ text: '🏪', fontSize: '16px' }}
                title={cartDetails[0]?.merchant?.name || 'Toko'}
              />

              {/* Draggable Buyer marker */}
              <Marker
                position={getBuyerCoordsObj()}
                draggable={true}
                onDragEnd={handleMarkerDragEnd}
                label={{ text: '📍', fontSize: '16px' }}
                title="Tujuan Anda (Seret Pin)"
              />

              {/* Render route lines */}
              {directionsResponse && (
                <DirectionsRenderer
                  directions={directionsResponse}
                  options={{
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: '#c6a96b',
                      strokeWeight: 4.5,
                      strokeOpacity: 0.85
                    }
                  }}
                />
              )}
            </GoogleMap>
          </div>
        ) : (
          /* PRESTIGE FALLBACK WITH VECTOR RADAR SIMULATION */
          <div className="relative w-full h-44 bg-[#0a0c10] border border-border-subtle/50 rounded overflow-hidden flex flex-col items-center justify-center p-6 text-center">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(198,169,107,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(198,169,107,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70">
              <circle cx="20%" cy="50%" r="5" fill="#c6a96b" className="animate-pulse" />
              <text x="20%" y="35%" fill="#c6a96b" fontSize="8" fontWeight="bold" textAnchor="middle">🏪 Toko</text>
              <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="#c6a96b" strokeWidth="1.5" strokeDasharray="4,4" />
              <circle cx="80%" cy="50%" r="5" fill="#3b82f6" />
              <text x="80%" y="35%" fill="#3b82f6" fontSize="8" fontWeight="bold" textAnchor="middle">📍 Tujuan (Draggable Fallback)</text>
            </svg>
            <div className="relative z-20 max-w-xs mt-16 bg-neutral-950/80 border border-primary/20 backdrop-blur px-3 py-2 rounded">
              <p className="text-[9px] text-[#e5c178] leading-relaxed">
                {apiKey ? 'Menghubungkan ke layanan Google Maps...' : 'Google Maps API Key belum dipasang di .env. Menggunakan penghitungan rute jarak presisi (Haversine & Presets).'}
              </p>
            </div>
          </div>
        )}

        {/* Dynamic route duration and distance summary banner */}
        <div className="flex justify-between items-center bg-surface-dark border border-border-subtle p-3 rounded-lg text-xs">
          <div>
            <p className="text-[9px] text-text-secondary uppercase">Jarak Tempuh</p>
            <p className="font-extrabold text-primary">{distanceText || `${avgDistance.toFixed(1)} km`}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-text-secondary uppercase">Estimasi Waktu</p>
            <p className="font-bold text-text-primary">{durationText || '1 jam 30 menit'}</p>
          </div>
        </div>

        {/* Presets selectors */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[8px] font-bold text-text-secondary uppercase tracking-wider">Ganti Lokasi Cepat (Kota Mock):</p>
          <div className="flex flex-wrap gap-1.5">
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
                className={`px-2 py-0.5 border rounded text-[8px] font-bold transition-all ${
                  selectedMockCity === key
                    ? 'bg-primary border-primary text-surface-dark'
                    : 'bg-surface-dark border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                {mockCities[key].name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courier Options List */}
      <div className="space-y-2">
        <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider">
          Pilih Layanan Kurir Pengiriman
        </label>
        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {courierRates.map((rate) => (
            <button
              key={`${rate.courier_code}-${rate.price}`}
              type="button"
              onClick={() => setSelectedCourier(rate.courier_code)}
              className={`w-full flex justify-between items-center px-3 py-2 border rounded text-xs transition-colors ${
                selectedCourier === rate.courier_code
                  ? 'bg-primary/15 border-primary/50 text-text-primary'
                  : 'bg-surface-dark border-border-subtle text-text-secondary hover:border-primary/30'
              }`}
            >
              <span className="font-bold">{rate.courier_name || rate.courier_code.toUpperCase()}</span>
              <span className="flex items-center gap-2">
                <span className="text-[10px] text-text-secondary">{rate.etd}</span>
                <span className={`font-extrabold ${selectedCourier === rate.courier_code ? 'text-primary' : 'text-text-primary'}`}>
                  Rp {rate.price.toLocaleString('id-ID')}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider">Alamat Pengiriman Lengkap</label>
        <input
          type="text"
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
          placeholder="Nama Jalan, Blok, RT/RW, Kelurahan, Kecamatan, Kota..."
          className="w-full px-3 py-2 bg-surface-dark border border-border-subtle rounded text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50"
        />
      </div>

      <div className="flex justify-between items-center text-[11px] border-t border-border-subtle pt-3">
        <span className="text-text-secondary">Est. Jarak:</span>
        <span className="font-semibold text-text-primary">{distanceText || `${avgDistance.toFixed(1)} km`}</span>
      </div>
      <div className="flex justify-between items-center text-[11px]">
        <span className="text-text-secondary">Ongkir ({selectedCourier?.toUpperCase()}):</span>
        <span className="font-bold text-primary">Rp {shippingFee.toLocaleString('id-ID')}</span>
      </div>
    </div>
  )

  const renderBumpSales = () => (
    <div className="bg-surface-container/30 border border-border-subtle p-5 rounded-lg space-y-3">
      <h4 className="font-sora text-xs font-bold text-text-primary mb-1">🎁 Tambah Bump Sale (Add-on Product)</h4>
      
      <label className="flex items-center gap-3 p-2 bg-surface-dark border border-border-subtle rounded hover:border-primary/40 cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={garansiPremium}
          onChange={(e) => setGaransiPremium(e.target.checked)}
          className="accent-primary w-4 h-4 rounded cursor-pointer"
        />
        <div className="flex-1 text-[11px]">
          <div className="font-bold text-text-primary">Garansi Premium 1 Tahun (+Rp 25.000)</div>
          <div className="text-[9px] text-text-secondary">Garansi rusak ganti baru instan.</div>
        </div>
      </label>

      <label className="flex items-center gap-3 p-2 bg-surface-dark border border-border-subtle rounded hover:border-primary/40 cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={boxKayu}
          onChange={(e) => setBoxKayu(e.target.checked)}
          className="accent-primary w-4 h-4 rounded cursor-pointer"
        />
        <div className="flex-1 text-[11px]">
          <div className="font-bold text-text-primary">Kemasan Box Kayu Premium (+Rp 15.000)</div>
          <div className="text-[9px] text-text-secondary">Proteksi ekstra kokoh dan elegan.</div>
        </div>
      </label>

      <label className="flex items-center gap-3 p-2 bg-surface-dark border border-border-subtle rounded hover:border-primary/40 cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={kertasKado}
          onChange={(e) => setKertasKado(e.target.checked)}
          className="accent-primary w-4 h-4 rounded cursor-pointer"
        />
        <div className="flex-1 text-[11px]">
          <div className="font-bold text-text-primary">Bungkus Kertas Kado (+Rp 5.000)</div>
          <div className="text-[9px] text-text-secondary">Sertakan pita dan kartu ucapan.</div>
        </div>
      </label>
    </div>
  )

  const renderCoupons = () => (
    <div className="bg-surface-container/30 border border-border-subtle p-5 rounded-lg space-y-3">
      <h4 className="font-sora text-xs font-bold text-text-primary mb-1">🏷️ Kupon Diskon</h4>
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="Contoh: DISKON10, TERASUMKM"
          className="flex-1 px-3 py-2 bg-surface-dark border border-border-subtle rounded text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50"
        />
        <button
          type="button"
          onClick={() => handleApplyCoupon(couponCode)}
          className="px-4 bg-primary hover:bg-primary/90 text-surface-dark font-geist font-bold text-[11px] uppercase tracking-wider rounded transition-colors"
        >
          PASANG
        </button>
      </div>

      {couponError && <p className="text-[10px] text-red-400 font-semibold">{couponError}</p>}
      {couponSuccess && <p className="text-[10px] text-green-400 font-semibold">{couponSuccess}</p>}
      <div className="text-[9px] text-text-secondary/60 leading-relaxed">
        Kupon Demo: <strong>DISKON10</strong> (10%), <strong>TERASUMKM</strong> (Rp 20.000), <strong>GRATISONGKIR</strong>.
      </div>
    </div>
  )

  const renderOrderSummary = () => (
    <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg space-y-4 shadow-lg relative overflow-hidden">
      {paymentMethod === 'WALLET' && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      )}
      
      <h3 className="font-sora text-sm font-bold text-text-primary mb-2 pb-3 border-b border-border-subtle">
        Ringkasan Tagihan
      </h3>
      
      <div className="space-y-3 text-xs">
        <div className="flex justify-between text-text-secondary">
          <span>Subtotal (Grosir include)</span>
          <span>Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>
        
        <div className="flex justify-between text-text-secondary">
          <span>Ongkir ({selectedCourier.toUpperCase()})</span>
          <span>Rp {shippingFee.toLocaleString('id-ID')}</span>
        </div>

        {bumpSalesTotal > 0 && (
          <div className="flex justify-between text-text-secondary">
            <span>Add-ons (Bump Sales)</span>
            <span>Rp {bumpSalesTotal.toLocaleString('id-ID')}</span>
          </div>
        )}

        {couponSuccess && activeCouponDiscount > 0 && (
          <div className="flex justify-between text-green-400 font-medium bg-green-500/5 px-2 py-1.5 rounded border border-green-500/10">
            <span>Kupon Potongan</span>
            <span>-Rp {activeCouponDiscount.toLocaleString('id-ID')}</span>
          </div>
        )}

        {affiliateId && (
          <div className="flex justify-between text-primary font-medium bg-primary/5 px-2 py-1.5 rounded border border-primary/10">
            <span>Komisi Afiliasi (10% include)</span>
            <span>Rp {(subtotal * 0.1).toLocaleString('id-ID')}</span>
          </div>
        )}

        <div className="border-t border-border-subtle pt-3 space-y-3">
          <div className="flex justify-between items-center text-text-primary font-bold">
            <span>Total Bayar</span>
            <span className="text-primary font-extrabold text-sm">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="text-[10px] text-text-secondary/70 flex justify-between">
            <span>Points Diperoleh (1%):</span>
            <span className="text-primary font-bold">+{Math.round(total * 0.01)} Poin</span>
          </div>
          <div className="text-[10px] text-text-secondary/70 flex justify-between">
            <span>Estimasi Cashback (5%):</span>
            <span className="text-primary font-bold">Rp {Math.round(total * 0.05).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="bg-surface-container/60 p-3 rounded-lg border border-border-subtle space-y-2 mt-4">
        <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider">Metode Pembayaran</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod('MIDTRANS')}
            className={`py-2.5 border rounded text-[10px] font-geist font-bold uppercase tracking-wider transition-colors ${
              paymentMethod === 'MIDTRANS'
                ? 'bg-primary border-primary text-surface-dark'
                : 'bg-surface-dark border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            Midtrans Snap
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('WALLET')}
            className={`py-2.5 border rounded text-[10px] font-geist font-bold uppercase tracking-wider transition-colors flex flex-col items-center justify-center ${
              paymentMethod === 'WALLET'
                ? 'bg-primary border-primary text-surface-dark'
                : 'bg-surface-dark border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>Dompet Teras</span>
            {walletBalance !== null && (
              <span className="text-[8px] opacity-75 font-normal">Saldo: Rp {walletBalance.toLocaleString('id-ID')}</span>
            )}
          </button>
        </div>
      </div>

      <button
        id="cart-checkout"
        onClick={handleCheckout}
        disabled={isPending || isPendingCheckout || isVerifying || cart.length === 0 || hasOwnProduct}
        className="w-full py-4 bg-primary hover:bg-primary/95 text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {isPendingCheckout ? 'Memproses Transaksi...' : (isVerifying ? 'Memverifikasi Pembayaran...' : (paymentMethod === 'WALLET' ? '⚡ 1-Click Checkout via Dompet' : 'Bayar & Selesaikan Order (Midtrans)'))}
      </button>

      {hasOwnProduct && (
        <p className="text-[10px] text-red-400 font-semibold text-center mt-3 leading-relaxed bg-red-500/10 border border-red-500/25 p-2.5 rounded">
          ⚠️ Terdapat produk Anda sendiri di keranjang belanja. Harap hapus produk Anda terlebih dahulu untuk checkout.
        </p>
      )}
    </div>
  )

  const renderSimulatePanel = () => (
    (pendingOrderId || manualOrderId) && (
      <div className="border border-yellow-500/20 bg-yellow-500/5 p-6 rounded-lg mt-6">
        <span className="block text-[10px] font-geist font-bold text-yellow-500 uppercase tracking-widest mb-2">
          🛠️ Panel Simulasi & Verifikasi Midtrans Sandbox / Offline
        </span>
        <p className="text-[10px] text-text-secondary mb-4 leading-relaxed">
          Gunakan panel ini untuk memverifikasi transaksi secara manual atau klik <strong>Simulasikan Berhasil</strong> untuk memproses checkout secara instan untuk pengujian offline.
        </p>
        
        <div className="flex flex-col gap-2">
          <div className="text-[10px] text-text-secondary font-mono break-all bg-surface-container/55 p-2 rounded border border-border-subtle">
            <strong>Order ID:</strong> {pendingOrderId || 'Belum ada'}
          </div>
          <input
            type="text"
            value={manualOrderId || pendingOrderId || ''}
            onChange={(e) => setManualOrderId(e.target.value)}
            placeholder="Masukkan Order ID manual jika ada"
            className="w-full h-10 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-primary/50"
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

  const renderAffiliateIdCard = () => (
    <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg">
      <span className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-3">
        Kode Referensi Afiliasi
      </span>
      <input
        id="cart-affiliate"
        type="text"
        value={affiliateId}
        onChange={(e) => setAffiliateId(e.target.value)}
        placeholder="Masukkan ID Afiliasi (opsional)"
        className="w-full px-4 py-2.5 bg-surface-container border border-border-subtle rounded text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50 transition-colors mb-2"
      />
      {affiliateId && (
        <p className="text-[10px] text-primary font-medium">
          ✓ Afiliasi terdeteksi. Komisi 10% akan dialokasikan saat checkout.
        </p>
      )}
    </div>
  )

  return (
    <div className="relative min-h-screen bg-bg-dark pt-12 pb-24 px-6 md:px-10">
      {/* Load Midtrans Snap dynamically */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-sFQP1v53tr2M3CQd'}
        strategy="afterInteractive"
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1200px] mx-auto">
        

        <h1 className="font-sora text-3xl font-bold text-text-primary mb-2">
          Keranjang <span className="text-primary">Belanja.</span>
        </h1>
        <p className="text-xs text-text-secondary mb-10">
          Pilih kurir, gunakan kupon, dan selesaikan pembayaran dengan aman.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-medium">
            {successMessage}
          </div>
        )}

        {cartDetails.length === 0 ? (
          <div className="text-center py-20 border border-border-subtle bg-surface-dark rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-text-secondary/30 mx-auto mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <h3 className="font-sora text-lg font-bold text-text-primary mb-2">Keranjang Anda Kosong</h3>
            <p className="text-xs text-text-secondary max-w-xs mx-auto mb-8">
              Jelajahi pasar premium kami dan temukan produk terbaik untuk kebutuhan Anda.
            </p>
            <Link
              href="/market"
              className="px-6 py-3 bg-primary hover:bg-primary-container text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors inline-block"
            >
              Belanja Sekarang
            </Link>
          </div>
        ) : (
          /* ========================================================
             RENDER RATHER THAN BASIC LAYOUT, DIVERGE ON SELECTED VARIANT
             ======================================================== */
          <div>
            {/* VARIANT A: Modern Glassmorphism Gold */}
            {variant === 'A' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
                <div className="lg:col-span-2 space-y-6">
                  {renderItemRows()}
                  {renderShippingOptions()}
                  {renderBumpSales()}
                  {renderCoupons()}
                </div>
                <div className="space-y-6">
                  {renderAffiliateIdCard()}
                  {renderOrderSummary()}
                  {renderSimulatePanel()}
                </div>
              </div>
            )}

            {/* VARIANT B: Multi-step Checkout Wizard */}
            {variant === 'B' && (
              <div className="border border-border-subtle bg-surface-dark/95 backdrop-blur rounded-lg p-6 md:p-8 animate-fadeIn">
                {/* Wizard Head Navigation */}
                <div className="flex items-center justify-between border-b border-border-subtle pb-6 mb-8">
                  {([
                    { num: 1, label: 'Audit Keranjang' },
                    { num: 2, label: 'Alamat & Kurir' },
                    { num: 3, label: 'Pembayaran' }
                  ] as const).map((step) => (
                    <div key={step.num} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-geist font-bold text-xs transition-colors ${
                        wizardStep >= step.num ? 'bg-primary text-surface-dark' : 'bg-surface-container text-text-secondary'
                      }`}>
                        {step.num}
                      </div>
                      <span className={`text-[10px] font-geist font-bold uppercase tracking-wider hidden sm:inline ${
                        wizardStep >= step.num ? 'text-primary' : 'text-text-secondary'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  <div className="lg:col-span-2 space-y-6">
                    {wizardStep === 1 && (
                      <div className="space-y-4">
                        <h3 className="font-sora text-sm font-bold text-text-primary">Step 1: Audit & Atur Kuantitas Produk</h3>
                        {renderItemRows()}
                      </div>
                    )}
                    {wizardStep === 2 && (
                      <div className="space-y-4">
                        <h3 className="font-sora text-sm font-bold text-text-primary">Step 2: Hitung Jarak & Ongkir</h3>
                        {renderShippingOptions()}
                      </div>
                    )}
                    {wizardStep === 3 && (
                      <div className="space-y-4 animate-fadeIn">
                        <h3 className="font-sora text-sm font-bold text-text-primary">Step 3: Tambahkan Add-ons & Selesaikan Checkout</h3>
                        {renderBumpSales()}
                        {renderCoupons()}
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center pt-4">
                      <button
                        type="button"
                        disabled={wizardStep === 1}
                        onClick={() => setWizardStep(prev => prev - 1)}
                        className="px-6 py-2.5 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-text-primary font-geist font-bold text-[10px] uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                      >
                        Kembali
                      </button>
                      {wizardStep < 3 ? (
                        <button
                          type="button"
                          onClick={() => setWizardStep(prev => prev + 1)}
                          className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-surface-dark font-geist font-bold text-[10px] uppercase tracking-wider rounded transition-colors"
                        >
                          Lanjut
                        </button>
                      ) : (
                        <div className="text-[10px] text-text-secondary">Siap melakukan pembayaran.</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {renderAffiliateIdCard()}
                    {renderOrderSummary()}
                    {renderSimulatePanel()}
                  </div>
                </div>
              </div>
            )}

            {/* VARIANT C: Minimalist Slate/Contrast */}
            {variant === 'C' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start font-mono animate-fadeIn text-xs text-text-primary">
                <div className="lg:col-span-2 space-y-6">
                  <div className="border-2 border-text-primary p-4 rounded-none bg-surface-container">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-4 border-b border-text-primary pb-2">01 / CART ITEMS</h3>
                    {renderItemRows()}
                  </div>
                  <div className="border-2 border-text-primary p-4 rounded-none bg-surface-container">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-4 border-b border-text-primary pb-2">02 / LOGISTICS CALCULATOR</h3>
                    {renderShippingOptions()}
                  </div>
                  <div className="border-2 border-text-primary p-4 rounded-none bg-surface-container">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-4 border-b border-text-primary pb-2">03 / PROMOS & BUMPS</h3>
                    <div className="space-y-4">
                      {renderBumpSales()}
                      {renderCoupons()}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="border-2 border-text-primary p-4 rounded-none bg-surface-container">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-4 border-b border-text-primary pb-2">04 / LEDGER SUMMARY</h3>
                    {renderAffiliateIdCard()}
                    <div className="mt-4">
                      {renderOrderSummary()}
                    </div>
                    {renderSimulatePanel()}
                  </div>
                </div>
              </div>
            )}

            {/* VARIANT D: Split screen with right sidebar summary */}
            {variant === 'D' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-surface-dark border border-border-subtle p-6 rounded-xl">
                    <h3 className="font-sora text-sm font-bold text-text-primary mb-4">Audit Keranjang</h3>
                    {renderItemRows()}
                  </div>
                  <div className="bg-surface-dark border border-border-subtle p-6 rounded-xl">
                    <h3 className="font-sora text-sm font-bold text-text-primary mb-4">Logistik & Lokasi</h3>
                    {renderShippingOptions()}
                  </div>
                </div>
                <div className="lg:col-span-5 space-y-6">
                  {renderAffiliateIdCard()}
                  {renderBumpSales()}
                  {renderCoupons()}
                  {renderOrderSummary()}
                  {renderSimulatePanel()}
                </div>
              </div>
            )}

            {/* VARIANT E: Retro Monospace Terminal Console */}
            {variant === 'E' && (
              <div className="bg-black border border-green-500 font-mono text-green-500 p-6 md:p-8 rounded shadow-[0_0_20px_rgba(34,197,94,0.15)] animate-fadeIn">
                <div className="text-[10px] mb-6 flex justify-between border-b border-green-500/30 pb-3">
                  <span>TERAS UMKM POS v3.4.1</span>
                  <span>DATE: {new Date().toISOString().substring(0, 10)}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="border border-green-500/40 p-4 rounded bg-black">
                      <span className="block text-[11px] font-bold text-green-400 mb-3">{'>'} CAT /ETC/CART_ITEMS</span>
                      {renderItemRows()}
                    </div>
                    <div className="border border-green-500/40 p-4 rounded bg-black">
                      <span className="block text-[11px] font-bold text-green-400 mb-3">{'>'} SH LOGISTICS_PING.SH</span>
                      {renderShippingOptions()}
                    </div>
                    <div className="border border-green-500/40 p-4 rounded bg-black">
                      <span className="block text-[11px] font-bold text-green-400 mb-3">{'>'} RUN OPTIMIZATIONS --PROMO --BUMP</span>
                      <div className="space-y-4">
                        {renderBumpSales()}
                        {renderCoupons()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="border border-green-500/40 p-4 rounded bg-black">
                      <span className="block text-[11px] font-bold text-green-400 mb-3">{'>'} CAT BILLING_LEDGER.TXT</span>
                      {renderAffiliateIdCard()}
                      <div className="mt-4 text-green-500">
                        {renderOrderSummary()}
                      </div>
                      {renderSimulatePanel()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VARIANT F: Floating glass card overlay */}
            {variant === 'F' && (
              <div className="relative border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-10 rounded-2xl max-w-4xl mx-auto shadow-2xl animate-fadeIn">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-purple-500/5 rounded-2xl pointer-events-none" />
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface-dark/40 border border-white/5 p-4 rounded-xl">
                      <h4 className="font-sora text-xs font-bold text-text-primary mb-3">Item Keranjang</h4>
                      {renderItemRows()}
                    </div>
                    {renderShippingOptions()}
                    {renderBumpSales()}
                    {renderCoupons()}
                  </div>
                  <div className="space-y-6">
                    {renderAffiliateIdCard()}
                    {renderOrderSummary()}
                    {renderSimulatePanel()}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
