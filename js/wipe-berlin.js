const DEMO = /berlin|leipzig|kastanienallee|oderberger|schönhauser|danziger|kollwitz|prenzlauer|helmholtzstraße|karl-liebknecht|kochstraße|alfred-kästner|ter-berlin|ter-leipzig/i;
const EMPTY = '{"territories":[],"visits":[],"plan":{"active":false,"mode":"huelle","points":[]}}';
const origGet = localStorage.getItem.bind(localStorage);
const origSet = localStorage.setItem.bind(localStorage);
function clean(raw) {
  if (!raw) return EMPTY;
  if (!DEMO.test(raw)) return raw;
  try {
    const state = JSON.parse(raw);
    state.territories = (state.territories || []).filter((t) => !DEMO.test(JSON.stringify(t)));
    state.visits = (state.visits || []).filter((v) => !DEMO.test(JSON.stringify(v)));
    return JSON.stringify(state);
  } catch { return EMPTY; }
}
localStorage.getItem = (key) => {
  if (key === "gm.v1" || key === "gm.v2" || key === "gm.v3") return clean(origGet("gm.v3") || origGet("gm.v2") || origGet("gm.v1"));
  return origGet(key);
};
localStorage.setItem = (key, value) => {
  if (key === "gm.v1" || key === "gm.v2" || key === "gm.v3") {
    origSet("gm.v3", clean(value));
    return;
  }
  origSet(key, value);
};
origSet("gm.v3", clean(origGet("gm.v3") || origGet("gm.v2") || origGet("gm.v1")));
localStorage.removeItem("gm.v2");
localStorage.removeItem("gm.v1");
function hide() {
  document.querySelectorAll(".card, .door, #detail b").forEach((node) => {
    if (DEMO.test(node.textContent || "")) node.closest(".card, .door")?.remove();
  });
}
new MutationObserver(hide).observe(document.documentElement, { childList: true, subtree: true });
hide();
