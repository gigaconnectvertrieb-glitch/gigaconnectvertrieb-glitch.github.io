import { cloudLabel, pullCloud, pushCloud } from "./remote.js";

const KEY = "gm.v3";
const el = document.getElementById("cloud");
const setCloud = (text) => {
  if (el) el.textContent = text;
};

setCloud(cloudLabel());

const orig = localStorage.setItem.bind(localStorage);
let pushing = false;
localStorage.setItem = (key, value) => {
  orig(key, value);
  if (key !== KEY || pushing) return;
  clearTimeout(window.__gmPush);
  window.__gmPush = setTimeout(() => {
    let state;
    try {
      state = JSON.parse(value);
    } catch {
      return;
    }
    setCloud("Speichert …");
    pushing = true;
    pushCloud(state)
      .then((res) => setCloud(res.label))
      .catch((err) => setCloud(err.message || "Sync fehlgeschlagen"))
      .finally(() => {
        pushing = false;
      });
  }, 700);
};

pullCloud()
  .then(async (remote) => {
    if (!remote) return;
    if (!remote.territories.length) {
      const local = localStorage.getItem(KEY);
      if (!local) return;
      await pushCloud(JSON.parse(local));
      setCloud("Supabase · lokal hochgeladen");
      return;
    }
    const current = JSON.parse(localStorage.getItem(KEY) || "{}");
    const same = JSON.stringify(current.territories || []) === JSON.stringify(remote.territories)
      && JSON.stringify(current.visits || []) === JSON.stringify(remote.visits);
    if (same) {
      setCloud(`Supabase · ${remote.territories.length} Gebiete`);
      return;
    }
    pushing = true;
    orig(KEY, JSON.stringify({ ...current, territories: remote.territories, visits: remote.visits }));
    pushing = false;
    setCloud(`Supabase · ${remote.territories.length} Gebiete`);
  })
  .catch((err) => setCloud(err.message || "Supabase nicht erreichbar, lokal aktiv"));
