import { NextRequest, NextResponse } from 'next/server';
import { calculateBiteshipRates, haversineKm, getMockShippingRates } from '@/lib/biteship';

/**
 * Mock rates are a Haversine distance estimate, not a real courier quote. They
 * are fine locally, but in production the shipping fee is charged for real and
 * the merchant has to actually ship at that price — so a quote we invented is
 * worse than no quote. Refuse instead, and let the buyer pick pickup/COD.
 */
const ALLOW_MOCK_RATES = process.env.NODE_ENV !== 'production';

function ratesUnavailable() {
  return NextResponse.json(
    {
      error:
        'Tarif pengiriman sedang tidak tersedia. Silakan coba lagi sebentar lagi, atau pilih ambil di toko (pickup).',
      data: [],
    },
    { status: 503 }
  );
}

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

    // Komerce/RajaOngkir used to be the second-choice aggregator here. It was
    // dropped as a vendor and its default base URL still pointed at sandbox, so
    // it is no longer consulted — Biteship is the only rate source.

    // Haversine estimate: development only.
    if (!ALLOW_MOCK_RATES) return ratesUnavailable();
    return NextResponse.json({
      data: getMockShippingRates(distKm, weight),
      source: 'mock',
      distance_km: Math.round(distKm * 10) / 10,
    });
  } catch (err: any) {
    console.error('[API] /api/shipping/calculate error:', err);
    if (!ALLOW_MOCK_RATES) return ratesUnavailable();
    return NextResponse.json({
      data: getMockShippingRates(distKm, weight),
      source: 'mock_fallback',
      distance_km: Math.round(distKm * 10) / 10,
    });
  }
}

