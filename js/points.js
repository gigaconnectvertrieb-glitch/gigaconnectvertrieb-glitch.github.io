function planningOn() {
  return document.getElementById("plan-bar")?.classList.contains("show");
}
function place(latlng) {
  const map = window.__gmMap;
  const add = document.getElementById("plan-add");
  if (!map || !add || !latlng) return;
  if (!planningOn()) document.getElementById("plan-btn")?.click();
  map.setView(latlng, Math.max(map.getZoom(), 17), { animate: false });
  add.dataset.snap = "2";
  add.click();
  const count = document.getElementById("plan-count");
  if (count && /werden gelesen|nicht lesbar|Overpass/.test(count.textContent || "")) {
    count.textContent = "Punkt gesetzt";
  }
}
function boot() {
  const map = window.__gmMap;
  if (!map || map.__points) return;
  map.__points = true;
  map.on("click", (event) => {
    if (!planningOn()) return;
    place(event.latlng);
  });
  document.getElementById("plan-add")?.addEventListener("click", () => {
    if (!planningOn()) document.getElementById("plan-btn")?.click();
  }, true);
}
setInterval(boot, 400);
