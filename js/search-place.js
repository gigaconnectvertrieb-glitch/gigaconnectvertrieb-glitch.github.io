async function find(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=de&limit=5&q=${encodeURIComponent(query)}`;
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
  form.innerHTML = `<h2>Stadt oder Straße</h2><input name="q" placeholder="Rödermark oder Waldstraße Rödermark" required /><button class="btn" type="submit">Karte zeigen</button><p class="empty" id="place-status">Nur suchen, kein Gebiet anlegen.</p><div id="place-hits"></div>`;
  host.insertBefore(form, host.firstChild);
  form.onsubmit = async (event) => {
    event.preventDefault();
    const status = document.getElementById("place-status");
    const hits = document.getElementById("place-hits");
    status.textContent = "Suche …";
    try {
      const rows = await find(form.q.value.trim());
      if (!rows.length) { status.textContent = "Nichts gefunden"; hits.innerHTML = ""; return; }
      status.textContent = `${rows.length} Treffer`;
      hits.innerHTML = rows.map((row, i) => `<button type="button" data-i="${i}">${row.display_name}</button>`).join("");
      hits.querySelectorAll("button").forEach((button) => {
        button.onclick = () => {
          const row = rows[Number(button.dataset.i)];
          const map = window.__gmMap;
          if (!map) return;
          const zoom = row.type === "city" || row.addresstype === "city" ? 13 : 17;
          map.setView([Number(row.lat), Number(row.lon)], zoom);
          status.textContent = row.display_name;
        };
      });
      const first = rows[0];
      window.__gmMap?.setView([Number(first.lat), Number(first.lon)], first.addresstype === "city" ? 13 : 17);
    } catch (err) {
      status.textContent = err.message || "Suche fehlgeschlagen";
    }
  };
}
setInterval(boot, 400);
