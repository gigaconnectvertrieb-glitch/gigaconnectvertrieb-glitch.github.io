import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, SUPABASE_URL, supabaseConfigured } from "./config.js";

const KEY = SUPABASE_SECRET_KEY || SUPABASE_PUBLISHABLE_KEY;

export const cloud = supabaseConfigured()
  ? createClient(SUPABASE_URL, KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
    })
  : null;

export function cloudLabel() {
  return cloud ? "Supabase wird geprüft …" : "Nur lokal";
}

function fail(error, what) {
  if (!error) return;
  const msg = error.message || String(error);
  if (/relation|schema cache|does not exist/i.test(msg)) {
    throw new Error("Tabellen fehlen. supabase/schema.sql im SQL-Editor ausführen.");
  }
  if (/invalid api key|secret api key|jwt|unauthorized/i.test(msg)) {
    throw new Error("Secret Key ungültig, App bleibt lokal.");
  }
  throw new Error(`${what}: ${msg}`);
}

export async function pullCloud() {
  if (!cloud) return null;
  const [territories, doors, visits, members, staff] = await Promise.all([
    cloud.from("territories").select("*"),
    cloud.from("doors").select("*").order("sort_order"),
    cloud.from("visits").select("*"),
    cloud.from("territory_members").select("*"),
    cloud.from("staff").select("*"),
  ]);
  fail(territories.error, "Gebiete");
  fail(doors.error, "Gebäude");
  fail(visits.error, "Besuche");
  fail(members.error, "Team");
  fail(staff.error, "Mitarbeiter");
  const byTerritory = new Map();
  for (const row of territories.data || []) {
    byTerritory.set(row.id, {
      id: row.id,
      name: row.name,
      zip: row.zip || "",
      city: row.city || "",
      active: row.active !== false,
      center: row.center || { lat: 51.2, lng: 10.4 },
      polygon: row.polygon || null,
      members: [],
      doors: [],
    });
  }
  for (const row of members.data || []) {
    byTerritory.get(row.territory_id)?.members.push({
      user_id: row.user_id,
      accepted_at: row.accepted_at,
    });
  }
  for (const row of doors.data || []) {
    byTerritory.get(row.territory_id)?.doors.push({
      id: row.id,
      street: row.street || "",
      house: row.house || "",
      zip: row.zip || "",
      city: row.city || "",
      lat: Number(row.lat),
      lng: Number(row.lng),
      note: row.note || "",
      status: row.status || "offen",
      kind: row.kind || "efh",
      units: Array.isArray(row.units) ? row.units : [],
    });
  }
  return {
    territories: [...byTerritory.values()],
    visits: visits.data || [],
    team: (staff.data || []).map((p) => ({ id: p.id, name: p.name, role: p.role || "Vertrieb" })),
  };
}

export async function pushCloud(state) {
  if (!cloud) return { ok: false, label: "Nur lokal" };
  const territories = state.territories.map((t) => ({
    id: t.id,
    name: t.name,
    zip: t.zip || "",
    city: t.city || "",
    active: t.active !== false,
    center: t.center,
    polygon: t.polygon,
  }));
  const doors = state.territories.flatMap((t) =>
    (t.doors || []).map((d, i) => ({
      id: d.id,
      territory_id: t.id,
      street: d.street || "",
      house: d.house || "",
      zip: d.zip || "",
      city: d.city || "",
      lat: d.lat,
      lng: d.lng,
      note: d.note || "",
      status: d.status || "offen",
      kind: d.kind || "efh",
      units: d.units || [],
      sort_order: i,
    })),
  );
  const members = state.territories.flatMap((t) =>
    (t.members || []).map((m) => ({
      territory_id: t.id,
      user_id: m.user_id,
      accepted_at: m.accepted_at,
    })),
  );
  const staff = (state.team || []).map((p) => ({ id: p.id, name: p.name, role: p.role || "Vertrieb" }));
  const visits = (state.visits || []).map((v) => ({
    id: v.id,
    door_id: v.door_id,
    territory_id: v.territory_id,
    user_id: v.user_id,
    reason: v.reason,
    note: v.note || "",
    street: v.street || "",
    house: v.house || "",
    zip: v.zip || "",
    city: v.city || "",
    follow_up_on: v.follow_up_on,
    week_key: v.week_key || "",
    list_status: v.list_status || "offen",
  }));
  const steps = [
    ["Mitarbeiter", cloud.from("staff").upsert(staff)],
    ["Gebiete", cloud.from("territories").upsert(territories)],
    ["Gebäude", doors.length ? cloud.from("doors").upsert(doors) : Promise.resolve({ error: null })],
    ["Zuweisung", members.length ? cloud.from("territory_members").upsert(members) : Promise.resolve({ error: null })],
    ["Besuche", visits.length ? cloud.from("visits").upsert(visits) : Promise.resolve({ error: null })],
  ];
  for (const [what, req] of steps) {
    const { error } = await req;
    fail(error, what);
  }
  return { ok: true, label: `Supabase · ${territories.length} Gebiete` };
}
