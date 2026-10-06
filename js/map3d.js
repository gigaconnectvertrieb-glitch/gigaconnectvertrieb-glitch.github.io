const CARTO_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfYTY2dTU1cnMiLCJqdGkiOiJhYWFlOTExMTQyOWFmNTU4MTdlOGUxZGMxODYwYjRmZiJ9.TYAmCxDAUDhKaIV0XT5afh_4vKnWoZ8nbskoX7nkEWg";
const STREET = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=" + CARTO_KEY;
const SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
let satLayer = null;

function boot() {
  const map = window.__gmMap;
  if (!map || !window.L) return;
  map.setMaxZoom(20);
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) map.removeLayer(layer);
  });
  L.tileLayer(STREET, {
    maxZoom: 20,
    subdomains: "abcd",
    attribution: "&copy; OpenStreetMap, &copy; CARTO",
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
    satLayer = L.tileLayer(SAT, { maxZoom: 19, opacity: 1 }).addTo(map);
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
