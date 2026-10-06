const MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

function kindOf(tags) {
  const building = String(tags.building || "");
  const flats = Number(tags["building:flats"] || tags["addr:flats"] || 0);
  const levels = Number(tags["building:levels"] || 0);
  if (["apartments", "residential", "dormitory"].includes(building) || flats > 1 || levels >= 4) return "mfh";
  if (["house", "detached", "semidetached_house", "terrace", "bungalow"].includes(building)) return "efh";
  if (building === "yes" && levels >= 3) return "mfh";
  return "efh";
}
function heightOf(tags, kind) {
  const given = Number(tags.height || tags["building:height"] || 0);
  if (given) return given;
  const levels = Number(tags["building:levels"] || 0);
  if (levels) return levels * 3;
  return kind === "mfh" ? 14 : 6;
}
function ring(el) {
  if (!el.geometry) return null;
  const coords = el.geometry.filter((p) => p.lat && p.lon).map((p) => [p.lon, p.lat]);
  if (coords.length < 4) return null;
  if (coords[0][0] !== coords.at(-1)[0] || coords[0][1] !== coords.at(-1)[1]) coords.push(coords[0]);
  return coords;
}
async function overpass(query) {
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, { method: "POST", body: `data=${encodeURIComponent(query)}` });
      if (res.ok) return res.json();
    } catch { /* nächster Spiegel */ }
  }
  throw new Error("Gebäude nicht gelesen");
}
async function loadBuildings(map) {
  const b = map.getBounds();
  const query = `[out:json][timeout:20];way["building"](${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()});out geom;`;
  const data = await overpass(query);
  const features = [];
  for (const el of data.elements || []) {
    const coords = ring(el);
    if (!coords) continue;
    const tags = el.tags || {};
    const kind = kindOf(tags);
    features.push({
      type: "Feature",
      properties: {
        kind,
        height: heightOf(tags, kind),
        label: [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" "),
      },
      geometry: { type: "Polygon", coordinates: [coords] },
    });
  }
  return { type: "FeatureCollection", features };
}
function glMap() {
  return window.__gmGl || null;
}
function boot() {
  const wrap = document.querySelector(".map-wrap");
  if (!wrap || document.getElementById("b3d")) return;
  const button = document.createElement("button");
  button.id = "b3d";
  button.type = "button";
  button.className = "btn";
  button.textContent = "Gebäude 3D";
  button.style.cssText = "position:absolute;z-index:620;top:48px;left:10px;";
  wrap.appendChild(button);
  let on = false;
  button.onclick = async () => {
    const raw = glMap();
    if (!raw) {
      button.textContent = "3D-Karte fehlt";
      return;
    }
    if (on) {
      if (raw.getLayer("houses-3d")) raw.removeLayer("houses-3d");
      if (raw.getSource("houses")) raw.removeSource("houses");
      on = false;
      button.textContent = "Gebäude 3D";
      button.classList.remove("primary");
      return;
    }
    button.textContent = "Lese Gebäude …";
    try {
      const geo = await loadBuildings(window.__gmMap);
      if (raw.getSource("houses")) raw.getSource("houses").setData(geo);
      else raw.addSource("houses", { type: "geojson", data: geo });
      if (!raw.getLayer("houses-3d")) {
        raw.addLayer({
          id: "houses-3d",
          type: "fill-extrusion",
          source: "houses",
          paint: {
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 0.82,
            "fill-extrusion-color": ["match", ["get", "kind"], "mfh", "#e6b35a", "#7eb6ff"],
          },
        });
      }
      raw.easeTo({ pitch: 64, duration: 500 });
      on = true;
      button.textContent = `3D aus · ${geo.features.length}`;
      button.classList.add("primary");
    } catch (err) {
      button.textContent = err.message || "3D fehlgeschlagen";
    }
  };
}
setInterval(() => {
  if (!window.__gmGl) {
    const map = window.__gmMap;
    map?.eachLayer?.((layer) => {
      if (layer.getMaplibreMap) window.__gmGl = layer.getMaplibreMap();
    });
  }
  boot();
}, 500);
