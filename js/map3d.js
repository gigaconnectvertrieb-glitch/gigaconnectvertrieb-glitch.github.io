const SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    sat: { type: "raster", tiles: [SAT], tileSize: 256, maxzoom: 19, attribution: "Esri, Maxar, Earthstar Geographics" },
    terrain: {
      type: "raster-dem",
      tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
      encoding: "terrarium",
      tileSize: 256,
      maxzoom: 15,
    },
  },
  layers: [{ id: "sat", type: "raster", source: "sat", paint: { "raster-resampling": "linear", "raster-fade-duration": 0 } }],
};

function fallback(map) {
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) map.removeLayer(layer);
  });
  L.tileLayer(SAT, { maxZoom: 19, attribution: "Esri, Maxar" }).addTo(map);
}

function boot() {
  const map = window.__gmMap;
  if (!map || !window.L) return;
  map.setMaxZoom(19);
  if (!L.maplibreGL || !window.maplibregl) {
    fallback(map);
    return;
  }
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) map.removeLayer(layer);
  });
  const gl = L.maplibreGL({
    style: STYLE,
    pitch: 62,
    bearing: -20,
    maxPitch: 78,
    attributionControl: false,
  }).addTo(map);
  const raw = gl.getMaplibreMap();
  raw.setPixelRatio(Math.min(window.devicePixelRatio || 2, 3));
  raw.on("load", () => {
    if (raw.getSource("terrain")) raw.setTerrain({ source: "terrain", exaggeration: 1.4 });
    raw.easeTo({ pitch: 62, bearing: -20, duration: 600 });
  });
  raw.on("error", () => fallback(map));
}

const wait = setInterval(() => {
  if (window.__gmMap && window.L) {
    clearInterval(wait);
    boot();
  }
}, 200);
