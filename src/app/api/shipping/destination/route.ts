import { NextRequest, NextResponse } from 'next/server';
import { searchBiteshipAreas } from '@/lib/biteship';
import { searchDestination as searchKomerceDestination } from '@/lib/komerce';

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get('keyword');
  if (!keyword || keyword.trim().length < 2) {
    return NextResponse.json({ data: [] });
  }

  try {
    const trimmed = keyword.trim();
    // Prioritize Biteship Area Search
    const biteshipResults = await searchBiteshipAreas(trimmed);
    if (biteshipResults.length > 0) {
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
    }

    // Fallback to Komerce if available
    const komerceResults = await searchKomerceDestination(trimmed);
    return NextResponse.json({ data: komerceResults, source: 'komerce' });
  } catch (err: any) {
    console.error('[API] /api/shipping/destination error:', err);
    return NextResponse.json({ error: err.message || 'Gagal mencari destinasi.' }, { status: 500 });
  }
}

