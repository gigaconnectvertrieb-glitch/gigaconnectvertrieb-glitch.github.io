import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { CitySuggestion, searchCities } from "@/utils/osm";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (city: string) => void;
}

export default function CityAutocomplete({ value, onChange, onSubmit }: Props) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const result = await searchCities(term);
        if (!cancelled) setSuggestions(result);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            e.preventDefault();
            onSubmit(value.trim());
          }
        }}
        placeholder="Stadt eingeben, z. B. Groß-Zimmern"
        autoComplete="off"
        className="h-14 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-10 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
      {loading && (
        <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-400" />
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-lg">
          {suggestions.map((s) => (
            <li key={`${s.name}|${s.hint}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false);
                  onSubmit(s.name);
                }}
                className="flex w-full flex-col px-4 py-3 text-left active:bg-slate-100"
              >
                <span className="font-semibold text-slate-900">{s.name}</span>
                {s.hint && <span className="text-xs text-slate-500">{s.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
