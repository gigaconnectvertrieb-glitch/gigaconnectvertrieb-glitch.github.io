const KEY = "gm.v3";
const MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || localStorage.getItem("gm.v2") || "{}"); }
  catch { return {}; }
}
function write(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
function meters(a, b) {
  const dy = (a.lat - b.lat) * 110540;
  const dx = (a.lng - b.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dx, dy);
}
function judge(tags) {
  const building = String(tags.building || "");
  const flats = Number(tags["building:flats"] || tags["addr:flats"] || 0);
  const levels = Number(tags["building:levels"] || 0);
  if (["apartments", "residential", "dormitory"].includes(building) || flats > 1 || levels >= 4) {
    return { kind: "mfh", confidence: "sicher", units: Math.min(40, Math.max(2, flats || levels * 2 || 4)) };
  }
  if (["house", "detached", "semidetached_house", "terrace", "bungalow", "farm"].includes(building)) {
    return { kind: "efh", confidence: "sicher", units: 1 };
  }
  if (building === "yes" && levels >= 3) return { kind: "mfh", confidence: "unsicher", units: Math.max(2, levels) };
  return { kind: "efh", confidence: "unsicher", units: 1 };
}
async function overpass(query) {
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, { method: "POST", body: `data=${encodeURIComponent(query)}` });
      if (res.ok) return res.json();
    } catch { /* nächster Spiegel */ }
  }
  throw new Error("Analyse nicht erreichbar");
}
async function analyse() {
  const state = read();
  const id = document.querySelector("#list .card.active")?.dataset.id;
  const area = (state.territories || []).find((t) => t.id === id) || state.territories?.[0];
  if (!area?.doors?.length) throw new Error("Kein Gebiet gewählt");
  const lats = area.doors.map((d) => d.lat);
  const lngs = area.doors.map((d) => d.lng);
  const query = `[out:json][timeout:25];way["building"](${Math.min(...lats) - 0.002},${Math.min(...lngs) - 0.002},${Math.max(...lats) + 0.002},${Math.max(...lngs) + 0.002});out center tags;`;
  const data = await overpass(query);
  const hits = (data.elements || []).map((el) => ({ lat: el.center?.lat, lng: el.center?.lon, tags: el.tags || {} })).filter((el) => el.lat && el.lng);
  let sure = 0;
  let unsure = 0;
  for (const door of area.doors) {
    let best = null;
    for (const hit of hits) {
      const away = meters(door, hit);
      if (!best || away < best.away) best = { away, hit };
    }
    const verdict = best && best.away < 40 ? judge(best.hit.tags) : { kind: door.kind || "efh", confidence: "unsicher", units: door.units?.length || 1 };
    door.kind = verdict.kind;
    door.confidence = verdict.confidence;
    if (verdict.confidence === "sicher") sure += 1; else unsure += 1;
  }
  write(state);
  return { sure, unsure, total: area.doors.length };
}
function boot() {
  if (document.getElementById("type-check")) return;
  const host = document.querySelector(".side") || document.body;
  const button = document.createElement("button");
  button.id = "type-check";
  button.type = "button";
  button.className = "btn";
  button.textContent = "Typ prüfen";
  host.appendChild(button);
  const note = document.createElement("p");
  note.id = "type-note";
  note.className = "empty";
  note.textContent = "Stapelanalyse. Unsichere Häuser bleiben unsicher.";
  host.appendChild(note);
  button.onclick = async () => {
    button.disabled = true;
    note.textContent = "Häuser im Gebiet werden gelesen …";
    try {
      const result = await analyse();
      note.textContent = `${result.sure} sicher, ${result.unsure} unsicher von ${result.total}. Unsicher nicht als Einfamilie verbucht.`;
    } catch (err) {
      note.textContent = err.message || "Analyse fehlgeschlagen";
    } finally {
      button.disabled = false;
    }
  };
}
setInterval(boot, 500);
