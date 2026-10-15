import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Trash2 } from "lucide-react";
import CityAutocomplete from "@/components/CityAutocomplete";
import { useStore } from "@/store/useStore";
import { PEOPLE } from "@/lib/utils";

export default function Home() {
  const navigate = useNavigate();
  const { tours: allTours, entries, createTour, deleteTour, me, setMe } = useStore();
  const tours = allTours.filter((t) => !t.owner || t.owner === me);
  const [city, setCity] = useState("");

  const start = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = createTour(trimmed);
    navigate(`/liste/${id}`);
  };

  if (!me) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-[max(3rem,env(safe-area-inset-top))]">
        <img src="/emblem.png" alt="E1" className="h-14 w-auto" />
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Wer bist du?</h1>
        <p className="mt-1 text-sm text-slate-500">
          Jeder sieht nur seine eigenen Lauflisten. Der Bericht zählt alle zusammen.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {PEOPLE.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setMe(p)}
              className="h-14 rounded-2xl bg-blue-600 text-lg font-bold text-white active:bg-blue-700"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3">
        <img src="/emblem.png" alt="E1" className="h-12 w-auto" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">E1 Direktvertrieb®</p>
          <h1 className="text-2xl font-extrabold text-slate-900">Laufliste</h1>
          <p className="text-sm text-slate-500">
            Angemeldet als <b className="text-slate-900">{me}</b> ·{" "}
            <button type="button" onClick={() => setMe("")} className="text-blue-600 underline">
              wechseln
            </button>
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold text-slate-900">Wo arbeitet ihr heute?</h2>
        <CityAutocomplete value={city} onChange={setCity} onSubmit={start} />
        <button
          type="button"
          disabled={!city.trim()}
          onClick={() => start(city)}
          className="mt-3 h-14 w-full rounded-2xl bg-blue-600 text-base font-bold text-white active:bg-blue-700 disabled:bg-slate-300"
        >
          Laufliste starten
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Danach werden die Straßen der Stadt abgefragt und die Hausnummern der gewählten Straßen in die Liste übernommen.
        </p>
      </div>

      <h2 className="mb-2 mt-8 text-sm font-bold uppercase tracking-wide text-slate-500">
        Eure Lauflisten
      </h2>
      {tours.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Noch keine Laufliste. Gib oben eine Stadt ein.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tours.map((tour) => {
            const mine = entries.filter((e) => e.tourId === tour.id);
            const done = mine.filter((e) => e.status !== "open").length;
            const deals = mine.filter((e) => e.status === "abschluss").length;
            const percent = mine.length ? Math.round((done / mine.length) * 100) : 0;
            return (
              <li key={tour.id} className="flex items-stretch overflow-hidden rounded-2xl bg-white shadow-sm">
                <Link to={`/liste/${tour.id}`} className="min-w-0 flex-1 p-4 active:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-bold text-slate-900">{tour.city}</h3>
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {mine.length === 0
                      ? "Noch keine Straßen"
                      : `${done}/${mine.length} besucht · ${deals} Abschlüsse`}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${percent}%` }} />
                  </div>
                </Link>
                <button
                  type="button"
                  aria-label="Laufliste löschen"
                  onClick={() => {
                    if (confirm(`Laufliste „${tour.city}“ mit allen Einträgen löschen?`)) {
                      deleteTour(tour.id);
                    }
                  }}
                  className="px-4 text-slate-300 active:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
