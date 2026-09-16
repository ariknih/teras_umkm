import { NextRequest, NextResponse } from 'next/server';
import { searchBiteshipAreas } from '@/lib/biteship';

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get('keyword');
  if (!keyword || keyword.trim().length < 2) {
    return NextResponse.json({ data: [] });
  }

  try {
    const trimmed = keyword.trim();
    // Biteship is the only area source. Komerce/RajaOngkir used to be a
    // fallback here, but its area ids are not interchangeable with Biteship's —
    // a destination picked from Komerce could not then be priced by Biteship,
    // so the fallback produced addresses that failed at the rate step.
    const biteshipResults = await searchBiteshipAreas(trimmed);
    return NextResponse.json({
      data: biteshipResults.map((a) => ({
        id: a.id,
        label: a.name,
        zip_code: String(a.postal_code || ''),
        province_name: a.administrative_division_level_1_name || '',
        city_name: a.administrative_division_level_2_name || '',
        subdistrict_name: a.administrative_division_level_3_name || '',
      })),
      source: 'biteship',
    });
  } catch (err: any) {
    console.error('[API] /api/shipping/destination error:', err);
    return NextResponse.json({ error: err.message || 'Gagal mencari destinasi.' }, { status: 500 });
  }
}

