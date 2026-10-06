const STREET = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
let satLayer = null;

function boot() {
  const map = window.__gmMap;
  if (!map || !window.L) return;
  map.setMaxZoom(19);
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) map.removeLayer(layer);
  });
  L.tileLayer(STREET, {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);
  const wrap = document.querySelector(".map-wrap");
  if (!wrap || document.getElementById("sat-toggle")) return;
  const button = document.createElement("button");
  button.id = "sat-toggle";
  button.type = "button";
  button.className = "btn";
  button.textContent = "Satellit";
  button.style.cssText = "position:absolute;z-index:620;top:10px;right:10px;";
  wrap.appendChild(button);
  button.onclick = () => {
    if (satLayer) {
      map.removeLayer(satLayer);
      satLayer = null;
      button.textContent = "Satellit";
      button.classList.remove("primary");
      return;
    }
    satLayer = L.tileLayer(SAT, { maxZoom: 19 }).addTo(map);
    button.textContent = "Normal";
    button.classList.add("primary");
  };
}
const wait = setInterval(() => {
  if (window.__gmMap && window.L) {
    clearInterval(wait);
    boot();
  }
}, 200);
