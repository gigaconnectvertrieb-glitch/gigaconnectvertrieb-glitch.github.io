import { useStore } from "@/store/useStore";
import type { Entry, Tour } from "@/lib/utils";

const URL_BASE = "https://syjwagsgxwfiacbfkoyp.supabase.co/rest/v1";
export const KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5andhZ3NneHdmaWFjYmZrb3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5ODk2MDEsImV4cCI6MjEwNzU2NTYwMX0.Xfb_qgUfoUMUYV9DbotVNOKrFxorQ8Y8UOJHjgSVNZ8";

const META = "laufliste-sync-v1";
const PAGE = 1000;
const BATCH = 400;

interface Meta {
  cursor: { ll_tours: string; ll_entries: string };
  pushed: Record<string, string>;
}

interface Row {
  id: string;
  data: Record<string, unknown>;
  updated_at: string;
  deleted: boolean;
  tour_id?: string;
}

export type SyncState = "idle" | "syncing" | "ok" | "error";
type Listener = (s: SyncState, at: number | null) => void;
const listeners = new Set<Listener>();
let state: SyncState = "idle";
let lastOk: number | null = null;

export const onSyncState = (fn: Listener) => {
  listeners.add(fn);
  fn(state, lastOk);
  return () => {
    listeners.delete(fn);
  };
};

const setState = (s: SyncState) => {
  state = s;
  if (s === "ok") lastOk = Date.now();
  listeners.forEach((l) => l(state, lastOk));
};

const loadMeta = (): Meta => {
  try {
    const raw = localStorage.getItem(META);
    if (raw) return JSON.parse(raw) as Meta;
  } catch {
    /* ignore */
  }
  return { cursor: { ll_tours: "", ll_entries: "" }, pushed: {} };
};

const headers = (extra: Record<string, string> = {}) => ({
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  ...extra,
});

async function upsert(table: string, rows: Row[]) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const res = await fetch(`${URL_BASE}/${table}`, {
      method: "POST",
      headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(rows.slice(i, i + BATCH)),
    });
    if (!res.ok) throw new Error(`${table}: ${res.status}`);
  }
}

async function pull(table: "ll_tours" | "ll_entries", since: string): Promise<Row[]> {
  const out: Row[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const q =
      `${URL_BASE}/${table}?select=*&order=updated_at.asc,id.asc&limit=${PAGE}&offset=${offset}` +
      (since ? `&updated_at=gte.${encodeURIComponent(since)}` : "");
    const res = await fetch(q, { headers: headers() });
    if (!res.ok) throw new Error(`${table}: ${res.status}`);
    const page = (await res.json()) as Row[];
    out.push(...page);
    if (page.length < PAGE) return out;
  }
}

const stamp = (x: { updatedAt?: string; createdAt?: string; visitedAt?: string | null }) =>
  x.updatedAt ?? x.visitedAt ?? x.createdAt ?? "1970-01-01T00:00:00.000Z";

let running = false;
let again = false;
let internal = false;

export async function syncNow() {
  if (running) {
    again = true;
    return;
  }
  running = true;
  setState("syncing");
  try {
    const meta = loadMeta();
    const store = useStore.getState();

    // Push lokaler Änderungen
    const dirtyTours = store.tours.filter((t) => meta.pushed[t.id] !== stamp(t));
    const dirtyEntries = store.entries.filter((e) => meta.pushed[e.id] !== stamp(e));
    const tombs = store.tombstones;
    const tombTours = tombs.filter((t) => t.kind === "tour");
    const tombEntries = tombs.filter((t) => t.kind === "entry");

    await upsert("ll_tours", [
      ...dirtyTours.map((t) => ({
        id: t.id,
        data: t as unknown as Record<string, unknown>,
        updated_at: stamp(t),
        deleted: false,
      })),
      ...tombTours.map((t) => ({ id: t.id, data: {}, updated_at: t.at, deleted: true })),
    ]);
    await upsert("ll_entries", [
      ...dirtyEntries.map((e) => ({
        id: e.id,
        tour_id: e.tourId,
        data: e as unknown as Record<string, unknown>,
        updated_at: stamp(e),
        deleted: false,
      })),
      ...tombEntries.map((t) => ({
        id: t.id,
        tour_id: t.tourId ?? "",
        data: {},
        updated_at: t.at,
        deleted: true,
      })),
    ]);
    for (const t of dirtyTours) meta.pushed[t.id] = stamp(t);
    for (const e of dirtyEntries) meta.pushed[e.id] = stamp(e);
    if (tombs.length) {
      internal = true;
      store.clearTombstones(tombs.map((t) => t.id));
      internal = false;
    }

    // Pull von Änderungen anderer
    const rt = await pull("ll_tours", meta.cursor.ll_tours);
    const re = await pull("ll_entries", meta.cursor.ll_entries);
    const live = <T,>(rows: Row[]) =>
      rows.filter((r) => !r.deleted).map((r) => r.data as unknown as T);
    const gone = [...rt, ...re]
      .filter((r) => r.deleted)
      .map((r) => ({ kind: "entry" as const, id: r.id, at: r.updated_at }));
    internal = true;
    useStore.getState().applyRemote(live<Tour>(rt), live<Entry>(re), gone);
    internal = false;

    for (const r of [...rt, ...re]) if (!r.deleted) meta.pushed[r.id] = r.updated_at;
    if (rt.length) meta.cursor.ll_tours = rt[rt.length - 1].updated_at;
    if (re.length) meta.cursor.ll_entries = re[re.length - 1].updated_at;
    localStorage.setItem(META, JSON.stringify(meta));
    setState("ok");
  } catch {
    setState("error");
  } finally {
    running = false;
    if (again) {
      again = false;
      void syncNow();
    }
  }
}

export function startSync() {
  let timer: number | undefined;
  useStore.subscribe(() => {
    if (internal) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void syncNow(), 1500);
  });
  window.addEventListener("online", () => void syncNow());
  window.addEventListener("focus", () => void syncNow());
  window.setInterval(() => {
    if (document.visibilityState === "visible") void syncNow();
  }, 15000);
  void syncNow();
}
