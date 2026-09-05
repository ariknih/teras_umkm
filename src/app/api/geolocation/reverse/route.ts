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

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lng = req.nextUrl.searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ success: false, error: 'Latitude and Longitude are required' }, { status: 400 })
  }

  try {
    // 1. Query Nominatim OpenStreetMap for reverse geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`
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

    const village = address.village || address.suburb || address.quarter || address.neighbourhood || ''
    const district = address.district || address.subdistrict || address.city_district || address.suburb || ''
    const city = address.city || address.county || address.town || address.municipality || 'Jakarta Pusat'
    const province = address.state || address.province || 'DKI Jakarta'
    const postalCode = address.postcode || ''

    // 2. Resolve to official Indonesian Kelurahan data via kodepos
    const searchQuery = village || postalCode || district || city
    if (searchQuery) {
      try {
        const kodeposRes = await fetch(`https://kodepos.vercel.app/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 86400 }
        })

        if (kodeposRes.ok) {
          const kdData = await kodeposRes.json()
          const list = kdData?.data || []
          if (Array.isArray(list) && list.length > 0) {
            // Find best match
            const match = list.find((item: any) => 
              (village && item.village.toLowerCase() === village.toLowerCase()) ||
              (postalCode && String(item.code) === postalCode)
            ) || list[0]

            const kel: Kelurahan = {
              id: `kel-${match.code}-${slugify(match.village)}`,
              name: match.village,
              kecamatan: match.district,
              kota: match.regency.startsWith('Administrasi ') 
                ? match.regency.replace('Administrasi ', '') 
                : match.regency.includes('Kota') || match.regency.includes('Kabupaten') 
                ? match.regency 
                : `Kota ${match.regency}`,
              province: match.province,
              postalCode: String(match.code),
              itemCount: 18
            }
            return NextResponse.json({ success: true, kelurahan: kel, source: 'gps' })
          }
        }
      } catch (err) {
        console.warn('Kodepos lookup error in reverse geocode:', err)
      }
    }

    // Direct fallback from OSM address details
    const directKel: Kelurahan = {
      id: `kel-${postalCode || slugify(village || city)}`,
      name: village || district || city,
      kecamatan: district || city,
      kota: city,
      province: province,
      postalCode: postalCode || '10110',
      itemCount: 15
    }

    return NextResponse.json({ success: true, kelurahan: directKel, source: 'gps-direct' })
  } catch (error: any) {
    console.error('Reverse geocode error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
