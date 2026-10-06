const KEY = "gm.v3";
let layer = null;

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
function selectedId() {
  return document.querySelector("#list .card.active")?.dataset.id || null;
}

function draw() {
  const map = window.__gmMap;
  if (!map || !window.L || map.getZoom() < 16) {
    if (layer) layer.clearLayers();
    return;
  }
  const area = (read().territories || []).find((t) => t.id === selectedId());
  if (!layer) layer = L.layerGroup().addTo(map);
  layer.clearLayers();
  if (!area) return;
  for (const door of area.doors || []) {
    if (!Number.isFinite(Number(door.lat)) || !Number.isFinite(Number(door.lng))) continue;
    const house = door.house || "?";
    const street = door.street || "";
    L.marker([door.lat, door.lng], {
      interactive: false,
      icon: L.divIcon({
        className: "addr-label",
        html: `<b>${house}</b><small>${street}</small>`,
        iconSize: [92, 28],
        iconAnchor: [46, 14],
      }),
    }).addTo(layer);
  }
}

const style = document.createElement("style");
style.textContent = `.addr-label{background:rgba(6,22,16,.88);color:#e7f3ec;border:1px solid rgba(61,214,140,.7);border-radius:7px;display:flex;gap:4px;align-items:center;justify-content:center;padding:0 5px;font:11px/1.1 "Segoe UI",sans-serif;pointer-events:none} .addr-label b{color:#fff;font-size:12px} .addr-label small{max-width:62px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#b7cfc4}`;
document.head.appendChild(style);

setInterval(draw, 1200);
window.__gmMap?.on?.("zoomend", draw);
window.__gmMap?.on?.("moveend", draw);
