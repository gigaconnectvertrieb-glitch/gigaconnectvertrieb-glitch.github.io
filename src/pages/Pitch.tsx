import { useRef, useState } from "react";
import { Mic, Send, Volume2 } from "lucide-react";
import toast from "react-hot-toast";
import { LANGS, PHRASES, listen, recognitionSupported, speak, translate } from "@/lib/pitch";

interface Msg {
  from: "ich" | "kunde";
  de: string;
  foreign: string;
}

export default function Pitch() {
  const [langCode, setLangCode] = useState(localStorage.getItem("pitch-lang") ?? "tr");
  const lang = LANGS.find((l) => l.code === langCode) ?? LANGS[0];
  const [log, setLog] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [rec, setRec] = useState<"" | "ich" | "kunde">("");
  const stopRef = useRef<() => void>(() => undefined);
  const bottom = useRef<HTMLDivElement>(null);

  const push = (m: Msg) => {
    setLog((l) => [...l, m]);
    setTimeout(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const sayGerman = async (de: string) => {
    const t = de.trim();
    if (!t) return;
    setBusy(true);
    try {
      const foreign = await translate(t, "de", lang.code);
      push({ from: "ich", de: t, foreign });
      speak(foreign, lang.speech);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    } finally {
      setBusy(false);
    }
  };

  const customerSaid = async (foreign: string) => {
    setBusy(true);
    try {
      const de = await translate(foreign, lang.code, "de");
      push({ from: "kunde", de, foreign });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    } finally {
      setBusy(false);
    }
  };

  const startMic = (who: "ich" | "kunde") => {
    if (rec) {
      stopRef.current();
      return;
    }
    if (!recognitionSupported()) {
      toast.error("Spracherkennung nicht verfügbar. Nutze Chrome (Android) oder Safari (iPhone).");
      return;
    }
    setRec(who);
    stopRef.current = listen(
      who === "ich" ? "de-DE" : lang.speech,
      (t) => (who === "ich" ? void sayGerman(t) : void customerSaid(t)),
      (err) => {
        setRec("");
        if (err) toast.error(err);
      }
    );
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Pitch-Dolmetscher</h1>
          <p className="text-sm text-slate-500">Du sprichst Deutsch, der Kunde hört seine Sprache.</p>
        </div>
        <select
          value={langCode}
          onChange={(e) => {
            setLangCode(e.target.value);
            localStorage.setItem("pitch-lang", e.target.value);
          }}
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-2xl bg-white p-3 shadow-sm">
        {log.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            Tippe auf einen Baustein, sprich ins Mikrofon oder schreibe unten. Mit „Kunde spricht“ wird die Antwort ins Deutsche übersetzt.
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {log.map((m, i) => (
            <li
              key={i}
              className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                m.from === "ich" ? "self-end bg-blue-100 text-slate-900" : "self-start bg-slate-100 text-slate-900"
              }`}
            >
              <p className="text-sm font-semibold">{m.from === "ich" ? m.foreign : m.de}</p>
              <p className="mt-0.5 text-xs text-slate-500">{m.from === "ich" ? m.de : m.foreign}</p>
              {m.from === "ich" && (
                <button
                  type="button"
                  aria-label="Nochmal vorlesen"
                  onClick={() => speak(m.foreign, lang.speech)}
                  className="mt-1 text-slate-500"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
        <div ref={bottom} />
      </div>

      <details className="mt-3 rounded-2xl bg-white shadow-sm">
        <summary className="cursor-pointer p-3 font-semibold text-slate-900">Pitch-Bausteine</summary>
        <div className="max-h-56 overflow-y-auto px-3 pb-3">
          {PHRASES.map((g) => (
            <div key={g.title} className="mt-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{g.title}</p>
              <div className="mt-1 flex flex-col gap-1">
                {g.items.map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={busy}
                    onClick={() => void sayGerman(p)}
                    className="rounded-xl bg-slate-100 px-3 py-2 text-left text-sm text-slate-800"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>

      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void sayGerman(text);
              setText("");
            }
          }}
          placeholder="Deutsch eintippen…"
          className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-blue-500"
        />
        <button
          type="button"
          aria-label="Senden"
          disabled={busy || !text.trim()}
          onClick={() => {
            void sayGerman(text);
            setText("");
          }}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white disabled:bg-slate-300"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 pb-3">
        <button
          type="button"
          onClick={() => startMic("ich")}
          className={`flex h-14 items-center justify-center gap-2 rounded-2xl font-bold ${
            rec === "ich" ? "bg-red-500 text-white" : "bg-blue-600 text-white"
          }`}
        >
          <Mic className="h-5 w-5" /> {rec === "ich" ? "Hört zu…" : "Ich spreche"}
        </button>
        <button
          type="button"
          onClick={() => startMic("kunde")}
          className={`flex h-14 items-center justify-center gap-2 rounded-2xl font-bold ${
            rec === "kunde" ? "bg-red-500 text-white" : "bg-slate-700 text-white"
          }`}
        >
          <Mic className="h-5 w-5" /> {rec === "kunde" ? "Hört zu…" : "Kunde spricht"}
        </button>
      </div>
    </div>
  );
}
