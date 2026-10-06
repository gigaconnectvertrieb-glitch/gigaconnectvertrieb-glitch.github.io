const DEMO = new Set(["ter-berlin-prenzl", "ter-leipzig-sued"]);
const origGet = localStorage.getItem.bind(localStorage);
const origSet = localStorage.setItem.bind(localStorage);

function clean(raw) {
  if (!raw) return '{"territories":[],"visits":[],"plan":{"active":false,"mode":"huelle","points":[]}}';
  try {
    const state = JSON.parse(raw);
    state.territories = (state.territories || []).filter((t) => !DEMO.has(t.id) && !/berlin prenzlauer berg|leipzig südvorstadt/i.test(t.name || ""));
    state.visits = (state.visits || []).filter((v) => !DEMO.has(v.territory_id));
    return JSON.stringify(state);
  } catch {
    return raw;
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
