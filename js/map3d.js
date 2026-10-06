const SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const LABELS = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const ROADS = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";
const STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    sat: { type: "raster", tiles: [SAT], tileSize: 256, maxzoom: 19, attribution: "Esri, Maxar" },
    roads: { type: "raster", tiles: [ROADS], tileSize: 256, maxzoom: 19 },
    labels: { type: "raster", tiles: [LABELS], tileSize: 256, maxzoom: 19 },
    terrain: { type: "raster-dem", tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"], encoding: "terrarium", tileSize: 256, maxzoom: 15 },
  },
  layers: [
    { id: "sat", type: "raster", source: "sat", paint: { "raster-resampling": "linear", "raster-fade-duration": 0 } },
    { id: "roads", type: "raster", source: "roads", paint: { "raster-opacity": 0.85 } },
    { id: "labels", type: "raster", source: "labels", paint: { "raster-opacity": 1 } },
  ],
};
function fallback(map) {
  map.eachLayer((layer) => { if (layer instanceof L.TileLayer) map.removeLayer(layer); });
  L.tileLayer(SAT, { maxZoom: 19, attribution: "Esri, Maxar" }).addTo(map);
  L.tileLayer(ROADS, { maxZoom: 19, opacity: 0.85 }).addTo(map);
  L.tileLayer(LABELS, { maxZoom: 19 }).addTo(map);
}
function boot() {
  const map = window.__gmMap;
  if (!map || !window.L) return;
  map.setMaxZoom(19);
  if (!L.maplibreGL || !window.maplibregl) { fallback(map); return; }
  map.eachLayer((layer) => { if (layer instanceof L.TileLayer) map.removeLayer(layer); });
  const gl = L.maplibreGL({ style: STYLE, pitch: 58, bearing: -18, maxPitch: 78, attributionControl: false }).addTo(map);
  const raw = gl.getMaplibreMap();
  window.__gmGl = raw;
  raw.setPixelRatio(Math.min(window.devicePixelRatio || 2, 3));
  raw.on("load", () => {
    if (raw.getSource("terrain")) raw.setTerrain({ source: "terrain", exaggeration: 1.2 });
    raw.easeTo({ pitch: 58, bearing: -18, duration: 500 });
  });
  raw.on("error", () => fallback(map));
}
const wait = setInterval(() => { if (window.__gmMap && window.L) { clearInterval(wait); boot(); } }, 200);
