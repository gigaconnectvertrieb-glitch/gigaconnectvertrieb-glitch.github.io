import { useEffect, useRef, useState } from "react";
import { Download, Upload, Trash2, Wifi, WifiOff } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useStore } from "@/store/useStore";
import { downloadFile } from "@/lib/utils";

export default function More() {
  const { tours, entries, importData, clearAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const exportBackup = () => {
    downloadFile(
      `laufliste-backup-${format(new Date(), "yyyy-MM-dd")}.json`,
      JSON.stringify({ tours, entries }, null, 2),
      "application/json"
    );
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      importData(await file.text());
      toast.success("Sicherung importiert");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import fehlgeschlagen");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <h1 className="text-2xl font-extrabold text-slate-900">Mehr</h1>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        {online ? (
          <Wifi className="h-5 w-5 text-green-600" />
        ) : (
          <WifiOff className="h-5 w-5 text-orange-500" />
        )}
        <div>
          <p className="font-semibold text-slate-900">{online ? "Online" : "Offline"}</p>
          <p className="text-xs text-slate-500">
            Alle Listen liegen lokal auf diesem Gerät und funktionieren auch ohne Netz. Nur das Laden neuer Straßen braucht Internet.
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold text-slate-900">Sicherung</h2>
        <p className="mt-1 text-xs text-slate-500">
          {tours.length} Lauflisten · {entries.length} Hausnummern. Zum Zusammenführen: Export auf dem einen Gerät, Import auf dem anderen. Danach zählt der Bericht beide Personen.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={exportBackup}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-800 font-semibold text-white"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 font-semibold text-slate-800"
          >
            <Upload className="h-4 w-4" /> Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => onImport(e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold text-slate-900">Als App installieren</h2>
        <p className="mt-1 text-xs text-slate-500">
          Android: Browser-Menü → „Zum Startbildschirm“. iOS: Teilen → „Zum Home-Bildschirm“.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          if (confirm("Wirklich ALLE Lauflisten und Einträge auf diesem Gerät löschen?")) {
            clearAll();
            toast.success("Alle Daten gelöscht");
          }
        }}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 font-semibold text-red-600"
      >
        <Trash2 className="h-4 w-4" /> Alle Daten löschen
      </button>
      <p className="mt-4 text-center text-xs text-slate-400">
        Kartendaten © OpenStreetMap-Mitwirkende
      </p>
    </div>
  );
}
