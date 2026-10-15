import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Search, RotateCcw } from "lucide-react";
import StreetSection from "@/components/StreetSection";
import AddStreetsSheet from "@/components/AddStreetsSheet";
import { useStore } from "@/store/useStore";
import { Entry, Status, cn, compareHouseNumbers } from "@/lib/utils";

type Filter = "open" | "all" | "done";

export default function Tour() {
  const { id = "" } = useParams<{ id: string }>();
  const tour = useStore((s) => s.tours.find((t) => t.id === id));
  const allEntries = useStore((s) => s.entries);
  const { setStatus, setNote, removeStreet, resetTour } = useStore();

  const [filter, setFilter] = useState<Filter>("open");
  const [search, setSearch] = useState("");
  const [sheet, setSheet] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const entries = useMemo(
    () => allEntries.filter((e) => e.tourId === id),
    [allEntries, id]
  );

  const stats = useMemo(() => {
    const done = entries.filter((e) => e.status !== "open").length;
    return {
      total: entries.length,
      done,
      open: entries.length - done,
      nicht_da: entries.filter((e) => e.status === "nicht_da").length,
      kein_interesse: entries.filter((e) => e.status === "kein_interesse").length,
      abschluss: entries.filter((e) => e.status === "abschluss").length,
    };
  }, [entries]);

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const map = new Map<string, Entry[]>();
    const totals = new Map<string, { total: number; done: number }>();
    for (const e of entries) {
      const t = totals.get(e.street) ?? { total: 0, done: 0 };
      t.total++;
      if (e.status !== "open") t.done++;
      totals.set(e.street, t);

      const matchesSearch =
        !term ||
        e.street.toLowerCase().includes(term) ||
        e.number.toLowerCase().includes(term);
      const matchesFilter =
        filter === "all" ||
        (filter === "open" && (e.status === "open" || touched.has(e.id))) ||
        (filter === "done" && e.status !== "open");
      if (!matchesSearch || !matchesFilter) continue;
      const list = map.get(e.street) ?? [];
      list.push(e);
      map.set(e.street, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "de"))
      .map(([street, list]) => ({
        street,
        entries: list.sort((a, b) => compareHouseNumbers(a.number, b.number)),
        ...(totals.get(street) ?? { total: list.length, done: 0 }),
      }));
  }, [entries, filter, search, touched]);

  const existingStreets = useMemo(
    () => new Set(entries.map((e) => e.street.toLowerCase())),
    [entries]
  );

  if (!tour) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600">Laufliste nicht gefunden.</p>
        <Link to="/" className="mt-3 inline-block font-semibold text-blue-600">
          Zurück
        </Link>
      </div>
    );
  }

  const handleStatus = (entryId: string, status: Status) => {
    setTouched((prev) => new Set(prev).add(entryId));
    setStatus(entryId, status);
  };

  const changeFilter = (f: Filter) => {
    setTouched(new Set());
    setFilter(f);
  };

  const percent = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const tabs: { value: Filter; label: string; count: number }[] = [
    { value: "open", label: "Offen", count: stats.open },
    { value: "done", label: "Erledigt", count: stats.done },
    { value: "all", label: "Alle", count: stats.total },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2">
            <Link to="/" aria-label="Zurück" className="-ml-2 rounded-full p-2 active:bg-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-slate-900">{tour.city}</h1>
              <p className="text-xs text-slate-500">
                {stats.done}/{stats.total} besucht · {percent}%
              </p>
            </div>
            <button
              type="button"
              aria-label="Alle zurücksetzen"
              onClick={() => {
                if (stats.done > 0 && confirm("Alle Status in dieser Liste auf „Offen“ zurücksetzen?")) {
                  resetTour(tour.id);
                  setTouched(new Set());
                }
              }}
              className="rounded-full p-2 text-slate-400 active:bg-slate-100"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-2 flex gap-2 text-xs font-semibold">
            <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-700">Nicht da {stats.nicht_da}</span>
            <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">Kein Int. {stats.kein_interesse}</span>
            <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">Abschluss {stats.abschluss}</span>
          </div>

          {stats.total > 0 && (
            <>
              <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
                {tabs.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => changeFilter(t.value)}
                    className={cn("rounded-lg py-2", filter === t.value ? "bg-white shadow-sm" : "text-slate-500")}
                  >
                    {t.label} ({t.count})
                  </button>
                ))}
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Straße oder Hausnummer filtern…"
                  className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 px-3 pb-28 pt-3">
        {stats.total === 0 ? (
          <div className="mt-10 rounded-3xl bg-white p-6 text-center shadow-sm">
            <h2 className="font-bold text-slate-900">Noch keine Straßen in der Liste</h2>
            <p className="mt-1 text-sm text-slate-500">
              Wähle Straßen aus {tour.city} – die Hausnummern werden automatisch geladen.
            </p>
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="mt-4 h-12 rounded-2xl bg-blue-600 px-6 font-bold text-white active:bg-blue-700"
            >
              Straßen hinzufügen
            </button>
          </div>
        ) : groups.length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            {filter === "open" && !search
              ? "🎉 Alles abgearbeitet!"
              : "Keine Einträge für diese Auswahl."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <StreetSection
                key={g.street}
                street={g.street}
                city={tour.city}
                entries={g.entries}
                total={g.total}
                done={g.done}
                onStatus={handleStatus}
                onNote={setNote}
                onRemove={(street) => removeStreet(tour.id, street)}
              />
            ))}
          </div>
        )}
      </div>

      {stats.total > 0 && (
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-[max(1rem,calc((100vw-48rem)/2+0.75rem))] flex h-14 items-center gap-2 rounded-full bg-blue-600 px-5 font-bold text-white shadow-lg active:bg-blue-700"
        >
          <Plus className="h-5 w-5" /> Straße
        </button>
      )}

      {sheet && (
        <AddStreetsSheet
          tourId={tour.id}
          city={tour.city}
          existingStreets={existingStreets}
          onClose={() => setSheet(false)}
        />
      )}
    </div>
  );
}
