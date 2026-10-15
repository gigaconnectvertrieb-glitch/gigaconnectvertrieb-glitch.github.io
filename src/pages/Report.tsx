import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { useStore } from "@/store/useStore";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  csvCell,
  downloadFile,
  isSameDay,
} from "@/lib/utils";

export default function Report() {
  const { tours, entries } = useStore();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const day = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }, [date]);

  const dayEntries = useMemo(
    () =>
      entries
        .filter((e) => isSameDay(e.visitedAt, day))
        .sort((a, b) => (b.visitedAt ?? "").localeCompare(a.visitedAt ?? "")),
    [entries, day]
  );

  const count = (s: string) => dayEntries.filter((e) => e.status === s).length;
  const deals = count("abschluss");
  const rate = dayEntries.length ? Math.round((deals / dayEntries.length) * 100) : 0;
  const cityOf = (tourId: string) => tours.find((t) => t.id === tourId)?.city ?? "";

  const exportCsv = () => {
    const rows = [
      ["Datum", "Uhrzeit", "Stadt", "Straße", "Hausnummer", "Status", "Notiz"],
      ...dayEntries.map((e) => [
        format(new Date(e.visitedAt as string), "dd.MM.yyyy"),
        format(new Date(e.visitedAt as string), "HH:mm"),
        cityOf(e.tourId),
        e.street,
        e.number,
        STATUS_LABELS[e.status],
        e.note,
      ]),
    ];
    const csv = "\uFEFF" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
    downloadFile(`laufliste_${date}.csv`, csv, "text/csv;charset=utf-8");
  };

  const cards = [
    { label: "Besucht", value: dayEntries.length, color: "text-slate-900" },
    { label: "Abschlüsse", value: deals, color: "text-green-600" },
    { label: "Kein Interesse", value: count("kein_interesse"), color: "text-red-600" },
    { label: "Nicht da", value: count("nicht_da"), color: "text-orange-600" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tagesbericht</h1>
          <p className="text-sm text-slate-500">Abschlussquote {rate}%</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className={`text-3xl font-extrabold ${c.color}`}>{c.value}</div>
            <div className="text-xs font-semibold text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={dayEntries.length === 0}
        onClick={exportCsv}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 font-semibold text-white disabled:bg-slate-300"
      >
        <Download className="h-4 w-4" /> Als CSV exportieren
      </button>

      <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">
        Besuche
      </h2>
      {dayEntries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          An diesem Tag wurden keine Türen bearbeitet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dayEntries.map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[e.status] }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {e.street} {e.number}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {cityOf(e.tourId)} · {STATUS_LABELS[e.status]}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {format(new Date(e.visitedAt as string), "HH:mm")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
