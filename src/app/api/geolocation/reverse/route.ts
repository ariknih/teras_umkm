import { NextRequest, NextResponse } from 'next/server'
import { Kelurahan } from '@/types/snackbox'
import { defaultKelurahan } from '@/lib/mock-snackbox'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

function formatRegency(city: string): string {
  if (!city) return 'Kota'
  let formatted = city.trim()
  if (formatted.startsWith('Administrasi ')) {
    formatted = formatted.replace('Administrasi ', '').trim()
  }
  if (formatted.includes('Kota') || formatted.includes('Kabupaten')) {
    return formatted
  }
  // Check common special cases like Jakarta Pusat/Selatan/dll
  if (/^(Jakarta|Kepulauan Seribu)/i.test(formatted)) {
    return formatted
  }
  return `Kota ${formatted}`
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lng = req.nextUrl.searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ success: false, error: 'Latitude and Longitude are required' }, { status: 400 })
  }

  try {
    // 1. Direct High-Precision GPS Reverse Geocoding via OpenStreetMap Nominatim (Same engine as onboarding)
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`
    const geoRes = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'SalokaUMKMApp/1.0 (contact@saloka.id)'
      },
      next: { revalidate: 3600 }
    })

    if (!geoRes.ok) {
      return NextResponse.json({ success: false, error: 'Reverse geocode failed' }, { status: 502 })
    }

    const geoData = await geoRes.json()
    const address = geoData.address || {}

    // Extract exact Indonesian administrative hierarchy
    const village =
      address.suburb ||
      address.village ||
      address.quarter ||
      address.neighbourhood ||
      address.residential ||
      address.city_district ||
      address.district ||
      ''

    const district =
      address.district ||
      address.city_district ||
      address.subdistrict ||
      address.county ||
      village

    const rawCity =
      address.city ||
      address.town ||
      address.municipality ||
      address.county ||
      address.regency ||
      'Kota Bandung'

    const province = address.state || address.province || 'Jawa Barat'
    const postalCode = address.postcode || ''
    const kota = formatRegency(rawCity)

    // 2. Validate against kodepos only with strict city/province filtering to prevent cross-province mismatch
    let matchedKelurahan: Kelurahan | null = null

    if (village) {
      try {
        const kodeposRes = await fetch(`https://kodepos.vercel.app/search?q=${encodeURIComponent(village)}`, {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 86400 }
        })

        if (kodeposRes.ok) {
          const kdData = await kodeposRes.json()
          const list = kdData?.data || []
          if (Array.isArray(list) && list.length > 0) {
            const cleanCity = rawCity.toLowerCase().replace(/^(kota|kabupaten)\s+/, '').trim()
            const cleanProv = province.toLowerCase().replace(/^provinsi\s+/, '').trim()

            // Strict match: village MUST match AND (regency matches city OR province matches)
            const strictMatch = list.find((item: any) => {
              const itemVillage = (item.village || '').toLowerCase()
              const itemRegency = (item.regency || '').toLowerCase()
              const itemProvince = (item.province || '').toLowerCase()

              const isSameVillage = itemVillage === village.toLowerCase() || itemVillage.includes(village.toLowerCase())
              const isSameCity = cleanCity && (itemRegency.includes(cleanCity) || cleanCity.includes(itemRegency))
              const isSameProv = cleanProv && (itemProvince.includes(cleanProv) || cleanProv.includes(itemProvince))

              return isSameVillage && (isSameCity || isSameProv)
            })

            if (strictMatch) {
              matchedKelurahan = {
                id: `kel-${strictMatch.code}-${slugify(strictMatch.village)}`,
                name: strictMatch.village,
                kecamatan: strictMatch.district,
                kota: formatRegency(strictMatch.regency),
                province: strictMatch.province,
                postalCode: String(strictMatch.code),
                itemCount: 18
              }
            }
          }
        }
      } catch (err) {
        console.warn('Kodepos lookup error in reverse geocode:', err)
      }
    }

    // 3. Fallback to direct Nominatim ground truth (accurate to GPS coordinates)
    const finalKelurahan: Kelurahan = matchedKelurahan || {
      id: `kel-${postalCode || slugify(village || rawCity)}`,
      name: village || district || rawCity,
      kecamatan: district,
      kota: kota,
      province: province,
      postalCode: postalCode || '40111',
      itemCount: 16
    }

    return NextResponse.json({
      success: true,
      kelurahan: finalKelurahan,
      source: 'gps',
      coordinates: { lat, lng }
    })
  } catch (error: any) {
    console.error('Reverse geocode error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
