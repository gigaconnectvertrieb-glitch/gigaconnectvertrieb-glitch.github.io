export interface RawAddress {
  street: string;
  houseNumber: string;
  lat: number;
  lng: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    street?: string;
    pedestrian?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
  };
}

export function sortByHouseNumber(addresses: RawAddress[]): RawAddress[] {
  return [...addresses].sort((a, b) => {
    const na = parseInt(a.houseNumber.replace(/\D/g, "")) || 0;
    const nb = parseInt(b.houseNumber.replace(/\D/g, "")) || 0;
    if (na !== nb) return na - nb;
    return a.houseNumber.localeCompare(b.houseNumber, "de");
  });
}

export async function searchStreets(
  city: string,
  query: string
): Promise<Array<{ street: string; city: string }>> {
  const q = encodeURIComponent(`${query} ${city}`);
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&addressdetails=1&limit=10&countrycodes=de`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "E1-Gebietstracker/1.0",
    },
  });
  if (!res.ok) throw new Error("Suche fehlgeschlagen");

  const data = (await res.json()) as NominatimResult[];
  const seen = new Set<string>();
  const result: Array<{ street: string; city: string }> = [];

  for (const item of data) {
    const addr = item.address || {};
    const street = addr.road || addr.street || addr.pedestrian;
    const c = addr.city || addr.town || addr.village || city;
    if (!street) continue;
    const key = `${c.toLowerCase()}|${street.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ street, city: c });
  }
  return result;
}

export async function fetchStreetAddresses(
  street: string,
  city: string
): Promise<RawAddress[]> {
  const q = encodeURIComponent(`${street} ${city}`);
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&addressdetails=1&limit=1000&countrycodes=de`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "E1-Gebietstracker/1.0",
    },
  });
  if (!res.ok) throw new Error("Fehler");

  const data = (await res.json()) as NominatimResult[];
  const seen = new Set<string>();
  const result: RawAddress[] = [];

  for (const item of data) {
    const addr = item.address || {};
    const s = addr.road || addr.street || addr.pedestrian;
    const h = addr.house_number;
    const c = addr.city || addr.town || addr.village;
    if (!s || !h || !item.lat || !item.lon) continue;
    if (city && c && c.toLowerCase() !== city.toLowerCase()) continue;
    if (s.toLowerCase() !== street.toLowerCase()) continue;

    const key = `${s.toLowerCase()}|${h.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      street: s,
      houseNumber: String(h),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    });
  }

  if (result.length === 0) {
    for (const item of data) {
      const addr = item.address || {};
      const s = addr.road || addr.street || addr.pedestrian;
      const h = addr.house_number;
      if (s && h && item.lat && item.lon) {
        const key = `${s.toLowerCase()}|${h.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({
          street: s,
          houseNumber: String(h),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        });
      }
    }
  }

  return sortByHouseNumber(result);
}

export async function fetchCityAddresses(city: string): Promise<RawAddress[]> {
  const q = encodeURIComponent(city);
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&addressdetails=1&limit=2000&countrycodes=de`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "E1-Gebietstracker/1.0",
    },
  });
  if (!res.ok) throw new Error("Fehler");

  const data = (await res.json()) as NominatimResult[];
  const seen = new Set<string>();
  const result: RawAddress[] = [];

  for (const item of data) {
    const addr = item.address || {};
    const s = addr.road || addr.street || addr.pedestrian;
    const h = addr.house_number;
    if (s && h && item.lat && item.lon) {
      const key = `${s.toLowerCase()}|${h.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        street: s,
        houseNumber: String(h),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      });
    }
  }
  return sortByHouseNumber(result);
}