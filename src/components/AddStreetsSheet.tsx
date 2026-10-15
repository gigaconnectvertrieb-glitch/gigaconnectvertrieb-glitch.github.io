import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Loader2, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { fetchCityStreets, fetchHouseNumbers, searchStreets } from "@/utils/osm";

interface Props {
  tourId: string;
  city: string;
  existingStreets: Set<string>;
  onClose: () => void;
}

type ManualMode = "all" | "even" | "odd";

export default function AddStreetsSheet({ tourId, city, existingStreets, onClose }: Props) {
  const addEntries = useStore((s) => s.addEntries);

  const [streets, setStreets] = useState<string[]>([]);
  const [loadingStreets, setLoadingStreets] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [filter, setFilter] = useState("");
  const [extra, setExtra] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [missing, setMissing] = useState<string[]>([]);

  const [manualStreet, setManualStreet] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState<ManualMode>("all");

  useEffect(() => {
    let cancelled = false;
    setLoadingStreets(true);
    setLoadError("");
    fetchCityStreets(city)
      .then((list) => {
        if (!cancelled) setStreets(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Straßen konnten nicht geladen werden");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingStreets(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city, reloadKey]);

  const term = filter.trim().toLowerCase();
  const visible = useMemo(
    () => (term ? streets.filter((s) => s.toLowerCase().includes(term)) : streets),
    [streets, term]
  );

  // Fallback über Nominatim, wenn die Stadtliste nichts Passendes enthält
  useEffect(() => {
    setExtra([]);
    if (term.length < 3 || visible.length > 0) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchStreets(city, filter)
        .then((r) => {
          if (!cancelled) setExtra(r);
        })
        .catch(() => undefined);
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term, visible.length, city, filter]);

  const list = visible.length > 0 ? visible : extra;

  const toggle = (street: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(street)) next.delete(street);
      else next.add(street);
      return next;
    });

  const loadSelected = async () => {
    const names = [...selected];
    if (names.length === 0 || busy) return;
    setBusy(true);
    setMissing([]);
    setProgress(`0/${names.length} Straßen`);
    try {
      const found = await fetchHouseNumbers(city, names, (d, t) =>
        setProgress(`${d}/${t} Straßen`)
      );
      const added = addEntries(
        tourId,
        found.map((f) => ({ street: f.street, number: f.number, lat: f.lat, lng: f.lng }))
      );
      const foundStreets = new Set(found.map((f) => f.street.toLowerCase()));
      const none = names.filter((n) => !foundStreets.has(n.toLowerCase()));
      setSelected(new Set());
      if (none.length > 0) {
        setMissing(none);
        setManualStreet(none[0]);
        toast(`${added} Hausnummern hinzugefügt – für ${none.length} Straße(n) fehlen Daten`, { icon: "⚠️" });
      } else {
        toast.success(`${added} Hausnummern zur Liste hinzugefügt`);
        onClose();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Laden fehlgeschlagen");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const addManual = () => {
    const street = manualStreet.trim();
    const a = parseInt(from, 10);
    const b = parseInt(to, 10);
    if (!street) return toast.error("Bitte Straße angeben");
    if (Number.isNaN(a) || Number.isNaN(b) || b < a) {
      return toast.error("Bitte gültigen Hausnummern-Bereich angeben");
    }
    if (b - a > 500) return toast.error("Bereich zu groß (max. 500)");
    const items = [];
    for (let n = a; n <= b; n++) {
      if (mode === "even" && n % 2 !== 0) continue;
      if (mode === "odd" && n % 2 === 0) continue;
      items.push({ street, number: String(n) });
    }
    const added = addEntries(tourId, items);
    toast.success(`${added} Hausnummern hinzugefügt`);
    setMissing((m) => m.filter((x) => x !== street));
    setFrom("");
    setTo("");
    setManualStreet("");
  };

  return (
    <div className="fixed left-0 top-0 z-40 flex h-[100dvh] w-full flex-col bg-white md:left-1/2 md:max-w-3xl md:-translate-x-1/2 md:border-x md:border-slate-200">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-slate-900">Straßen hinzufügen</h2>
          <p className="truncate text-xs text-slate-500">{city}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Schließen" className="rounded-full p-2 active:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Straße suchen…"
            className="h-12 w-full rounded-xl border border-slate-300 pl-10 pr-3 outline-none focus:border-blue-500"
          />
        </div>

        {missing.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" /> Keine Hausnummern in OSM gefunden
            </div>
            <p className="mt-1">
              {missing.join(", ")} – ergänze den Nummernbereich manuell (unten).
            </p>
          </div>
        )}

        <div className="mt-3">
          {loadingStreets ? (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Straßen von {city} werden abgefragt…
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p>{loadError}</p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="mt-2 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white"
              >
                Erneut versuchen
              </button>
            </div>
          ) : streets.length === 0 && !term ? (
            <p className="py-4 text-sm text-slate-500">
              Keine Straßenliste für „{city}“ gefunden. Suche oben nach einer Straße oder nutze die manuelle Eingabe.
            </p>
          ) : null}

          {!loadingStreets && list.length > 0 && (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {list.map((street) => {
                const have = existingStreets.has(street.toLowerCase());
                const checked = selected.has(street);
                return (
                  <li key={street}>
                    <button
                      type="button"
                      onClick={() => toggle(street)}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-slate-50"
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                          checked ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"
                        )}
                      >
                        {checked && <Check className="h-4 w-4" />}
                      </span>
                      <span className="flex-1 truncate">{street}</span>
                      {have && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          in Liste
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!loadingStreets && term && list.length === 0 && (
            <p className="py-4 text-sm text-slate-500">Keine Straße gefunden.</p>
          )}
        </div>

        <details className="mt-4 rounded-xl border border-slate-200 p-3" open={missing.length > 0}>
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Manuell hinzufügen (Nummernbereich)
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <input
              value={manualStreet}
              onChange={(e) => setManualStreet(e.target.value)}
              placeholder="Straße"
              className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                inputMode="numeric"
                placeholder="von"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500"
              />
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                inputMode="numeric"
                placeholder="bis"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-semibold">
              {(["all", "even", "odd"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn("rounded-md py-2", mode === m ? "bg-white shadow-sm" : "text-slate-500")}
                >
                  {m === "all" ? "Alle" : m === "even" ? "Gerade" : "Ungerade"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={addManual}
              className="h-11 rounded-lg bg-slate-800 font-semibold text-white active:bg-slate-900"
            >
              Bereich hinzufügen
            </button>
          </div>
        </details>
      </div>

      <div className="border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={selected.size === 0 || busy}
          onClick={loadSelected}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-bold text-white disabled:bg-slate-300"
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Hausnummern laden… {progress}
            </>
          ) : selected.size === 0 ? (
            "Straßen auswählen"
          ) : (
            `${selected.size} Straße${selected.size === 1 ? "" : "n"} → Liste`
          )}
        </button>
      </div>
    </div>
  );
}
