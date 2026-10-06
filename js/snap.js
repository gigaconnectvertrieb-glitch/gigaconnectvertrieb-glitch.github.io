const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function dist(a, b) {
  const dy = (a.lat - b.lat) * 110540;
  const dx = (a.lng - b.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

async function overpass(query) {
  let last = "Overpass nicht erreichbar";
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) {
        last = `Overpass ${res.status}`;
        continue;
      }
      return await res.json();
    } catch (err) {
      last = err.message || last;
    }
  }
  throw new Error(last);
}

export async function nearestBuilding(lat, lng) {
  const query = `[out:json][timeout:12];
(
  way["building"](around:35,${lat},${lng});
  node["addr:housenumber"](around:35,${lat},${lng});
);
out center tags;`;
  const data = await overpass(query);
  let best = null;
  for (const el of data.elements || []) {
    const tags = el.tags || {};
    const building = String(tags.building || "");
    if (["commercial", "industrial", "warehouse", "garage", "shed"].includes(building)) continue;
    const point = { lat: el.lat || el.center?.lat, lng: el.lon || el.center?.lon };
    if (!point.lat || !point.lng) continue;
    const meters = dist({ lat, lng }, point);
    const named = Boolean(tags["addr:street"] || tags["addr:housenumber"]);
    const score = meters - (named ? 8 : 0);
    if (!best || score < best.score) {
      best = {
        score,
        meters,
        lat: point.lat,
        lng: point.lng,
        street: tags["addr:street"] || "",
        house: tags["addr:housenumber"] || "",
        kind: ["apartments", "residential"].includes(building) ? "mfh" : "efh",
      };
    }
  }
  return best;
}

function label(hit) {
  if (!hit) return "Kein Gebäude unter dem Fadenkreuz";
  const where = [hit.street, hit.house].filter(Boolean).join(" ") || "Gebäude ohne Hausnummer";
  return `${where} · ${Math.round(hit.meters)} m`;
}

function boot() {
  const button = document.getElementById("plan-add");
  const count = document.getElementById("plan-count");
  if (!button || !window.L) return;
  button.textContent = "Haus hier";
  button.addEventListener("click", async (event) => {
    if (button.dataset.snap === "1" || button.dataset.snap === "2") return;
    event.stopImmediatePropagation();
    event.preventDefault();
    const map = window.__gmMap;
    const center = map ? map.getCenter() : null;
    if (!center) {
      button.dataset.snap = "2";
      button.click();
      button.dataset.snap = "";
      return;
    }
    button.disabled = true;
    if (count) count.textContent = "Straße und Hausnummer werden gelesen …";
    try {
      const hit = await nearestBuilding(center.lat, center.lng);
      if (hit && map) map.setView([hit.lat, hit.lng], Math.max(map.getZoom(), 18), { animate: false });
      if (count) count.textContent = label(hit);
    } catch (err) {
      if (count) count.textContent = err.message || "Straße nicht lesbar";
    } finally {
      button.disabled = false;
      button.dataset.snap = "2";
      button.click();
      button.dataset.snap = "";
    }
  }, true);
}

const wait = setInterval(() => {
  if (document.getElementById("plan-add") && window.L) {
    clearInterval(wait);
    boot();
  }
}, 200);
