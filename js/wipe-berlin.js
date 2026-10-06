const DEMO = /kastanienallee|oderberger|schönhauser allee|danziger straße|kollwitzstraße|prenzlauer allee|helmholtzstraße|karl-liebknecht|kochstraße|alfred-kästner|berlin prenzlauer|leipzig südvorstadt|ter-berlin-prenzl|ter-leipzig-sued/i;
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
