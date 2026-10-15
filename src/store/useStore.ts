import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Entry, Status, Tour, newId } from "@/lib/utils";

export interface NewEntry {
  street: string;
  number: string;
  lat?: number | null;
  lng?: number | null;
}

export interface Tombstone {
  kind: "tour" | "entry";
  id: string;
  tourId?: string;
  at: string;
}

const now = () => new Date().toISOString();

interface State {
  tombstones: Tombstone[];
  applyRemote: (tours: Tour[], entries: Entry[], deleted: Tombstone[]) => void;
  clearTombstones: (ids: string[]) => void;
  tours: Tour[];
  entries: Entry[];
  me: string;
  setMe: (name: string) => void;
  createTour: (city: string) => string;
  deleteTour: (id: string) => void;
  addEntries: (tourId: string, items: NewEntry[]) => number;
  setStatus: (id: string, status: Status) => void;
  setNote: (id: string, note: string) => void;
  removeStreet: (tourId: string, street: string) => void;
  resetTour: (tourId: string) => void;
  importData: (json: string) => void;
  clearAll: () => void;
}

const key = (street: string, number: string) =>
  `${street.trim().toLowerCase()}|${number.trim().toLowerCase()}`;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      tours: [],
      entries: [],
      me: "",
      tombstones: [],

      setMe: (name) => set({ me: name }),

      createTour: (city) => {
        const name = city.trim();
        const me = get().me;
        const existing = get().tours.find(
          (t) =>
            t.city.toLowerCase() === name.toLowerCase() &&
            (!t.owner || t.owner === me)
        );
        if (existing) return existing.id;
        const tour: Tour = {
          id: newId(),
          city: name,
          createdAt: new Date().toISOString(),
          updatedAt: now(),
          owner: me,
        };
        set((s) => ({ tours: [tour, ...s.tours] }));
        return tour.id;
      },

      deleteTour: (id) =>
        set((s) => ({
          tombstones: [...s.tombstones, { kind: "tour", id, at: now() }],
          tours: s.tours.filter((t) => t.id !== id),
          entries: s.entries.filter((e) => e.tourId !== id),
        })),

      addEntries: (tourId, items) => {
        const known = new Set(
          get()
            .entries.filter((e) => e.tourId === tourId)
            .map((e) => key(e.street, e.number))
        );
        const fresh: Entry[] = [];
        for (const item of items) {
          const k = key(item.street, item.number);
          if (!item.number.trim() || known.has(k)) continue;
          known.add(k);
          fresh.push({
            id: newId(),
            tourId,
            street: item.street.trim(),
            number: item.number.trim(),
            lat: item.lat ?? null,
            lng: item.lng ?? null,
            status: "open",
            note: "",
            visitedAt: null,
            updatedAt: now(),
          });
        }
        if (fresh.length) set((s) => ({ entries: [...s.entries, ...fresh] }));
        return fresh.length;
      },

      setStatus: (id, status) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status,
                  visitedAt: status === "open" ? null : new Date().toISOString(),
                  updatedAt: now(),
                }
              : e
          ),
        })),

      setNote: (id, note) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, note, updatedAt: now() } : e)),
        })),

      removeStreet: (tourId, street) =>
        set((s) => ({
          tombstones: [
            ...s.tombstones,
            ...s.entries
              .filter((e) => e.tourId === tourId && e.street === street)
              .map((e) => ({ kind: "entry" as const, id: e.id, tourId, at: now() })),
          ],
          entries: s.entries.filter(
            (e) => !(e.tourId === tourId && e.street === street)
          ),
        })),

      resetTour: (tourId) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.tourId === tourId ? { ...e, status: "open", visitedAt: null, updatedAt: now() } : e
          ),
        })),

      importData: (json) => {
        const data = JSON.parse(json) as { tours?: Tour[]; entries?: Entry[] };
        if (!Array.isArray(data.tours) || !Array.isArray(data.entries)) {
          throw new Error("Ungültige Sicherungsdatei");
        }
        const { tours, entries } = data;
        set((s) => {
          const tourIds = new Set(s.tours.map((t) => t.id));
          const byId = new Map(s.entries.map((e) => [e.id, e]));
          const merged = s.entries.map((e) => {
            const inc = entries.find((x) => x.id === e.id);
            return inc && (inc.visitedAt ?? "") > (e.visitedAt ?? "") ? inc : e;
          });
          return {
            tours: [...s.tours, ...tours.filter((t) => !tourIds.has(t.id))],
            entries: [...merged, ...entries.filter((e) => !byId.has(e.id))],
          };
        });
      },

      applyRemote: (rt, re, deleted) =>
        set((s) => {
          const gone = new Set(deleted.map((d) => d.id));
          const dead = new Set(s.tombstones.map((d) => d.id));
          const ts = (x: { updatedAt?: string }) => x.updatedAt ?? "";
          const mergeList = <T extends { id: string; updatedAt?: string }>(
            local: T[],
            remote: T[]
          ) => {
            const map = new Map(local.map((x) => [x.id, x]));
            for (const r of remote) {
              if (dead.has(r.id)) continue;
              const l = map.get(r.id);
              if (!l || ts(r) > ts(l)) map.set(r.id, r);
            }
            return [...map.values()].filter((x) => !gone.has(x.id));
          };
          const tours = mergeList(s.tours, rt);
          const ids = new Set(tours.map((t) => t.id));
          const entries = mergeList(s.entries, re).filter((e) => ids.has(e.tourId));
          return { tours, entries };
        }),

      clearTombstones: (ids) =>
        set((s) => ({ tombstones: s.tombstones.filter((t) => !ids.includes(t.id)) })),

      clearAll: () => set({ tours: [], entries: [] }),
    }),
    { name: "laufliste-v1" }
  )
);
