import { SUPABASE_SECRET_KEY, SUPABASE_URL, supabaseConfigured } from "./config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KEY = "gm.v3";
const cloud = supabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${SUPABASE_SECRET_KEY}` } },
    })
  : null;

function selectedId() {
  return document.querySelector("#list .card.active")?.dataset.id || null;
}

function ensureButton() {
  const root = document.getElementById("detail");
  const id = selectedId();
  if (!root || !id) return;
  if (root.querySelector("[data-delete-area]")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn";
  button.dataset.deleteArea = id;
  button.textContent = "Gebiet löschen";
  button.style.marginTop = "12px";
  button.style.borderColor = "#e06a6a";
  button.style.color = "#e06a6a";
  root.appendChild(button);
}

async function removeArea(id) {
  const raw = localStorage.getItem(KEY);
  const state = raw ? JSON.parse(raw) : { territories: [], visits: [] };
  const area = (state.territories || []).find((t) => t.id === id);
  const name = area?.name || "dieses Gebiet";
  if (!confirm(`${name} wirklich löschen? Gebäude und Besuche darin gehen mit.`)) return;
  state.territories = (state.territories || []).filter((t) => t.id !== id);
  state.visits = (state.visits || []).filter((v) => v.territory_id !== id);
  localStorage.setItem(KEY, JSON.stringify(state));
  if (cloud) {
    await cloud.from("gm_visits").delete().eq("territory_id", id);
    await cloud.from("gm_doors").delete().eq("territory_id", id);
    await cloud.from("gm_territory_members").delete().eq("territory_id", id);
    await cloud.from("gm_territories").delete().eq("id", id);
  }
  location.reload();
}

document.getElementById("detail")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-area]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  removeArea(button.dataset.deleteArea);
});

new MutationObserver(ensureButton).observe(document.getElementById("detail") || document.body, { childList: true, subtree: true });
ensureButton();
