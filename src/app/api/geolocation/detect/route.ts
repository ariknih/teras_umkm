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
    const city = ipData.city || 'Jakarta'
    const postal = ipData.postal || ''

    // 2. Resolve to Indonesian Kelurahan using kodepos API
    const searchQuery = postal || city
    const kodeposRes = await fetch(`https://kodepos.vercel.app/search?q=${encodeURIComponent(searchQuery)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }
    })

    if (kodeposRes.ok) {
      const kdData = await kodeposRes.json()
      const list = kdData?.data || []
      if (Array.isArray(list) && list.length > 0) {
        const top = list[0]
        const kel: Kelurahan = {
          id: `kel-${top.code}-${slugify(top.village)}`,
          name: top.village,
          kecamatan: top.district,
          kota: top.regency.startsWith('Administrasi ') 
            ? top.regency.replace('Administrasi ', '') 
            : top.regency.includes('Kota') || top.regency.includes('Kabupaten') 
            ? top.regency 
            : `Kota ${top.regency}`,
          province: top.province,
          postalCode: String(top.code),
          itemCount: 15
        }
        return NextResponse.json({ success: true, kelurahan: kel, source: 'ip', ipData: { city, postal, ip: ipData.ip } })
      }
    }

    // Fallback if kodepos search had no matches
    const fallbackKel: Kelurahan = {
      id: `kel-${slugify(city)}`,
      name: city,
      kecamatan: city,
      kota: city,
      province: ipData.region || 'Indonesia',
      postalCode: postal || '10110',
      itemCount: 12
    }

    return NextResponse.json({ success: true, kelurahan: fallbackKel, source: 'ip-fallback' })
  } catch (error: any) {
    console.error('Geolocation detect error:', error)
    return NextResponse.json({ success: true, kelurahan: defaultKelurahan, source: 'error-fallback' })
  }
}
