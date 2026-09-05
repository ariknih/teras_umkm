import { NextRequest, NextResponse } from 'next/server'
import { Kelurahan } from '@/types/snackbox'
import { mockKelurahans } from '@/lib/mock-snackbox'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || ''
  const trimmed = query.trim()

  if (trimmed.length < 2) {
    return NextResponse.json({ success: true, data: mockKelurahans })
  }

  try {
    const kodeposUrl = `https://kodepos.vercel.app/search?q=${encodeURIComponent(trimmed)}`
    const res = await fetch(kodeposUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }
    })

    if (!res.ok) {
      // Fallback to local mock filter
      const q = trimmed.toLowerCase()
      const fallback = mockKelurahans.filter(
        k =>
          k.name.toLowerCase().includes(q) ||
          k.kecamatan.toLowerCase().includes(q) ||
          k.kota.toLowerCase().includes(q) ||
          k.postalCode.includes(q)
      )
      return NextResponse.json({ success: true, data: fallback })
    }

    const resJson = await res.json()
    const rawList = resJson?.data || []

    if (!Array.isArray(rawList) || rawList.length === 0) {
      // Check local mock
      const q = trimmed.toLowerCase()
      const fallback = mockKelurahans.filter(
        k =>
          k.name.toLowerCase().includes(q) ||
          k.kecamatan.toLowerCase().includes(q) ||
          k.kota.toLowerCase().includes(q) ||
          k.postalCode.includes(q)
      )
      return NextResponse.json({ success: true, data: fallback })
    }

    const kelurahans: Kelurahan[] = rawList.slice(0, 25).map((item: any) => {
      const regencyName = item.regency?.startsWith('Administrasi ')
        ? item.regency.replace('Administrasi ', '')
        : item.regency?.includes('Kota') || item.regency?.includes('Kabupaten')
        ? item.regency
        : `Kota ${item.regency}`

      return {
        id: `kel-${item.code}-${slugify(item.village)}`,
        name: item.village,
        kecamatan: item.district,
        kota: regencyName,
        province: item.province,
        postalCode: String(item.code),
        itemCount: Math.floor(Math.random() * 10) + 12
      }
    })

    return NextResponse.json({ success: true, data: kelurahans })
  } catch (error: any) {
    console.error('Kelurahan search error:', error)
    const q = trimmed.toLowerCase()
    const fallback = mockKelurahans.filter(
      k =>
        k.name.toLowerCase().includes(q) ||
        k.kecamatan.toLowerCase().includes(q) ||
        k.kota.toLowerCase().includes(q)
    )
    return NextResponse.json({ success: true, data: fallback })
  }
}
