import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { LANGS, translate } from "@/lib/pitch";
import { startAgent, type AgentLine, type AgentSession } from "@/lib/geminiLive";

interface Line {
  id: string;
  from: "kunde" | "agent";
  text: string;
  de?: string;
}

export default function PitchAgent() {
  const [langCode, setLangCode] = useState(localStorage.getItem("pitch-lang") ?? "tr");
  const lang = LANGS.find((l) => l.code === langCode) ?? LANGS[0];
  const [pin, setPin] = useState(localStorage.getItem("pitch-pin") ?? "");
  const [briefing, setBriefing] = useState(localStorage.getItem("pitch-briefing") ?? "");
  const [state, setState] = useState<"idle" | "connecting" | "live" | "speaking" | "ended">("idle");
  const [muted, setMuted] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const session = useRef<AgentSession | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => () => session.current?.stop(), []);

  const addLine = (l: AgentLine) => {
    setLines((cur) =>
      cur.some((c) => c.id === l.id)
        ? cur.map((c) => (c.id === l.id ? { ...c, text: l.text } : c))
        : [...cur, { id: l.id, from: l.from, text: l.text }]
    );
    setTimeout(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), 50);
    if (!l.final) return;
    translate(l.text, lang.code, "de")
      .then((de) => setLines((cur) => cur.map((c) => (c.id === l.id ? { ...c, de } : c))))
      .catch(() => undefined);
  };

  const start = async () => {
    localStorage.setItem("pitch-pin", pin);
    localStorage.setItem("pitch-briefing", briefing);
    setLines([]);
    setMuted(false);
    try {
      session.current = await startAgent(lang.label, briefing, pin, audio.current as HTMLAudioElement, {
        onLine: addLine,
        onState: setState,
        onError: (m) => toast.error(m),
      });
    } catch (e) {
      setState("idle");
      toast.error(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Mikrofon nicht erlaubt. Bitte in den Browser-Einstellungen freigeben."
          : e instanceof Error
            ? e.message
            : "Fehler"
      );
    }
  };

  const stop = () => {
    session.current?.stop();
    session.current = null;
    setState("idle");
  };

  const active = state === "connecting" || state === "live" || state === "speaking";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <audio ref={audio} autoPlay playsInline />
      {!active && (
        <div className="grid gap-2 sm:grid-cols-2">
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
                Sprache: {l.label}
              </option>
            ))}
          </select>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            type="password"
            placeholder="Team-PIN (falls gesetzt)"
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          />
          <textarea
            value={briefing}
            onChange={(e) => setBriefing(e.target.value)}
            rows={3}
            placeholder="Optional: aktuelle Aktion/Infos für die KI, z. B. Tarife, Vorteile, Fragen die gestellt werden sollen"
            className="rounded-xl border border-slate-300 bg-white p-3 text-sm sm:col-span-2"
          />
        </div>
      )}

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-2xl bg-white p-3 shadow-sm">
        {lines.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            {active
              ? "Verbinde… die KI begrüßt den Kunden gleich."
              : "Starte das Gespräch, übergib das Handy dem Kunden oder halte es zwischen euch. Die KI spricht seine Sprache, du liest mit deutscher Übersetzung mit."}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {lines.map((l) => (
            <li
              key={l.id}
              className={`max-w-[88%] rounded-2xl px-3 py-2 ${
                l.from === "agent" ? "self-start bg-blue-100" : "self-end bg-slate-100"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">{l.text}</p>
              {l.de && <p className="mt-0.5 text-xs text-slate-500">{l.de}</p>}
            </li>
          ))}
        </ul>
        <div ref={bottom} />
      </div>

      <div className="mt-3 pb-3">
        {!active ? (
          <button
            type="button"
            onClick={() => void start()}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-lg font-bold text-white"
          >
            <Phone className="h-5 w-5" /> Gespräch starten
          </button>
        ) : (
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className="flex items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-700 shadow-sm">
              {state === "connecting" ? "Verbinde…" : state === "speaking" ? "KI spricht…" : "Hört zu…"}
            </div>
            <button
              type="button"
              aria-label="Stumm"
              onClick={() => {
                session.current?.setMuted(!muted);
                setMuted(!muted);
              }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700 text-white"
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={stop}
              className="col-span-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-red-500 font-bold text-white"
            >
              <PhoneOff className="h-5 w-5" /> Gespräch beenden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
