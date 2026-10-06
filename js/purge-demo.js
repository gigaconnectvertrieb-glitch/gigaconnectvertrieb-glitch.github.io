const KEY = "gm.v3";
const TOMB = "gm.deleted";
const DEMO = ["ter-berlin-prenzl", "ter-leipzig-sued"];

function remember(ids) {
  const current = new Set(JSON.parse(localStorage.getItem(TOMB) || "[]"));
  ids.forEach((id) => current.add(id));
  localStorage.setItem(TOMB, JSON.stringify([...current]));
}

function strip() {
  remember(DEMO);
  const raw = localStorage.getItem(KEY);
  if (!raw) return;
  const state = JSON.parse(raw);
  const before = (state.territories || []).length;
  state.territories = (state.territories || []).filter((t) => !DEMO.includes(t.id) && !/berlin prenzlauer berg|leipzig südvorstadt/i.test(t.name || ""));
  state.visits = (state.visits || []).filter((v) => !DEMO.includes(v.territory_id));
  if (state.territories.length === before) return;
  localStorage.setItem(KEY, JSON.stringify(state));
  if (!sessionStorage.getItem("gm.demo-purged")) {
    sessionStorage.setItem("gm.demo-purged", "1");
    location.reload();
  }
}

strip();
setTimeout(strip, 800);
