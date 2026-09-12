/**
 * Biteship Shipping Aggregator API Client
 * Docs: https://biteship.com/docs/api
 */

const BITESHIP_BASE_URL = process.env.BITESHIP_BASE_URL || 'https://api.biteship.com/v1';
const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY || '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BiteshipArea {
  id: string;
  name: string;
  country_name?: string;
  country_code?: string;
  administrative_division_level_1_name?: string; // Provinsi
  administrative_division_level_2_name?: string; // Kota / Kabupaten
  administrative_division_level_3_name?: string; // Kecamatan
  postal_code?: number | string;
}

export interface BiteshipRateItem {
  name: string;
  value: number;
  weight: number; // grams
  quantity: number;
  length?: number; // cm
  width?: number; // cm
  height?: number; // cm
  description?: string;
}

export interface BiteshipCourierPricing {
  company: string;
  courier_name: string;
  courier_code: string;
  courier_service_name: string;
  courier_service_code: string;
  description?: string;
  duration?: string;
  shipment_duration_range?: string;
  shipment_duration_unit?: string;
  price: number;
  type?: string;
  available_for_cash_on_delivery?: boolean;
}

export interface NormalizedShippingRate {
  courier_code: string;
  courier_name: string;
  courier_service_name: string;
  price: number;
  etd: string;
  company: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getMockShippingRates(distKm: number, weightGram: number = 1000): NormalizedShippingRate[] {
  const weightKg = Math.max(1, Math.ceil(weightGram / 1000));
  const couriers = [
    { code: 'jne_reg', comp: 'jne', name: 'JNE', svc: 'Reguler', ratePerKm: 40, baseFee: 12000, minFee: 9000, shift: 0 },
    { code: 'jnt_ez', comp: 'jnt', name: 'J&T Express', svc: 'EZ Standard', ratePerKm: 45, baseFee: 13000, minFee: 10000, shift: -1 },
    { code: 'sicepat_siuntung', comp: 'sicepat', name: 'SiCepat', svc: 'SIUNTUNG Reguler', ratePerKm: 42, baseFee: 12500, minFee: 9500, shift: -1 },
    { code: 'anteraja_reg', comp: 'anteraja', name: 'Anteraja', svc: 'Reguler', ratePerKm: 38, baseFee: 11000, minFee: 8500, shift: 0 },
    { code: 'pos_kilat', comp: 'pos', name: 'Pos Indonesia', svc: 'Pos Reguler / Kilat', ratePerKm: 30, baseFee: 10000, minFee: 8000, shift: 1 },
    { code: 'tiki_reg', comp: 'tiki', name: 'TIKI', svc: 'REG', ratePerKm: 35, baseFee: 12000, minFee: 9000, shift: 1 },
  ];

  const getEtd = (km: number, shift: number): string => {
    let minD = km < 50 ? 1 : km < 250 ? 2 : km < 800 ? 3 : 5;
    let maxD = km < 50 ? 2 : km < 250 ? 3 : km < 800 ? 5 : 7;
    minD = Math.max(1, minD + shift);
    maxD = Math.max(minD + 1, maxD + shift);
    return `${minD}-${maxD} hari`;
  };

  return couriers.map((c) => {
    const costPerKg = c.baseFee + Math.round((distKm * c.ratePerKm) / 100) * 100;
    const price = Math.max(c.minFee, costPerKg * weightKg);
    return {
      courier_code: c.code,
      courier_name: `${c.name} ${c.svc}`,
      courier_service_name: c.svc,
      company: c.comp,
      price,
      etd: getEtd(distKm, c.shift),
    };
  });
}

// ─── Area Search ──────────────────────────────────────────────────────────────

/**
 * Search administrative area / location in Indonesia using Biteship Maps Area API
 */
export async function searchBiteshipAreas(keyword: string): Promise<BiteshipArea[]> {
  if (!keyword || keyword.trim().length < 2) return [];

  // If no API key is configured, return smart mock matching major Indonesian areas
  if (!BITESHIP_API_KEY) {
    const lower = keyword.toLowerCase();
    const mockDb: BiteshipArea[] = [
      { id: 'IDnp3171', name: 'Kebayoran Baru, Jakarta Selatan, DKI Jakarta', administrative_division_level_1_name: 'DKI Jakarta', administrative_division_level_2_name: 'Jakarta Selatan', administrative_division_level_3_name: 'Kebayoran Baru', postal_code: 12110 },
      { id: 'IDnp3172', name: 'Tebet, Jakarta Selatan, DKI Jakarta', administrative_division_level_1_name: 'DKI Jakarta', administrative_division_level_2_name: 'Jakarta Selatan', administrative_division_level_3_name: 'Tebet', postal_code: 12810 },
      { id: 'IDnp3173', name: 'Gambir, Jakarta Pusat, DKI Jakarta', administrative_division_level_1_name: 'DKI Jakarta', administrative_division_level_2_name: 'Jakarta Pusat', administrative_division_level_3_name: 'Gambir', postal_code: 10110 },
      { id: 'IDnp3273', name: 'Coblong, Kota Bandung, Jawa Barat', administrative_division_level_1_name: 'Jawa Barat', administrative_division_level_2_name: 'Kota Bandung', administrative_division_level_3_name: 'Coblong', postal_code: 40132 },
      { id: 'IDnp3374', name: 'Semarang Barat, Kota Semarang, Jawa Tengah', administrative_division_level_1_name: 'Jawa Tengah', administrative_division_level_2_name: 'Kota Semarang', administrative_division_level_3_name: 'Semarang Barat', postal_code: 50140 },
      { id: 'IDnp3578', name: 'Gubeng, Kota Surabaya, Jawa Timur', administrative_division_level_1_name: 'Jawa Timur', administrative_division_level_2_name: 'Kota Surabaya', administrative_division_level_3_name: 'Gubeng', postal_code: 60281 },
      { id: 'IDnp3471', name: 'Umbulharjo, Kota Yogyakarta, DI Yogyakarta', administrative_division_level_1_name: 'DI Yogyakarta', administrative_division_level_2_name: 'Kota Yogyakarta', administrative_division_level_3_name: 'Umbulharjo', postal_code: 55161 },
      { id: 'IDnp5171', name: 'Denpasar Selatan, Kota Denpasar, Bali', administrative_division_level_1_name: 'Bali', administrative_division_level_2_name: 'Kota Denpasar', administrative_division_level_3_name: 'Denpasar Selatan', postal_code: 80227 },
      { id: 'IDnp1271', name: 'Medan Kota, Kota Medan, Sumatera Utara', administrative_division_level_1_name: 'Sumatera Utara', administrative_division_level_2_name: 'Kota Medan', administrative_division_level_3_name: 'Medan Kota', postal_code: 20212 },
    ];
    return mockDb.filter(
      (a) =>
        a.name.toLowerCase().includes(lower) ||
        (a.postal_code && String(a.postal_code).includes(lower))
    );
  }

  try {
    const url = `${BITESHIP_BASE_URL}/maps/areas?countries=ID&input=${encodeURIComponent(keyword.trim())}&type=single`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: BITESHIP_API_KEY,
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('[Biteship] Area search error:', resp.status, err);
      return [];
    }

    const data = await resp.json();
    return (data.areas || []).map((area: any) => ({
      id: area.id,
      name: area.name,
      country_name: area.country_name,
      country_code: area.country_code,
      administrative_division_level_1_name: area.administrative_division_level_1_name,
      administrative_division_level_2_name: area.administrative_division_level_2_name,
      administrative_division_level_3_name: area.administrative_division_level_3_name,
      postal_code: area.postal_code,
    }));
  } catch (err) {
    console.error('[Biteship] searchBiteshipAreas exception:', err);
    return [];
  }
}

// ─── Rates Calculation ────────────────────────────────────────────────────────

export interface CalculateRatesParams {
  originAreaId?: string;
  originLat?: number;
  originLng?: number;
  destinationAreaId?: string;
  destinationLat?: number;
  destinationLng?: number;
  couriers?: string;
  items: BiteshipRateItem[];
}

/**
 * Calculate multi-courier shipping rates via Biteship API
 */
export async function calculateBiteshipRates(
  params: CalculateRatesParams
): Promise<NormalizedShippingRate[]> {
  const {
    originAreaId,
    originLat,
    originLng,
    destinationAreaId,
    destinationLat,
    destinationLng,
    couriers = 'jne,jnt,sicepat,anteraja,tiki,pos',
    items,
  } = params;

  const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0);

  // If no API key, fallback immediately to realistic Haversine pricing
  if (!BITESHIP_API_KEY) {
    const oLat = originLat ?? -6.2088;
    const oLng = originLng ?? 106.8456;
    const dLat = destinationLat ?? -6.2088;
    const dLng = destinationLng ?? 106.8456;
    const distKm = haversineKm(oLat, oLng, dLat, dLng);
    return getMockShippingRates(distKm, totalWeight);
  }

  try {
    const payload: any = {
      couriers,
      items: items.map((it) => ({
        name: it.name || 'Produk UMKM',
        value: it.value || 10000,
        weight: it.weight || 1000,
        quantity: it.quantity || 1,
        length: it.length || 10,
        width: it.width || 10,
        height: it.height || 10,
      })),
    };

    if (originAreaId) payload.origin_area_id = originAreaId;
    if (originLat && originLng) {
      payload.origin_latitude = originLat;
      payload.origin_longitude = originLng;
    }

    if (destinationAreaId) payload.destination_area_id = destinationAreaId;
    if (destinationLat && destinationLng) {
      payload.destination_latitude = destinationLat;
      payload.destination_longitude = destinationLng;
    }

    const resp = await fetch(`${BITESHIP_BASE_URL}/rates/couriers`, {
      method: 'POST',
      headers: {
        Authorization: BITESHIP_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[Biteship] Rates calculation error:', resp.status, errText);
      const oLat = originLat ?? -6.2088;
      const oLng = originLng ?? 106.8456;
      const dLat = destinationLat ?? -6.2088;
      const dLng = destinationLng ?? 106.8456;
      return getMockShippingRates(haversineKm(oLat, oLng, dLat, dLng), totalWeight);
    }

    const data = await resp.json();
    const pricingList: BiteshipCourierPricing[] = data.pricing || [];

    if (!Array.isArray(pricingList) || pricingList.length === 0) {
      const oLat = originLat ?? -6.2088;
      const oLng = originLng ?? 106.8456;
      const dLat = destinationLat ?? -6.2088;
      const dLng = destinationLng ?? 106.8456;
      return getMockShippingRates(haversineKm(oLat, oLng, dLat, dLng), totalWeight);
    }

    return pricingList.map((p) => ({
      courier_code: `${p.company}_${p.courier_service_code || p.courier_service_name}`.toLowerCase(),
      courier_name: `${p.courier_name || p.company.toUpperCase()} - ${p.courier_service_name || 'Standard'}`,
      courier_service_name: p.courier_service_name || 'Standard',
      company: p.company,
      price: p.price,
      etd: p.duration || (p.shipment_duration_range ? `${p.shipment_duration_range} ${p.shipment_duration_unit || 'hari'}` : '1-3 hari'),
    }));
  } catch (err) {
    console.error('[Biteship] calculateBiteshipRates error:', err);
    const oLat = originLat ?? -6.2088;
    const oLng = originLng ?? 106.8456;
    const dLat = destinationLat ?? -6.2088;
    const dLng = destinationLng ?? 106.8456;
    return getMockShippingRates(haversineKm(oLat, oLng, dLat, dLng), totalWeight);
  }
}

// ─── Waybill Tracking ─────────────────────────────────────────────────────────

export async function trackBiteshipWaybill(trackingId: string, courierCode: string) {
  if (!BITESHIP_API_KEY) {
    return {
      success: true,
      waybill_id: trackingId,
      courier: courierCode,
      status: 'ON_PROCESS',
      history: [
        { note: 'Paket telah diserahkan kepada kurir mitra Saloka', updated_at: new Date().toISOString() },
        { note: 'Pesanan sedang dalam perjalanan menuju kota tujuan', updated_at: new Date().toISOString() },
      ],
    };
  }

  try {
    const resp = await fetch(`${BITESHIP_BASE_URL}/trackings/${trackingId}/couriers/${courierCode}`, {
      headers: { Authorization: BITESHIP_API_KEY },
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (err) {
    console.error('[Biteship] trackBiteshipWaybill error:', err);
    return null;
  }
}
