const DEMO = /kastanienallee|oderberger|schönhauser allee|danziger straße|kollwitzstraße|prenzlauer allee|helmholtzstraße|karl-liebknecht|kochstraße|alfred-kästner|berlin prenzlauer|leipzig südvorstadt/i;
function scrub(raw) {
  if (!raw || !DEMO.test(raw)) return raw;
  try {
    const state = JSON.parse(raw);
    state.territories = (state.territories || []).filter((t) => !DEMO.test(JSON.stringify(t)));
    state.visits = (state.visits || []).filter((v) => !DEMO.test(JSON.stringify(v)));
    return JSON.stringify(state);
  } catch {
    return null;
  }
}
let changed = false;
for (const key of ["gm.v1", "gm.v2", "gm.v3"]) {
  const next = scrub(localStorage.getItem(key));
  if (next && next !== localStorage.getItem(key)) {
    localStorage.setItem(key, next);
    changed = true;
  }
}
function hide() {
  document.querySelectorAll(".door, .card, #detail").forEach((node) => {
    if (node.id === "detail") return;
    if (DEMO.test(node.textContent || "")) node.remove();
  });
}
new MutationObserver(hide).observe(document.documentElement, { childList: true, subtree: true });
hide();
if (changed && !sessionStorage.getItem("gm.wiped")) {
  sessionStorage.setItem("gm.wiped", "1");
  location.reload();
}
