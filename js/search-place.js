let highlight = null;

function clearHighlight() {
  const map = window.__gmMap;
  if (highlight && map) map.removeLayer(highlight);
  highlight = null;
}
function draw(row) {
  const map = window.__gmMap;
  if (!map) return;
  clearHighlight();
  const geo = row.geojson;
  if (!geo || row.addresstype === "city" || row.type === "city") return;
  highlight = L.geoJSON(geo, { style: { color: "#e23b3b", weight: 7, opacity: 0.9 } }).addTo(map);
  const bounds = highlight.getBounds();
  if (bounds.isValid()) map.fitBounds(bounds.pad(0.4));
  map.off("moveend", onLeave);
  map.on("moveend", onLeave);
}
function onLeave() {
  const map = window.__gmMap;
  if (!highlight || !map) return;
  const bounds = highlight.getBounds();
  if (!bounds.isValid()) return;
  if (!map.getBounds().intersects(bounds) || map.getZoom() < 14) clearHighlight();
}
async function find(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&polygon_geojson=1&countrycodes=de&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Suche nicht erreichbar");
  return res.json();
}
function boot() {
  if (document.getElementById("place-form")) return;
  const host = document.querySelector(".side");
  if (!host) return;
  const form = document.createElement("form");
  form.id = "place-form";
  form.className = "form";
  form.innerHTML = `<h2>Stadt oder Straße</h2><input name="q" placeholder="Waldstraße Rödermark" required /><button class="btn" type="submit">Karte zeigen</button><button class="btn ghost" id="place-clear" type="button">Highlight löschen</button><p class="empty" id="place-status">Straße wird rot. Wegzoomen löscht die Linie.</p><div id="place-hits"></div>`;
  host.insertBefore(form, host.firstChild);
  document.getElementById("place-clear").onclick = () => {
    clearHighlight();
    document.getElementById("place-status").textContent = "Highlight gelöscht";
  };
  form.onsubmit = async (event) => {
    event.preventDefault();
    const status = document.getElementById("place-status");
    const hits = document.getElementById("place-hits");
    status.textContent = "Suche …";
    clearHighlight();
    try {
      const rows = await find(form.q.value.trim());
      if (!rows.length) { status.textContent = "Nichts gefunden"; hits.innerHTML = ""; return; }
      status.textContent = `${rows.length} Treffer`;
      hits.innerHTML = rows.map((row, i) => `<button type="button" data-i="${i}">${row.display_name}</button>`).join("");
      const show = (row) => {
        const map = window.__gmMap;
        if (!map) return;
        draw(row);
        if (!highlight) map.setView([Number(row.lat), Number(row.lon)], row.addresstype === "city" ? 13 : 17);
        status.textContent = row.addresstype === "city" ? row.display_name : `Rot: ${row.display_name}`;
      };
      hits.querySelectorAll("button").forEach((button) => { button.onclick = () => show(rows[Number(button.dataset.i)]); });
      show(rows[0]);
    } catch (err) {
      status.textContent = err.message || "Suche fehlgeschlagen";
    }
  };
}
setInterval(boot, 400);
