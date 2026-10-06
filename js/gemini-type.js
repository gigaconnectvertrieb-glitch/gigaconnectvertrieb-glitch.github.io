const MODELS = ["gemini-3.8-flash", "gemini-flash-latest"];
const KEY = "gm.v3";
const GEMINI = "gm.gemini";

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}
function write(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
function geminiKey() {
  let key = localStorage.getItem(GEMINI);
  if (!key) {
    key = prompt("Gemini-Key, bleibt nur in diesem Browser", "") || "";
    if (key) localStorage.setItem(GEMINI, key);
  }
  return key;
}
function tile(lat, lng, zoom = 18) {
  const n = 2 ** zoom;
  const x = Math.floor((lng + 180) / 360 * n);
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
}
async function imagePart(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Luftbild fehlt");
  const bytes = new Uint8Array(await res.arrayBuffer());
  let text = "";
  for (const b of bytes) text += String.fromCharCode(b);
  return { inline_data: { mime_type: "image/jpeg", data: btoa(text) } };
}
async function ask(door, key) {
  const image = await imagePart(tile(door.lat, door.lng));
  const body = { contents: [{ parts: [image, { text: "Sieh das Luftbild. Antworte nur mit einem Wort: efh, mfh oder unsicher. efh = freistehendes oder Doppelhaus. mfh = Block, viele Eingänge oder langer Baukörper. Sonst unsicher." }] }] };
  let last = "Gemini nicht erreichbar";
  for (const model of MODELS) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": key },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { last = data.error?.message || last; continue; }
    const word = String(data.candidates?.[0]?.content?.parts?.[0]?.text || "").toLowerCase();
    if (word.includes("mfh")) return "mfh";
    if (word.includes("efh")) return "efh";
    return "unsicher";
  }
  throw new Error(last);
}
function boot() {
  if (document.getElementById("gemini-check")) return;
  const host = document.querySelector(".side") || document.body;
  const button = document.createElement("button");
  button.id = "gemini-check";
  button.type = "button";
  button.className = "btn";
  button.textContent = "Unsichere mit Bild prüfen";
  host.appendChild(button);
  button.onclick = async () => {
    const key = geminiKey();
    const state = read();
    const id = document.querySelector("#list .card.active")?.dataset.id;
    const area = (state.territories || []).find((t) => t.id === id) || state.territories?.[0];
    const note = document.getElementById("type-note") || button;
    if (!key) { note.textContent = "Gemini-Key fehlt"; return; }
    if (!area) { note.textContent = "Kein Gebiet gewählt"; return; }
    const queue = area.doors.filter((d) => d.confidence !== "sicher").slice(0, 8);
    if (!queue.length) { note.textContent = "Keine unsicheren Häuser. Zuerst Typ prüfen."; return; }
    button.disabled = true;
    let done = 0;
    for (const door of queue) {
      note.textContent = `Bild ${done + 1} von ${queue.length}`;
      try {
        const kind = await ask(door, key);
        if (kind === "mfh" || kind === "efh") { door.kind = kind; door.confidence = "bild"; }
        else door.confidence = "unsicher";
      } catch (err) {
        note.textContent = err.message || "Bildprüfung fehlgeschlagen";
        break;
      }
      done += 1;
    }
    write(state);
    button.disabled = false;
    if (done) note.textContent = `${done} unsichere Häuser mit Luftbild geprüft. Stufe: Bild, nicht amtlich.`;
  };
}
setInterval(boot, 500);
