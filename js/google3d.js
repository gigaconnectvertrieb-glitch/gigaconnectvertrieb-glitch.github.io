import { GOOGLE_MAPS_API_KEY } from "./config.js";

function center() {
  const map = window.__gmMap;
  const c = map?.getCenter();
  return c ? { lat: c.lat, lng: c.lng } : { lat: 49.98, lng: 8.83 };
}
function hideErrors() {
  document.querySelectorAll("body *").forEach((node) => {
    if (node.childNodes.length === 1 && /gmp-map-3d|not an accepted value/i.test(node.textContent || "")) node.remove();
  });
}
async function show() {
  const wrap = document.querySelector(".map-wrap");
  const point = center();
  if (!window.google?.maps?.importLibrary) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=beta&libraries=maps3d`;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Google 3D nicht geladen"));
      document.head.appendChild(script);
    });
  }
  const { Map3DElement, MapMode } = await google.maps.importLibrary("maps3d");
  let view = document.getElementById("google-3d");
  if (!view) {
    view = new Map3DElement();
    view.id = "google-3d";
    view.style.cssText = "position:absolute;inset:0;z-index:4;";
    wrap.appendChild(view);
  }
  view.mode = MapMode.SATELLITE;
  view.center = { lat: point.lat, lng: point.lng, altitude: 0 };
  view.tilt = 67;
  view.range = 700;
  view.hidden = false;
}
function boot() {
  const wrap = document.querySelector(".map-wrap");
  if (!wrap || document.getElementById("google-3d-btn")) return;
  const button = document.createElement("button");
  button.id = "google-3d-btn";
  button.type = "button";
  button.className = "btn";
  button.textContent = "Google 3D";
  button.style.cssText = "position:absolute;z-index:620;top:48px;left:10px;";
  wrap.appendChild(button);
  button.onclick = async () => {
    const view = document.getElementById("google-3d");
    if (view && !view.hidden) {
      view.hidden = true;
      button.textContent = "Google 3D";
      return;
    }
    button.textContent = "Lädt …";
    try {
      await show();
      button.textContent = "Plan";
    } catch (err) {
      document.getElementById("google-3d")?.remove();
      button.textContent = "Google 3D aus";
    }
    hideErrors();
  };
  setInterval(hideErrors, 1500);
}
boot();
