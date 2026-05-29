import { NextRequest, NextResponse } from 'next/server';
import { calculateShipping, getMockShippingRates, haversineKm } from '@/lib/komerce';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const shipperDestId = sp.get('shipper_dest_id') || '';
  const receiverDestId = sp.get('receiver_dest_id') || '';
  const weight = parseInt(sp.get('weight') || '1000', 10);
  const itemValue = parseFloat(sp.get('item_value') || '0');

  // Fallback coordinates for haversine mock (when no destination IDs available)
  const shipperLat = parseFloat(sp.get('shipper_lat') || '-6.2088');
  const shipperLng = parseFloat(sp.get('shipper_lng') || '106.8456');
  const receiverLat = parseFloat(sp.get('receiver_lat') || '-6.2088');
  const receiverLng = parseFloat(sp.get('receiver_lng') || '106.8456');

  try {
    // If we have real destination IDs, use Komerce API
    if (shipperDestId && receiverDestId) {
      const results = await calculateShipping(shipperDestId, receiverDestId, weight, itemValue);
      if (results.length > 0) {
        return NextResponse.json({ data: results, source: 'komerce' });
      }
    }

    // Fallback: use haversine-based mock rates
    const distKm = haversineKm(shipperLat, shipperLng, receiverLat, receiverLng);
    const mockRates = getMockShippingRates(distKm);
    return NextResponse.json({
      data: mockRates.map((r) => ({
        courier_name: r.courier_name,
        courier_code: r.courier_code,
        price: r.price,
        etd: r.etd,
      })),
      source: 'mock',
      distance_km: Math.round(distKm * 10) / 10,
    });
  } catch (err: any) {
    console.error('[API] /api/shipping/calculate error:', err);

    // Always return a fallback so the cart doesn't break
    const distKm = haversineKm(shipperLat, shipperLng, receiverLat, receiverLng);
    const mockRates = getMockShippingRates(distKm);
    return NextResponse.json({
      data: mockRates,
      source: 'mock_fallback',
      distance_km: Math.round(distKm * 10) / 10,
    });
  }
}
