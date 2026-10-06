const KEY = "gm.v3";
const REP = "gm.rep";
function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || localStorage.getItem("gm.v2") || "{}"); }
  catch { return {}; }
}
function write(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
function num(house) { const n = parseInt(String(house || "").replace(/\D/g, ""), 10); return Number.isFinite(n) ? n : 0; }
function side(house) { return num(house) % 2; }
function label(d) { return `${d.street || "Ohne Straße"} ${d.house || "?"}`; }
function selected() {
  const id = document.querySelector("#list .card.active")?.dataset.id;
  return (read().territories || []).find((t) => t.id === id) || null;
}
function order(doors, start) {
  const open = (doors || []).filter((d) => d.status !== "erledigt" && d.status !== "abschluss");
  if (!start) return open.slice().sort((a, b) => String(a.street).localeCompare(String(b.street), "de") || num(a.house) - num(b.house));
  const same = open.filter((d) => d.street === start.street && side(d.house) === side(start.house) && d.id !== start.id);
  same.sort((a, b) => Math.abs(num(a.house) - num(start.house)) - Math.abs(num(b.house) - num(start.house)));
  const rest = open.filter((d) => d.id !== start.id && !same.includes(d));
  rest.sort((a, b) => String(a.street).localeCompare(String(b.street), "de") || num(a.house) - num(b.house));
  return [start, ...same, ...rest];
}
function rep() {
  let name = localStorage.getItem(REP);
  if (!name) {
    name = prompt("Name für den Lauf", "") || "Außendienst";
    localStorage.setItem(REP, name);
  }
  return name;
}
function mark(door, status) {
  const state = read();
  const area = (state.territories || []).find((t) => (t.doors || []).some((d) => d.id === door.id));
  if (!area) return;
  const target = area.doors.find((d) => d.id === door.id);
  target.status = status;
  state.visits = state.visits || [];
  state.visits.push({ id: `vis-${Date.now()}`, door_id: door.id, territory_id: area.id, user_id: rep(), reason: status, note: "", street: door.street, house: door.house, zip: door.zip, city: door.city, follow_up_on: status === "nachlauf" ? new Date(Date.now() + 86400000).toISOString().slice(0, 10) : null, week_key: "", list_status: status === "abschluss" || status === "erledigt" ? "erledigt" : "offen" });
  write(state);
  draw();
}
function draw() {
  const dock = document.getElementById("field-dock");
  if (!dock) return;
  const area = selected();
  if (!area) { dock.innerHTML = "<b>Lauf</b><span>Gebiet wählen</span>"; return; }
  const route = order(area.doors, area.doors?.[0]);
  const now = route[0];
  const next = route[1];
  if (!now) { dock.innerHTML = "<b>Lauf fertig</b><span>Keine offenen Häuser</span>"; return; }
  dock.innerHTML = `<div><small>Jetzt · ${now.kind === "mfh" ? "Mehrfamilie" : "Einfamilie"}</small><b>${label(now)}</b><span>Danach ${next ? label(next) : "Ende"}</span></div><div class="field-actions"><button type="button" data-st="nicht_angetroffen">Nicht da</button><button type="button" data-st="kein_interesse">Kein Interesse</button><button type="button" data-st="nachlauf">Nachlauf</button><button type="button" data-st="abschluss">Abschluss</button></div>`;
  dock.querySelectorAll("button").forEach((button) => { button.onclick = () => mark(now, button.dataset.st); });
}
function boot() {
  if (document.getElementById("field-dock")) return;
  const dock = document.createElement("aside");
  dock.id = "field-dock";
  document.body.appendChild(dock);
  const style = document.createElement("style");
  style.textContent = "#field-dock{position:fixed;z-index:800;left:8px;right:8px;bottom:8px;background:#10241c;color:#e7f3ec;border:1px solid #3dd68c;border-radius:14px;padding:10px;display:flex;gap:10px;align-items:center;justify-content:space-between} #field-dock b{display:block;font-size:18px} #field-dock small,#field-dock span{color:#b7cfc4} .field-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px} .field-actions button{min-height:42px;border-radius:10px;border:1px solid #3dd68c;background:#173528;color:#e7f3ec}";
  document.head.appendChild(style);
  new MutationObserver(draw).observe(document.getElementById("list") || document.body, { childList: true, subtree: true });
  draw();
}
boot();
setInterval(draw, 2000);
