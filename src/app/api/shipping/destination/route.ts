import { NextRequest, NextResponse } from 'next/server';
import { searchDestination } from '@/lib/komerce';

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get('keyword');
  if (!keyword || keyword.trim().length < 2) {
    return NextResponse.json({ data: [] });
  }

  try {
    const results = await searchDestination(keyword.trim());
    return NextResponse.json({ data: results });
  } catch (err: any) {
    console.error('[API] /api/shipping/destination error:', err);
    return NextResponse.json({ error: err.message || 'Gagal mencari destinasi.' }, { status: 500 });
  }
}
