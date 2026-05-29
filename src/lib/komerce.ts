/**
 * Komerce / RajaOngkir by Komerce API Integration
 * Sandbox Mode — https://api-sandbox.collaborator.komerce.id
 *
 * Endpoints used:
 *  - GET /tariff/api/v1/destination/search?keyword=... → Search destination ID
 *  - GET /tariff/api/v1/calculate?shipper_destination_id=...&receiver_destination_id=...&weight=...&item_value=...&cod=no → Shipping tariff
 *  - POST /user/api/v1/payment/create → Create payment (Komerce Payment API / Qrisly)
 */

const KOMERCE_BASE_URL =
  process.env.KOMERCE_BASE_URL || 'https://api-sandbox.collaborator.komerce.id';

const SHIPPING_API_KEY =
  process.env.KOMERCE_SHIPPING_API_KEY || 'kWUvBmKG24591a4ae5cc04545oA7te0I';

const PAYMENT_API_KEY =
  process.env.KOMERCE_PAYMENT_API_KEY || '8wnfwYar24591a4ae5cc04543H1cc1WP';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KomerceDestination {
  id: string;
  label: string;
  zip_code?: string;
  country_id?: string;
  country_name?: string;
  province_name?: string;
  city_name?: string;
  subdistrict_name?: string;
}

export interface KomerceCourierService {
  service_name: string;
  service_code?: string;
  price: number;
  etd: string;
}

export interface KomerceCourier {
  courier_name: string;
  courier_code: string;
  courier_service_name: string;
  price: number;
  etd: string;
}

export interface KomerceTariffResult {
  courier_name: string;
  courier_code: string;
  price: number;
  etd: string;
  services?: KomerceCourierService[];
}

// ─── Destination Search ───────────────────────────────────────────────────────

/**
 * Search for an origin/destination location by keyword (city name, postal code, kecamatan, etc.)
 */
export async function searchDestination(keyword: string): Promise<KomerceDestination[]> {
  try {
    const url = `${KOMERCE_BASE_URL}/tariff/api/v1/destination/search?keyword=${encodeURIComponent(keyword)}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': SHIPPING_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[Komerce] Destination search error:', errText);
      return [];
    }

    const data = await resp.json();

    // Handle both possible response shapes
    const rawList = data?.data ?? data?.result ?? data ?? [];
    if (!Array.isArray(rawList)) return [];

    return rawList.map((item: any) => ({
      id: String(item.id ?? item.destination_id ?? item.subdistrict_id ?? ''),
      label: item.label ?? item.name ?? item.subdistrict_name ?? '',
      zip_code: item.zip_code ?? item.postal_code ?? '',
      province_name: item.province_name ?? item.province ?? '',
      city_name: item.city_name ?? item.city ?? '',
      subdistrict_name: item.subdistrict_name ?? '',
    }));
  } catch (err) {
    console.error('[Komerce] searchDestination error:', err);
    return [];
  }
}

// ─── Shipping Cost Calculation ────────────────────────────────────────────────

/**
 * Calculate shipping tariffs between two destination IDs.
 * @param shipperDestId   - ID of origin destination (from searchDestination)
 * @param receiverDestId  - ID of receiver destination (from searchDestination)
 * @param weightGram      - Total weight in grams
 * @param itemValue       - Declared item value (for insurance) in Rupiah
 */
export async function calculateShipping(
  shipperDestId: string,
  receiverDestId: string,
  weightGram: number,
  itemValue: number = 0
): Promise<KomerceTariffResult[]> {
  try {
    const params = new URLSearchParams({
      shipper_destination_id: shipperDestId,
      receiver_destination_id: receiverDestId,
      weight: String(weightGram),
      item_value: String(Math.round(itemValue)),
      cod: 'no',
    });

    const url = `${KOMERCE_BASE_URL}/tariff/api/v1/calculate?${params.toString()}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': SHIPPING_API_KEY,
        'Accept': 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[Komerce] Calculate shipping error:', resp.status, errText);
      return [];
    }

    const data = await resp.json();
    const rawList = data?.data ?? data?.couriers ?? data?.result ?? [];

    if (!Array.isArray(rawList)) return [];

    // Flatten couriers with multiple services into individual rows
    const results: KomerceTariffResult[] = [];
    for (const courier of rawList) {
      if (Array.isArray(courier.services) && courier.services.length > 0) {
        for (const svc of courier.services) {
          results.push({
            courier_name: courier.courier_name ?? courier.name ?? courier.code ?? '',
            courier_code: courier.courier_code ?? courier.code ?? '',
            price: svc.price ?? svc.cost ?? 0,
            etd: svc.etd ?? svc.estimated ?? '-',
          });
        }
      } else {
        results.push({
          courier_name: courier.courier_name ?? courier.name ?? '',
          courier_code: courier.courier_code ?? courier.code ?? '',
          price: courier.price ?? courier.cost ?? 0,
          etd: courier.etd ?? courier.estimated ?? '-',
        });
      }
    }

    return results;
  } catch (err) {
    console.error('[Komerce] calculateShipping error:', err);
    return [];
  }
}

// ─── Mock fallback tariffs (Haversine-based) ──────────────────────────────────
// Used when API call fails or destination IDs are unavailable

export interface MockCourierRate {
  courier_code: string;
  courier_name: string;
  price: number;
  etd: string;
}

export function getMockShippingRates(distanceKm: number): MockCourierRate[] {
  const couriers = [
    { code: 'jne', name: 'JNE REG', ratePerKm: 2000, minFee: 9000 },
    { code: 'jnt', name: 'J&T Express', ratePerKm: 2100, minFee: 9000 },
    { code: 'sicepat', name: 'SiCepat REG', ratePerKm: 2200, minFee: 10000 },
    { code: 'tiki', name: 'TIKI REG', ratePerKm: 1800, minFee: 9000 },
    { code: 'pos', name: 'POS Indonesia', ratePerKm: 1500, minFee: 8000 },
    { code: 'anteraja', name: 'Anteraja', ratePerKm: 1900, minFee: 8500 },
    { code: 'ninja', name: 'Ninja Express', ratePerKm: 2050, minFee: 9500 },
  ];

  const etdByDist = (km: number) =>
    km < 50 ? '1-2 hari' : km < 200 ? '2-3 hari' : km < 800 ? '3-5 hari' : '5-7 hari';

  return couriers.map((c) => ({
    courier_code: c.code,
    courier_name: c.name,
    price: Math.max(c.minFee, Math.round(distanceKm * c.ratePerKm / 100) * 100),
    etd: etdByDist(distanceKm),
  }));
}

// ─── Haversine distance helper ────────────────────────────────────────────────

export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
