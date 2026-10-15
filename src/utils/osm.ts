import { sharedGet, sharedPut } from "@/lib/sharedCache";

export interface CitySuggestion {
  name: string;
  hint: string;
}

export interface FoundAddress {
  street: string;
  number: string;
  lat: number;
  lng: number;
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  country?: string;
}

interface NominatimResult {
  address?: NominatimAddress;
  osm_type?: string;
  osm_id?: number;
  class?: string;
}

interface OverpassElement {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const HIGHWAYS =
  "residential|living_street|unclassified|tertiary|secondary|primary|pedestrian|road|service";

const escapeQuotes = (v: string) => v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const escapeRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const AREA_CACHE = "laufliste-area-v1";
const HOUSE_CACHE = "laufliste-houses-v1";

function readJson<T>(key: string): Record<string, T> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}");
  } catch {
    return {};
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Cache ist optional */
  }
}

/** Overpass-Gebiets-ID der Stadt (Relation + 3600000000). Mit ID ist die Abfrage viel schneller als über den Namen. */
async function resolveAreaId(city: string): Promise<number | null> {
  const key = city.toLowerCase();
  const cache = readJson<number>(AREA_CACHE);
  if (cache[key]) return cache[key];
  try {
    const data = await nominatim(city, 5);
    const hit = data.find((r) => r.osm_type === "relation" && r.class === "boundary" && r.osm_id);
    if (!hit?.osm_id) return null;
    const id = 3600000000 + hit.osm_id;
    cache[key] = id;
    writeJson(AREA_CACHE, cache);
    return id;
  } catch {
    return null;
  }
}

/** Alle Gebiets-Varianten, mit denen eine Stadt in OSM gefunden werden kann. */
async function areaClauses(city: string): Promise<string[]> {
  const id = await resolveAreaId(city);
  return [
    ...(id ? [`area(id:${id})->.a;`] : []),
    `area["name"="${escapeQuotes(city)}"]["boundary"="administrative"]->.a;`,
    `area["name"~"^${escapeQuotes(escapeRegex(city))}$",i]["boundary"="administrative"]->.a;`,
  ];
}

/** Fragt alle Server gleichzeitig ab, die erste gültige Antwort gewinnt. */
async function overpass(query: string, timeoutMs = 45000): Promise<OverpassResponse> {
  const controllers = MIRRORS.map(() => new AbortController());
  const timer = setTimeout(() => controllers.forEach((c) => c.abort()), timeoutMs);
  const body = `data=${encodeURIComponent(query)}`;

  const attempts = MIRRORS.map(async (base, i) => {
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controllers[i].signal,
    });
    if (!res.ok) throw new Error(`Server antwortet mit ${res.status}`);
    const json = (await res.json()) as OverpassResponse & { remark?: string };
    if (json.remark && !(json.elements?.length)) throw new Error("Server überlastet");
    controllers.forEach((c, j) => j !== i && c.abort());
    return json;
  });

  try {
    return await new Promise<OverpassResponse>((resolve, reject) => {
      let failed = 0;
      let firstError: unknown = null;
      attempts.forEach((p) =>
        p.then(resolve, (e) => {
          firstError ??= e;
          if (++failed === attempts.length) reject(firstError);
        })
      );
    });
  } catch (first) {
    const msg =
      first instanceof DOMException && first.name === "AbortError"
        ? "Zeitüberschreitung"
        : first instanceof Error
          ? first.message
          : "unbekannt";
    throw new Error(`Kartendaten nicht erreichbar (${msg}). Bitte später erneut versuchen.`);
  } finally {
    clearTimeout(timer);
  }
}

const STREET_CACHE = "laufliste-streets-v1";

function readCache(city: string): string[] | null {
  try {
    const all = JSON.parse(localStorage.getItem(STREET_CACHE) ?? "{}");
    return all[city.toLowerCase()] ?? null;
  } catch {
    return null;
  }
}

function writeCache(city: string, streets: string[]) {
  try {
    const all = JSON.parse(localStorage.getItem(STREET_CACHE) ?? "{}");
    all[city.toLowerCase()] = streets;
    localStorage.setItem(STREET_CACHE, JSON.stringify(all));
  } catch {
    /* Cache ist optional */
  }
}

async function nominatim(query: string, limit: number): Promise<NominatimResult[]> {
  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?format=jsonv2&addressdetails=1&countrycodes=de,at,ch&accept-language=de` +
    `&limit=${limit}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Suche fehlgeschlagen (${res.status})`);
  return (await res.json()) as NominatimResult[];
}

const cityOf = (a?: NominatimAddress) =>
  a?.city || a?.town || a?.village || a?.municipality;

export async function searchCities(term: string): Promise<CitySuggestion[]> {
  const q = term.trim();
  if (q.length < 2) return [];
  const data = await nominatim(q, 10);
  const seen = new Set<string>();
  const out: CitySuggestion[] = [];
  for (const item of data) {
    const name = cityOf(item.address);
    if (!name) continue;
    const hint = [item.address?.state, item.address?.country]
      .filter(Boolean)
      .join(", ");
    const k = `${name.toLowerCase()}|${hint}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ name, hint });
  }
  return out;
}

/** Alle benannten Straßen einer Stadt. Wirft bei Netzwerkfehlern, [] nur wenn wirklich nichts gefunden wurde. */
export async function fetchCityStreets(city: string): Promise<string[]> {
  let reached = false;
  let lastError: unknown = null;

  const cached = readCache(city.trim());
  if (cached?.length) return cached;

  const sKey = `streets|${city.trim().toLowerCase()}`;
  const shared = (await sharedGet<string[]>([sKey]))[sKey];
  if (shared?.length) {
    writeCache(city.trim(), shared);
    return shared;
  }

  for (const clause of await areaClauses(city.trim())) {
    try {
      const data = await overpass(
        `[out:json][timeout:60];${clause}` +
          `way(area.a)["highway"~"^(${HIGHWAYS})$"]["name"];out tags;`
      );
      reached = true;
      const names = new Set<string>();
      for (const el of data.elements ?? []) {
        const name = el.tags?.name?.trim();
        if (name) names.add(name);
      }
      if (names.size > 0) {
        const sorted = [...names].sort((a, b) => a.localeCompare(b, "de"));
        writeCache(city.trim(), sorted);
        sharedPut([{ key: sKey, data: sorted }]);
        return sorted;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!reached && lastError) throw lastError;
  return [];
}

/** Straßenvorschläge über Nominatim, falls die Stadtliste nicht verfügbar ist. */
export async function searchStreets(city: string, term: string): Promise<string[]> {
  const q = term.trim();
  if (q.length < 3) return [];
  const data = await nominatim(`${q} ${city}`, 10);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of data) {
    const street = item.address?.road || item.address?.pedestrian;
    if (!street || seen.has(street.toLowerCase())) continue;
    seen.add(street.toLowerCase());
    out.push(street);
  }
  return out;
}

/** Zerlegt "12;14" in einzelne Hausnummern. */
function splitNumbers(raw: string): string[] {
  return raw
    .split(/[;,]/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Lädt alle Hausnummern für die gewählten Straßen. Wirft nur bei echten Netzwerkfehlern. */
export async function fetchHouseNumbers(
  city: string,
  streets: string[],
  onProgress?: (done: number, total: number) => void
): Promise<FoundAddress[]> {
  const result = new Map<string, FoundAddress>();
  const chunkSize = 80;
  let done = 0;

  const houseCache = readJson<FoundAddress[]>(HOUSE_CACHE);
  const cityKey = city.trim().toLowerCase();
  const missing = streets.filter((s) => !houseCache[`${cityKey}|${s}`]?.length);
  if (missing.length) {
    const remote = await sharedGet<FoundAddress[]>(
      missing.map((s) => `houses|${cityKey}|${s}`)
    );
    for (const s of missing) {
      const hit = remote[`houses|${cityKey}|${s}`];
      if (hit?.length) houseCache[`${cityKey}|${s}`] = hit;
    }
    writeJson(HOUSE_CACHE, houseCache);
  }
  const todo: string[] = [];
  for (const street of streets) {
    const hit = houseCache[`${cityKey}|${street}`];
    if (hit?.length) {
      for (const a of hit) result.set(`${a.street.toLowerCase()}|${a.number.toLowerCase()}`, a);
    } else {
      todo.push(street);
    }
  }
  done = streets.length - todo.length;
  onProgress?.(done, streets.length);

  const clauses = todo.length > 0 ? await areaClauses(city.trim()) : [];

  for (let i = 0; i < todo.length; i += chunkSize) {
    const chunk = todo.slice(i, i + chunkSize);
    const alternatives = chunk.map((s) => escapeQuotes(escapeRegex(s))).join("|");
    let reached = false;
    let lastError: unknown = null;
    let gotElements = false;

    for (const clause of clauses) {
      try {
        const data = await overpass(
          `[out:json][timeout:60];${clause}` +
            `nwr["addr:street"~"^(${alternatives})$"]["addr:housenumber"](area.a);out center;`
        );
        reached = true;
        for (const el of data.elements ?? []) {
          const street = el.tags?.["addr:street"];
          const raw = el.tags?.["addr:housenumber"];
          const lat = el.lat ?? el.center?.lat;
          const lng = el.lon ?? el.center?.lon;
          if (!street || !raw || lat === undefined || lng === undefined) continue;
          for (const number of splitNumbers(raw)) {
            const k = `${street.toLowerCase()}|${number.toLowerCase()}`;
            if (!result.has(k)) {
              result.set(k, { street, number, lat, lng });
              gotElements = true;
            }
          }
        }
        if (gotElements) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!reached && lastError) throw lastError;

    if (gotElements) {
      const upload: { key: string; data: unknown }[] = [];
      for (const street of chunk) {
        const found = [...result.values()].filter((a) => a.street === street);
        if (found.length) {
          houseCache[`${cityKey}|${street}`] = found;
          upload.push({ key: `houses|${cityKey}|${street}`, data: found });
        }
      }
      writeJson(HOUSE_CACHE, houseCache);
      sharedPut(upload);
    }
    done += chunk.length;
    onProgress?.(done, streets.length);
  }

  return [...result.values()];
}
