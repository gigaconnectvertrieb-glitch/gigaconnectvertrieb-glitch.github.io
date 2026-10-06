function planningOn() {
  return document.getElementById("plan-bar")?.classList.contains("show");
}
function place(latlng) {
  const map = window.__gmMap;
  const add = document.getElementById("plan-add");
  if (!map || !add || !latlng) return;
  const run = () => {
    map.setView(latlng, Math.max(map.getZoom(), 17), { animate: false });
    add.dataset.snap = "2";
    add.click();
  };
  if (!planningOn()) {
    document.getElementById("plan-btn")?.click();
    setTimeout(run, 80);
    return;
  }
  run();
}
function boot() {
  const map = window.__gmMap;
  if (!map || map.__points) return;
  map.__points = true;
  map.on("click", (event) => place(event.latlng));
}
setInterval(boot, 400);
