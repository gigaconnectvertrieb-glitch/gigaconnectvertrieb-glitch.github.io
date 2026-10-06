const KEY = "gm.v3";
let line = null;
let marks = null;

function state() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
function selectedId() {
  return document.querySelector("#list .card.active")?.dataset.id || null;
}
function meters(a, b) {
  const dy = (a.lat - b.lat) * 110540;
  const dx = (a.lng - b.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dx, dy);
}
function norm(value) {
  return String(value || "").toLowerCase().replace(/ß/g, "ss").replace(/[^a-z0-9]/g, "");
}
function sameHouse(a, b) {
  return norm(a) === norm(b);
}
function label(d) {
  return `${d.street || "Ohne Straße"} ${d.house || "?"}`;
}

function orderFrom(start, doors) {
  const open = doors.filter((d) => d.status !== "erledigt" && d.status !== "abschluss");
  const pool = open.filter((d) => d.id !== start.id);
  const route = [start];
  let cursor = start;
  while (pool.length) {
    let best = 0;
    let bestD = Infinity;
    pool.forEach((d, i) => {
      const dist = meters(cursor, d);
      if (dist < bestD) {
        bestD = dist;
        best = i;
      }
    });
    cursor = pool.splice(best, 1)[0];
    route.push(cursor);
  }
  return route;
}

async function draw(route) {
  const map = window.__gmMap;
  if (!map || !window.L) return;
  if (line) map.removeLayer(line);
  if (marks) map.removeLayer(marks);
  marks = L.layerGroup().addTo(map);
  const shown = route.slice(0, 40);
  shown.forEach((d, i) => {
    const marker = L.marker([d.lat, d.lng], {
      icon: L.divIcon({
        className: "route-stop",
        html: `<b>${i + 1}</b><span>${d.house || "?"}</span>`,
        iconSize: [54, 28],
        iconAnchor: [27, 14],
      }),
    });
    marker.bindTooltip(label(d), { permanent: false, direction: "top" });
    marker.addTo(marks);
  });
  const sample = shown.slice(0, 24);
  const path = sample.map((d) => `${d.lng},${d.lat}`).join(";");
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/foot/${path}?overview=full&geometries=geojson`);
    const data = await res.json();
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (coords?.length) {
      line = L.polyline(coords.map(([lng, lat]) => [lat, lng]), { color: "#3dd68c", weight: 4, opacity: 0.9 }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [24, 24], maxZoom: 18 });
      return;
    }
  } catch {
    /* Luftlinie, wenn der Router nicht antwortet. */
  }
  line = L.polyline(sample.map((d) => [d.lat, d.lng]), { color: "#3dd68c", weight: 3, dashArray: "6 6" }).addTo(map);
  map.fitBounds(line.getBounds(), { padding: [24, 24], maxZoom: 18 });
}

function ensureBox() {
  const root = document.getElementById("detail");
  if (!root || root.querySelector("#route-box")) return;
  const box = document.createElement("form");
  box.id = "route-box";
  box.className = "form";
  box.innerHTML = `
    <input name="street" placeholder="Startstraße, z. B. Musterstraße" required />
    <input name="house" placeholder="Nr. 1" required />
    <button class="btn primary" type="submit">Laufroute</button>
    <p class="empty" id="route-status">Startadresse. Die Karte zeigt Reihenfolge und Hausnummer.</p>
    <div id="route-list"></div>`;
  root.prepend(box);
  box.onsubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const form = new FormData(box);
    const area = (state().territories || []).find((t) => t.id === selectedId());
    const status = document.getElementById("route-status");
    if (!area) {
      status.textContent = "Zuerst ein Gebiet wählen.";
      return;
    }
    const street = norm(form.get("street"));
    const house = String(form.get("house") || "");
    const start = (area.doors || []).find((d) => norm(d.street).includes(street) && sameHouse(d.house, house))
      || (area.doors || []).find((d) => norm(d.street).includes(street));
    if (!start) {
      status.textContent = "Diese Adresse liegt nicht im Gebiet.";
      return;
    }
    const route = orderFrom(start, area.doors || []);
    const list = document.getElementById("route-list");
    list.innerHTML = route.slice(0, 20).map((d, i) => `<div class="door"><i class="dot ${d.status || "offen"}"></i><div><b>${i + 1}. ${label(d)}</b><br><small>${d.kind === "mfh" ? "Mehrfamilie" : "Einfamilie"}</small></div></div>`).join("");
    status.textContent = `${route.length} Stopps. Auf der Karte stehen Reihenfolge und Hausnummer.`;
    await draw(route);
  };
}

const style = document.createElement("style");
style.textContent = `.route-stop{background:#062216;color:#e7f3ec;border:1px solid #3dd68c;border-radius:8px;display:flex;gap:4px;align-items:center;justify-content:center;font:12px/1 "Segoe UI",sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.35)} .route-stop b{color:#3dd68c} .route-stop span{font-weight:700}`;
document.head.appendChild(style);

new MutationObserver(ensureBox).observe(document.getElementById("detail") || document.body, { childList: true, subtree: true });
ensureBox();
