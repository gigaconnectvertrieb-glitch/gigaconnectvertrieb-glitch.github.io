import { cloudLabel, pullCloud, pushCloud } from "./remote.js";

const KEY = "gm.v3";
const el = document.getElementById("cloud");
const setCloud = (text) => {
  if (el) el.textContent = text;
};

setCloud(cloudLabel());

const orig = localStorage.setItem.bind(localStorage);
localStorage.setItem = (key, value) => {
  orig(key, value);
  if (key !== KEY) return;
  clearTimeout(window.__gmPush);
  window.__gmPush = setTimeout(() => {
    let state;
    try {
      state = JSON.parse(value);
    } catch {
      return;
    }
    setCloud("Speichert …");
    pushCloud(state).then((res) => setCloud(res.label)).catch((err) => setCloud(err.message || "Sync fehlgeschlagen"));
  }, 500);
};

pullCloud()
  .then(async (remote) => {
    if (!remote) return;
    if (remote.territories.length) {
      const current = JSON.parse(localStorage.getItem(KEY) || "{}");
      const next = {
        ...current,
        territories: remote.territories,
        visits: remote.visits,
      };
      orig(KEY, JSON.stringify(next));
      setCloud(`Supabase · ${remote.territories.length} Gebiete`);
      location.reload();
      return;
    }
    const local = localStorage.getItem(KEY);
    if (local) {
      await pushCloud(JSON.parse(local));
      setCloud("Supabase · lokal hochgeladen");
    }
  })
  .catch((err) => setCloud(err.message || "Supabase nicht erreichbar, lokal aktiv"));
