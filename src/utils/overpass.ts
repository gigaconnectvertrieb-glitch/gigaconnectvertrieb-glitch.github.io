export interface RawAddress {
  street: string;
  houseNumber: string;
  lat: number;
  lng: number;
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
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&addressdetails=1&limit=10&countrycodes=de&accept-language=de`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "E1-Gebietstracker/1.0",
    },
  });
  if (!res.ok) throw new Error("Suche fehlgeschlagen");

  const data = await res.json();
  const seen = new Set<string>();
  const result: Array<{ street: string; city: string }> = [];

  for (const item of data) {
    const addr = item.address || {};
    const street = addr.road || addr.street || addr.pedestrian || addr.footway || addr.path;
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
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&addressdetails=1&limit=2000&countrycodes=de&accept-language=de`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "E1-Gebietstracker/1.0",
    },
  });
  if (!res.ok) throw new Error("Fehler");

  const data = await res.json();
  const seen = new Set<string>();
  const result: RawAddress[] = [];

  for (const item of data) {
    const addr = item.address || {};
    const s = addr.road || addr.street || addr.pedestrian;
    const h = addr.house_number;
    if (!s || !h || !item.lat || !item.lon) continue;
    if (s.toLowerCase() !== street.toLowerCase().replace(/str\.?$/, "straße")) continue;

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

  if (result.length < 10) {
    const q2 = encodeURIComponent(`${street} ${city}`);
    const url2 = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q2}&addressdetails=1&limit=500&countrycodes=de&polygon_geojson=0&extratags=0&namedetails=0`;
    const res2 = await fetch(url2, {
      headers: {
        Accept: "application/json",
        "User-Agent": "E1-Gebietstracker/1.0",
      },
    });
    if (res2.ok) {
      const data2 = await res2.json();
      for (const item of data2) {
        const addr = item.address || {};
        const s = addr.road || addr.street || addr.pedestrian;
        const h = addr.house_number;
        if (!s || !h || !item.lat || !item.lon) continue;
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