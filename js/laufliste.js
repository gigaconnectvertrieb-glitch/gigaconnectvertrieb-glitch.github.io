import { GOOGLE_MAPS_API_KEY, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config.js";

const USERS = [
  { id: "orhan", name: "Orhan", pin: "E12026!" },
  { id: "luca", name: "Luca", pin: "E12026!" },
];
const SESSION = "e1.laufliste.session";
const KEY = SUPABASE_PUBLISHABLE_KEY;
const URL = SUPABASE_URL;
let map, points = [], overlays = [], doors = [], me = null;

const $ = (id) => document.getElementById(id);
function session() { try { return JSON.parse(localStorage.getItem(SESSION) || "null"); } catch { return null; } }
function setStatus(text) { $("status").textContent = text; }
function loadGoogle() {
  if (window.google?.maps) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=de`;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
function inside(p, poly) {
  let n = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const yi = poly[i].lat, yj = poly[j].lat, xi = poly[i].lng, xj = poly[j].lng;
    if ((yi > p.lat) !== (yj > p.lat) && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) n = !n;
  }
  return n;
}
function draw() {
  overlays.forEach((o) => o.setMap(null));
  overlays = [];
  points.forEach((p) => overlays.push(new google.maps.Marker({ map, position: p })));
  if (points.length > 2) overlays.push(new google.maps.Polygon({ map, paths: points, strokeColor: "#d6b15e", fillColor: "#d6b15e", fillOpacity: 0.18 }));
  doors.forEach((d, i) => overlays.push(new google.maps.Marker({ map, position: d, label: String(i + 1) })));
}
function order(list) {
  const streets = [...new Set(list.map((d) => d.street))];
  const out = [];
  for (const street of streets) {
    const side = list.filter((d) => d.street === street).sort((a, b) => a.house.localeCompare(b.house, "de", { numeric: true }));
    out.push(...side.filter((d) => parseInt(d.house, 10) % 2 === 1), ...side.filter((d) => parseInt(d.house, 10) % 2 === 0).reverse());
  }
  return out;
}
function renderWalk() {
  $("walk").innerHTML = doors.map((d, i) => `<li><b>${i + 1}</b><span>${d.street} ${d.house}</span><button data-i="${i}" type="button">${d.status || "offen"}</button></li>`).join("");
}
async function rest(path, options = {}) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation", ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}
async function readHouses() {
  if (points.length < 3) return setStatus("Mindestens drei Punkte setzen.");
  setStatus("Häuser werden gelesen");
  const lats = points.map((p) => p.lat), lngs = points.map((p) => p.lng);
  const south = Math.min(...lats), west = Math.min(...lngs), north = Math.max(...lats), east = Math.max(...lngs);
  const query = `[out:json][timeout:25];(way["building"](${south},${west},${north},${east});node["addr:housenumber"](${south},${west},${north},${east}););out center tags;`;
  const over = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: `data=${encodeURIComponent(query)}` }).then((r) => r.json()).catch(() => ({ elements: [] }));
  const addresses = (over.elements || []).filter((el) => el.tags?.["addr:housenumber"]).map((el) => ({ street: el.tags["addr:street"] || "", house: el.tags["addr:housenumber"], lat: el.lat || el.center?.lat, lng: el.lon || el.center?.lon }));
  const found = [];
  for (const el of over.elements || []) {
    if (!el.tags?.building) continue;
    const lat = el.center?.lat, lng = el.center?.lon;
    if (!lat || !inside({ lat, lng }, points)) continue;
    const near = addresses.find((a) => a.lat && Math.hypot((a.lat - lat) * 111000, (a.lng - lng) * 70000) < 35);
    found.push({ street: el.tags["addr:street"] || near?.street || "Ohne Straße", house: el.tags["addr:housenumber"] || near?.house || "", lat, lng, status: "offen" });
  }
  if (!found.length) {
    for (let i = 1; i <= 3 && found.length < 40; i++) for (let j = 1; j <= 3 && found.length < 40; j++) {
      const lat = south + ((north - south) * i) / 4, lng = west + ((east - west) * j) / 4;
      const hit = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=de`).then((r) => r.json()).catch(() => null);
      for (const result of hit?.results || []) {
        const parts = result.address_components || [];
        const house = parts.find((p) => p.types.includes("street_number"))?.long_name;
        const street = parts.find((p) => p.types.includes("route"))?.long_name;
        if (!house || !street || found.some((d) => d.street === street && d.house === house)) continue;
        found.push({ street, house, lat: result.geometry.location.lat, lng: result.geometry.location.lng, status: "offen" });
      }
    }
  }
  doors = order(found.filter((d) => d.house));
  draw();
  renderWalk();
  setStatus(doors.length ? `${doors.length} Häuser in Laufliste` : "Keine Häuser in der Fläche");
}
async function save() {
  if (!doors.length) return setStatus("Erst Häuser lesen.");
  const id = crypto.randomUUID();
  const name = $("name").value.trim() || doors[0].street || "Laufliste";
  await rest("gm_territories", { method: "POST", body: JSON.stringify({ id, name, center: points[0], polygon: points }) });
  await rest("gm_doors", { method: "POST", body: JSON.stringify(doors.map((d, i) => ({ id: crypto.randomUUID(), territory_id: id, street: d.street, house: d.house, lat: d.lat, lng: d.lng, status: d.status || "offen", sort_order: i + 1, note: `Halt ${String(i + 1).padStart(3, "0")}` }))) });
  await rest("gm_territory_members", { method: "POST", body: JSON.stringify({ territory_id: id, user_id: $("owner").value }) });
  setStatus("Laufliste gespeichert");
  loadSaved();
}
async function loadSaved() {
  const rows = await rest("gm_territories?select=id,name&order=updated_at.desc").catch(() => []);
  $("saved").innerHTML = `<option value="">Gespeicherte Liste</option>` + rows.map((r) => `<option value="${r.id}">${r.name}</option>`).join("");
}
async function openSaved(id) {
  if (!id) return;
  const rows = await rest(`gm_doors?territory_id=eq.${id}&select=street,house,lat,lng,status,sort_order&order=sort_order`);
  doors = rows;
  points = [];
  draw();
  renderWalk();
  if (doors[0]) map.setCenter(doors[0]);
  setStatus(`${doors.length} gespeicherte Häuser`);
}
async function boot() {
  me = session();
  if (!me) return;
  $("login").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("who").textContent = me.name;
  $("owner").value = me.id;
  await loadGoogle();
  map = new google.maps.Map($("map"), { center: { lat: 49.972, lng: 8.787 }, zoom: 16, mapTypeControl: true, streetViewControl: false });
  map.addListener("click", (e) => { points.push({ lat: e.latLng.lat(), lng: e.latLng.lng() }); draw(); setStatus(`${points.length} Punkte`); });
  const ac = new google.maps.places.Autocomplete($("search"), { componentRestrictions: { country: "de" } });
  ac.addListener("place_changed", () => { const p = ac.getPlace(); if (p.geometry?.location) map.setCenter(p.geometry.location); });
  $("undo").onclick = () => { points.pop(); draw(); };
  $("clear").onclick = () => { points = []; doors = []; draw(); renderWalk(); setStatus("Markierung gelöscht"); };
  $("read").onclick = () => readHouses();
  $("save").onclick = () => save().catch((err) => setStatus(err.message || "Speichern fehlgeschlagen"));
  $("saved").onchange = (e) => openSaved(e.target.value);
  $("walk").onclick = (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const d = doors[Number(btn.dataset.i)];
    d.status = d.status === "offen" ? "erledigt" : d.status === "erledigt" ? "nicht da" : "offen";
    renderWalk();
  };
  $("logout").onclick = () => { localStorage.removeItem(SESSION); location.reload(); };
  loadSaved();
}
$("login-form").onsubmit = (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const user = USERS.find((u) => u.id === String(data.get("name")).trim().toLowerCase() && u.pin === data.get("pin"));
  if (!user) return ($("login-error").textContent = "Benutzer oder Passwort falsch");
  localStorage.setItem(SESSION, JSON.stringify(user));
  boot();
};
if (session()) boot();
