import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import HouseRow from "@/components/HouseRow";
import { Entry, Status, cn } from "@/lib/utils";

interface Props {
  street: string;
  city: string;
  entries: Entry[];
  total: number;
  done: number;
  onStatus: (id: string, status: Status) => void;
  onNote: (id: string, note: string) => void;
  onRemove: (street: string) => void;
}

export default function StreetSection({
  street,
  city,
  entries,
  total,
  done,
  onStatus,
  onNote,
  onRemove,
}: Props) {
  const [open, setOpen] = useState(true);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
        >
          <ChevronDown
            className={cn("h-5 w-5 shrink-0 text-slate-400 transition-transform", !open && "-rotate-90")}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="truncate font-bold text-slate-900">{street}</h2>
              <span className="shrink-0 text-sm font-semibold text-slate-500">
                {done}/{total}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn("h-full rounded-full", percent === 100 ? "bg-green-500" : "bg-blue-500")}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </button>
        <button
          type="button"
          aria-label="Straße entfernen"
          onClick={() => {
            if (confirm(`„${street}“ mit allen Hausnummern aus der Liste entfernen?`)) {
              onRemove(street);
            }
          }}
          className="px-4 py-3 text-slate-300 active:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-2 border-t border-slate-200 bg-white p-2">
          {entries.map((entry) => (
            <HouseRow
              key={entry.id}
              entry={entry}
              city={city}
              onStatus={onStatus}
              onNote={onNote}
            />
          ))}
        </div>
      )}
    </section>
  );
}
