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
  if (/^(Jakarta|Kepulauan Seribu)/i.test(formatted)) {
    return formatted
  }
  return `Kota ${formatted}`
}

export async function GET(req: NextRequest) {
  try {
    // 1. Extract IP address from request headers
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const cfIp = req.headers.get('cf-connecting-ip')

    let clientIp = cfIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || ''

    // If local development IP, ignore IP param so ipwho.is uses outgoing public IP
    const isLocal = !clientIp || clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.')
    const ipApiUrl = isLocal ? 'https://ipwho.is/' : `https://ipwho.is/${clientIp}`

    const ipRes = await fetch(ipApiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 }
    })

    if (!ipRes.ok) {
      return NextResponse.json({ success: true, kelurahan: defaultKelurahan, source: 'default' })
    }

    const ipData = await ipRes.json()
    const city = ipData.city || 'Bandung'
    const region = ipData.region || 'Jawa Barat'
    const postal = ipData.postal || ''
    const lat = ipData.latitude
    const lng = ipData.longitude

    // 2. If IP coordinates exist, resolve using OpenStreetMap Nominatim for accurate local village
    if (lat && lng) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`
        const geoRes = await fetch(nominatimUrl, {
          headers: { 'User-Agent': 'SalokaUMKMApp/1.0 (contact@saloka.id)' },
          next: { revalidate: 3600 }
        })

        if (geoRes.ok) {
          const geoData = await geoRes.json()
          const address = geoData.address || {}

          const village =
            address.suburb ||
            address.village ||
            address.quarter ||
            address.neighbourhood ||
            address.city_district ||
            address.district ||
            city

          const district =
            address.district ||
            address.city_district ||
            address.subdistrict ||
            village

          const detectedCity =
            address.city ||
            address.town ||
            address.municipality ||
            address.county ||
            city

          const detectedProvince = address.state || address.province || region
          const detectedPostal = address.postcode || postal

          const kel: Kelurahan = {
            id: `kel-${detectedPostal || slugify(village)}`,
            name: village,
            kecamatan: district,
            kota: formatRegency(detectedCity),
            province: detectedProvince,
            postalCode: detectedPostal || '40111',
            itemCount: 15
          }

          return NextResponse.json({
            success: true,
            kelurahan: kel,
            source: 'ip',
            ipData: { city, postal, ip: ipData.ip }
          })
        }
      } catch (osmErr) {
        console.warn('OSM resolution for IP coords failed, falling back to direct IP data:', osmErr)
      }
    }

    // 3. Fallback from direct IP data without random cross-province match
    const fallbackKel: Kelurahan = {
      id: `kel-${slugify(city)}`,
      name: city,
      kecamatan: city,
      kota: formatRegency(city),
      province: region,
      postalCode: postal || '40111',
      itemCount: 14
    }

    return NextResponse.json({ success: true, kelurahan: fallbackKel, source: 'ip-fallback' })
  } catch (error: any) {
    console.error('Geolocation detect error:', error)
    return NextResponse.json({ success: true, kelurahan: defaultKelurahan, source: 'error-fallback' })
  }
}
