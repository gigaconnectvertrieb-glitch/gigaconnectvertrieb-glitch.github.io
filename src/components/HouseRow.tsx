import { useState } from "react";
import { Check, DoorClosed, Ban, Handshake, Navigation, StickyNote } from "lucide-react";
import { Entry, Status, cn, navUrl } from "@/lib/utils";

const OPTIONS: { value: Exclude<Status, "open">; label: string; icon: typeof Ban; active: string }[] = [
  { value: "nicht_da", label: "Nicht da", icon: DoorClosed, active: "border-orange-500 bg-orange-500 text-white" },
  { value: "kein_interesse", label: "Kein Int.", icon: Ban, active: "border-red-500 bg-red-500 text-white" },
  { value: "abschluss", label: "Abschluss", icon: Handshake, active: "border-green-600 bg-green-600 text-white" },
];

interface Props {
  entry: Entry;
  city: string;
  onStatus: (id: string, status: Status) => void;
  onNote: (id: string, note: string) => void;
}

export default function HouseRow({ entry, city, onStatus, onNote }: Props) {
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-3",
        entry.status === "open" && "border-slate-200",
        entry.status === "nicht_da" && "border-orange-200 bg-orange-50",
        entry.status === "kein_interesse" && "border-red-200 bg-red-50",
        entry.status === "abschluss" && "border-green-200 bg-green-50"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="w-16 shrink-0 text-2xl font-bold text-slate-900">
          {entry.number}
        </div>
        <div className="grid flex-1 grid-cols-3 gap-1.5">
          {OPTIONS.map(({ value, label, icon: Icon, active }) => {
            const isActive = entry.status === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onStatus(entry.id, isActive ? "open" : value)}
                className={cn(
                  "flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-white text-[10px] font-semibold text-slate-600 active:scale-95",
                  isActive && active
                )}
              >
                {isActive ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            aria-label="Notiz"
            onClick={() => setNoteOpen((v) => !v)}
            className={cn(
              "flex h-[22px] w-9 items-center justify-center rounded-lg text-slate-400 active:bg-slate-100",
              (noteOpen || entry.note) && "text-blue-600"
            )}
          >
            <StickyNote className="h-4 w-4" />
          </button>
          <a
            aria-label="Navigation"
            href={navUrl(entry, city)}
            target="_blank"
            rel="noreferrer"
            className="flex h-[22px] w-9 items-center justify-center rounded-lg text-slate-400 active:bg-slate-100"
          >
            <Navigation className="h-4 w-4" />
          </a>
        </div>
      </div>
      {(noteOpen || entry.note) && (
        <input
          value={entry.note}
          onChange={(e) => onNote(entry.id, e.target.value)}
          placeholder="Notiz (z. B. Name, Rückruf, Zeit)"
          className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
        />
      )}
    </div>
  );
}
