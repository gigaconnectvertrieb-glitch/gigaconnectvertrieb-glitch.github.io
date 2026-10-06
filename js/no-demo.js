const DEMO = /berlin prenzlauer|leipzig südvorstadt|ter-berlin-prenzl|ter-leipzig-sued/i;
const origGet = localStorage.getItem.bind(localStorage);
const origSet = localStorage.setItem.bind(localStorage);
function clean(raw) {
  const empty = '{"territories":[],"visits":[],"plan":{"active":false,"mode":"huelle","points":[]}}';
  if (!raw) return empty;
  try {
    const state = JSON.parse(raw);
    state.territories = (state.territories || []).filter((t) => !DEMO.test(`${t.id} ${t.name}`));
    state.visits = (state.visits || []).filter((v) => !DEMO.test(v.territory_id || ""));
    return JSON.stringify(state);
  } catch {
    return empty;
  }
}
localStorage.getItem = (key) => {
  if (key === "gm.v1" || key === "gm.v2" || key === "gm.v3") return clean(origGet("gm.v3") || origGet("gm.v2"));
  return origGet(key);
};
localStorage.setItem = (key, value) => {
  if (key === "gm.v1" || key === "gm.v2" || key === "gm.v3") {
    origSet("gm.v3", clean(value));
    return;
  }
  origSet(key, value);
};
origSet("gm.v3", clean(origGet("gm.v3") || origGet("gm.v2")));
localStorage.removeItem("gm.v2");
localStorage.removeItem("gm.v1");
function hide() {
  document.querySelectorAll("#list .card, #detail .meta").forEach((node) => {
    if (DEMO.test(node.textContent || "")) node.remove();
  });
}
new MutationObserver(hide).observe(document.documentElement, { childList: true, subtree: true });
hide();
