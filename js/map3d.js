const STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    sat: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Esri, Maxar, Earthstar Geographics",
    },
    terrain: {
      type: "raster-dem",
      tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
      encoding: "terrarium",
      tileSize: 256,
      maxzoom: 15,
    },
  },
  layers: [
    { id: "sat", type: "raster", source: "sat", paint: { "raster-resampling": "linear", "raster-fade-duration": 0 } },
  ],
};

function boot() {
  const map = window.__gmMap;
  if (!map || !window.L || !L.maplibreGL || !window.maplibregl) return;
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) map.removeLayer(layer);
  });
  const gl = L.maplibreGL({
    style: STYLE,
    pitch: 58,
    bearing: -18,
    maxPitch: 78,
    attributionControl: false,
  }).addTo(map);
  map.setMaxZoom(19);
  const raw = gl.getMaplibreMap();
  raw.setPixelRatio(Math.min(window.devicePixelRatio || 2, 3));
  raw.on("load", () => {
    if (!raw.getSource("terrain")) return;
    raw.setTerrain({ source: "terrain", exaggeration: 1.35 });
  });
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn";
  button.textContent = "3D";
  button.style.position = "absolute";
  button.style.zIndex = "600";
  button.style.top = "10px";
  button.style.right = "10px";
  document.querySelector(".map-wrap")?.appendChild(button);
  let pitched = true;
  button.onclick = () => {
    pitched = !pitched;
    raw.easeTo({ pitch: pitched ? 58 : 0, bearing: pitched ? -18 : 0, duration: 500 });
    button.classList.toggle("primary", pitched);
  };
  button.classList.add("primary");
}

const wait = setInterval(() => {
  if (window.__gmMap && window.L && L.maplibreGL) {
    clearInterval(wait);
    boot();
  }
}, 200);
