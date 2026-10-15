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

export async function fetchStreetAddresses(
  street: string,
  city: string
): Promise<RawAddress[]> {
  const s = street.trim();
  const c = city.trim();
  if (!s) return [];

  try {
    const query = encodeURIComponent(
      `[out:json][timeout:120];area[name~"${c}"][boundary=administrative]->.a;nwr[addr:street~"${s}",i][addr:housenumber](area.a);out center tags;`
    );
    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${query}`
    );
    if (res.ok) {
      const data = await res.json();
      const result: RawAddress[] = [];
      for (const el of data.elements || []) {
        const tags = el.tags || {};
        const st = tags["addr:street"];
        const hn = tags["addr:housenumber"];
        if (!st || !hn) continue;
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (lat === undefined || lon === undefined) continue;
        result.push({ street: st, houseNumber: String(hn), lat, lng: lon });
      }
      if (result.length > 0) return sortByHouseNumber(result);
    }
  } catch (e) {
    // ignore
  }

  try {
    const q = encodeURIComponent(`${s} ${c}`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&addressdetails=1&limit=5000&countrycodes=de&accept-language=de`,
      { headers: { Accept: "application/json", "User-Agent": "E1-Gebietstracker/1.0" } }
    );
    if (res.ok) {
      const data = await res.json();
      const result: RawAddress[] = [];
      const seen = new Set<string>();
      for (const item of data) {
        const addr = item.address || {};
        const st = addr.road || addr.street || addr.pedestrian;
        const hn = addr.house_number;
        if (!st || !hn || !item.lat || !item.lon) continue;
        const key = `${st.toLowerCase()}|${hn.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({
          street: st,
          houseNumber: String(hn),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        });
      }
      return sortByHouseNumber(result);
    }
  } catch (e) {
    // ignore
  }
  return [];
}