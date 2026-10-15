export interface Lang {
  code: string; // Übersetzung (MyMemory)
  speech: string; // BCP-47 für Spracherkennung/-ausgabe
  label: string;
}

export const LANGS: Lang[] = [
  { code: "tr", speech: "tr-TR", label: "Türkisch" },
  { code: "en", speech: "en-GB", label: "Englisch" },
  { code: "ar", speech: "ar-SA", label: "Arabisch" },
  { code: "ru", speech: "ru-RU", label: "Russisch" },
  { code: "pl", speech: "pl-PL", label: "Polnisch" },
  { code: "ro", speech: "ro-RO", label: "Rumänisch" },
  { code: "bg", speech: "bg-BG", label: "Bulgarisch" },
  { code: "uk", speech: "uk-UA", label: "Ukrainisch" },
  { code: "it", speech: "it-IT", label: "Italienisch" },
  { code: "es", speech: "es-ES", label: "Spanisch" },
  { code: "fr", speech: "fr-FR", label: "Französisch" },
  { code: "pt", speech: "pt-PT", label: "Portugiesisch" },
  { code: "el", speech: "el-GR", label: "Griechisch" },
  { code: "sr", speech: "sr-RS", label: "Serbisch" },
  { code: "hr", speech: "hr-HR", label: "Kroatisch" },
  { code: "sq", speech: "sq-AL", label: "Albanisch" },
  { code: "fa", speech: "fa-IR", label: "Persisch" },
  { code: "zh-CN", speech: "zh-CN", label: "Chinesisch" },
  { code: "hi", speech: "hi-IN", label: "Hindi" },
];

export const PHRASES: { title: string; items: string[] }[] = [
  {
    title: "Einstieg",
    items: [
      "Guten Tag! Entschuldigen Sie die Störung, ich bin von E1 Direktvertrieb.",
      "Haben Sie kurz zwei Minuten Zeit für mich?",
      "Ich möchte Ihnen nichts verkaufen, was Sie nicht brauchen, ich zeige Ihnen nur eine Möglichkeit, Geld zu sparen.",
      "Sprechen Sie Deutsch oder bevorzugen Sie eine andere Sprache?",
    ],
  },
  {
    title: "Bedarf",
    items: [
      "Welchen Anbieter haben Sie aktuell für Strom oder Gas?",
      "Wie viel zahlen Sie im Monat dafür?",
      "Wann wurde Ihr Tarif zuletzt geprüft oder gewechselt?",
      "Wie viele Personen leben in Ihrem Haushalt?",
    ],
  },
  {
    title: "Angebot",
    items: [
      "Ich kann Ihnen ein besseres Angebot machen, das oft günstiger ist als Ihr jetziger Tarif.",
      "Die Umstellung ist einfach, wir kümmern uns um alles, auch um die Kündigung.",
      "Es entstehen Ihnen keine Kosten für den Wechsel.",
      "Darf ich Ihnen die Vorteile kurz zeigen?",
    ],
  },
  {
    title: "Einwände",
    items: [
      "Das verstehe ich gut. Darf ich Ihnen trotzdem in einer Minute zeigen, was Sie sparen können?",
      "Es ist völlig unverbindlich, Sie müssen heute nichts unterschreiben.",
      "Soll ich später noch einmal vorbeikommen, wenn es besser passt?",
      "Gibt es jemanden im Haushalt, der darüber entscheidet?",
    ],
  },
  {
    title: "Abschluss",
    items: [
      "Wenn Sie einverstanden sind, brauche ich nur Ihren Namen und die letzte Rechnung.",
      "Vielen Dank für Ihre Zeit! Einen schönen Tag noch.",
      "Darf ich Ihnen meine Karte dalassen?",
    ],
  },
];

interface MyMemory {
  responseData?: { translatedText?: string };
  responseStatus?: number | string;
}

export async function translate(text: string, from: string, to: string): Promise<string> {
  const t = text.trim();
  if (!t || from === to) return t;
  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(t.slice(0, 480)) +
    `&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Übersetzung fehlgeschlagen (${res.status})`);
  const data = (await res.json()) as MyMemory;
  const out = data.responseData?.translatedText;
  if (!out || Number(data.responseStatus) >= 400) {
    throw new Error("Übersetzung nicht verfügbar");
  }
  return out;
}

export function speak(text: string, lang: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

type RecCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function recognitionSupported(): boolean {
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

/** Einmalige Spracherkennung. Gibt eine Stop-Funktion zurück. */
export function listen(
  lang: string,
  onText: (t: string) => void,
  onEnd: (error?: string) => void
): () => void {
  const w = window as unknown as Record<string, RecCtor | undefined>;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) {
    onEnd("Spracherkennung wird von diesem Browser nicht unterstützt (Chrome/Safari nutzen).");
    return () => undefined;
  }
  const rec = new Ctor();
  rec.lang = lang;
  rec.interimResults = false;
  let err: string | undefined;
  rec.onresult = (e) => onText(e.results[0][0].transcript);
  rec.onerror = (e) => {
    err = e.error === "no-speech" ? "Nichts gehört." : `Mikrofon-Fehler: ${e.error}`;
  };
  rec.onend = () => onEnd(err);
  rec.start();
  return () => rec.stop();
}
