const M = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass-api.openstreetmap.fr/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
  "https://overpass.osm.jp/api/interpreter",
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tryOne(base, q, timeoutMs) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    const res = await fetch(base + "?data=" + encodeURIComponent(q), {
      headers: { Accept: "application/json" },
      signal: c.signal,
    });
    if (!res.ok) throw new Error(`${new URL(base).host} ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function overpassRace(q, timeoutMs = 20000) {
  const attempts = M.map((m) => tryOne(m, q, timeoutMs));
  return await Promise.any(attempts);
}

function collect(d) {
  const seen = new Set(); const out = [];
  for (const el of d.elements || []) {
    const hn = el.tags?.["addr:housenumber"]; if (!hn) continue;
    if (seen.has(hn)) continue; seen.add(hn); out.push(hn);
  }
  return out;
}

const q = `[out:json][timeout:40];area["name"="Groß-Zimmern"]["boundary"="administrative"]->.a;nwr["addr:street"="Memelstraße"]["addr:housenumber"](area.a);out center;`;

let ok = 0;
for (let i = 0; i < 5; i++) {
  const t0 = Date.now();
  try {
    const d = await overpassRace(q);
    const r = collect(d);
    if (r.length) ok++;
    console.log(`Lauf ${i + 1}: ${r.length} (${Date.now() - t0}ms) ${r.slice(0, 5).join(",")}`);
  } catch (e) {
    console.log(`Lauf ${i + 1}: FEHLER ${e.message} (${Date.now() - t0}ms)`);
  }
  await sleep(800);
}
console.log(`\nErfolg: ${ok}/5`);
