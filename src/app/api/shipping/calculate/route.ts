import { NextRequest, NextResponse } from 'next/server';
import { calculateBiteshipRates, haversineKm, getMockShippingRates } from '@/lib/biteship';
import { calculateShipping as calculateKomerceShipping } from '@/lib/komerce';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const shipperDestId = sp.get('shipper_dest_id') || '';
  const receiverDestId = sp.get('receiver_dest_id') || '';
  const weight = parseInt(sp.get('weight') || '1000', 10);
  const itemValue = parseFloat(sp.get('item_value') || '0');

  // Coordinates
  const shipperLat = parseFloat(sp.get('shipper_lat') || '-6.2088');
  const shipperLng = parseFloat(sp.get('shipper_lng') || '106.8456');
  const receiverLat = parseFloat(sp.get('receiver_lat') || '-6.2088');
  const receiverLng = parseFloat(sp.get('receiver_lng') || '106.8456');

  const distKm = haversineKm(shipperLat, shipperLng, receiverLat, receiverLng);

  try {
    // 1. Prioritize Biteship Rates calculation
    const biteshipRates = await calculateBiteshipRates({
      originAreaId: shipperDestId || undefined,
      originLat: shipperLat,
      originLng: shipperLng,
      destinationAreaId: receiverDestId || undefined,
      destinationLat: receiverLat,
      destinationLng: receiverLng,
      items: [
        {
          name: 'Paket Belanja UMKM',
          value: itemValue || 25000,
          weight: Math.max(100, weight),
          quantity: 1,
        },
      ],
    });

    if (biteshipRates && biteshipRates.length > 0) {
      return NextResponse.json({
        data: biteshipRates,
        source: 'biteship',
        distance_km: Math.round(distKm * 10) / 10,
      });
    }

    // 2. Fallback to Komerce if available
    if (shipperDestId && receiverDestId) {
      const komerceResults = await calculateKomerceShipping(shipperDestId, receiverDestId, weight, itemValue);
      if (komerceResults.length > 0) {
        return NextResponse.json({
          data: komerceResults,
          source: 'komerce',
          distance_km: Math.round(distKm * 10) / 10,
        });
      }
    }

    // 3. Haversine mock fallback
    const mockRates = getMockShippingRates(distKm, weight);
    return NextResponse.json({
      data: mockRates,
      source: 'mock',
      distance_km: Math.round(distKm * 10) / 10,
    });
  } catch (err: any) {
    console.error('[API] /api/shipping/calculate error:', err);
    const mockRates = getMockShippingRates(distKm, weight);
    return NextResponse.json({
      data: mockRates,
      source: 'mock_fallback',
      distance_km: Math.round(distKm * 10) / 10,
    });
  }
}

