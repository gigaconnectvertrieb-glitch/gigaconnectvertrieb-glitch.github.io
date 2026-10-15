import { KEY } from "@/lib/sync";

const FN = "https://syjwagsgxwfiacbfkoyp.supabase.co/functions/v1/smooth-worker";
const MODEL = "models/gemini-3.8-live";
const VOICE = "Kore";
const WS =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=";

export interface AgentLine {
  id: string;
  from: "kunde" | "agent";
  text: string;
  final?: boolean;
}

export interface AgentHandlers {
  onLine: (l: AgentLine) => void;
  onState: (s: "connecting" | "live" | "speaking" | "ended") => void;
  onError: (msg: string) => void;
}

export interface AgentSession {
  stop: () => void;
  setMuted: (m: boolean) => void;
}

async function fetchToken(pin: string): Promise<string> {
  const res = await fetch(FN, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      "x-team-pin": pin,
    },
    body: "{}",
  });
  const data = (await res.json().catch(() => ({}))) as { value?: string; error?: string };
  if (!res.ok || !data.value) {
    if (res.status === 404) throw new Error("Voice-Agent ist noch nicht eingerichtet (Edge Function fehlt).");
    throw new Error(data.error ?? `Fehler ${res.status}`);
  }
  return data.value;
}

const OPENERS = [
  "ganz kurz und freundlich, mit einer Frage, ob gerade ein guter Moment ist",
  "mit einem kleinen Kompliment zur Straße oder zum Haus, dann der Grund deines Besuchs",
  "direkt und ehrlich: ein Satz, wer du bist, ein Satz, warum du klingelst",
  "locker und neugierig, du fragst zuerst, ob er schon mal seine Energiekosten verglichen hat",
];

const prompt = (language: string, briefing: string) => {
  const hour = new Date().getHours();
  const tageszeit = hour < 11 ? "Guten Morgen" : hour < 17 ? "Guten Tag" : "Guten Abend";
  const opener = OPENERS[Math.floor(Math.random() * OPENERS.length)];
  return `Du bist eine erfahrene, ehrliche Energieberaterin von E1 Direktvertrieb. Du sprichst an der Haustür mit einem Kunden, dein Kollege (der Berater) steht daneben.
Thema: ausschließlich Strom und Gas, Sparpotenzial bei den Energiekosten. Sprich NICHT über Internet, DSL, Handy oder Mobilfunk. Fragt der Kunde danach, sag freundlich, dass du dafür heute nicht zuständig bist.
Sprache: Sprich ausschließlich ${language}, außer der Kunde wechselt selbst die Sprache. Dann passe dich an. Benutze die höfliche Anrede, sei aber nie steif.
Stimme: natürlich, warm, ruhig, mit kleinen Pausen und echten Reaktionen wie "ach so", "verstehe", "gut zu wissen". Kurze Sätze, meist ein bis zwei Sätze, dann eine Frage oder Stille. Keine Aufzählungen, kein Fachjargon, nie wie ein Skript. Wiederhole dich nicht und formuliere jede Antwort neu.
Beginn: Sag ${tageszeit} in der Sprache des Kunden und starte ${opener}. Sag klar, dass du eine KI-Assistentin von E1 Direktvertrieb bist, die hier für den Berater übersetzt und erklärt.
Adaptiv führen: Beobachte Tempo, Stimmung und Wortwahl des Kunden und passe dich an.
- Eilig oder genervt: fasse dich ganz kurz, nenne einen Nutzen, biete an, später wiederzukommen.
- Neugierig: erkläre mehr, stelle Fragen zu Haushaltsgröße, Anbieter, Monatskosten, wann zuletzt verglichen.
- Skeptisch: bleib sachlich, ehrlich, ohne Druck, erkläre, dass ein Vergleich nichts kostet und nichts bindet.
- Unsicher oder sprachlich schwach: sprich einfacher und langsamer, bestätige das Verstandene.
- Hat schon günstigen Tarif: gratuliere, frage kurz nach Vertragsende und Preisgarantie, dränge nicht.
Gesprächslogik: erst zuhören und Bedarf klären, dann den Nutzen auf genau diese Situation beziehen, dann ein kleiner nächster Schritt (Berater einbeziehen, Verbrauch oder Abrechnung ansehen). Immer nur eine Frage auf einmal. Wenn der Kunde klar Nein sagt, bedanke dich freundlich und beende höflich.
Regeln: Erfinde keine Preise, Ersparnisse, Tarife oder Vertragsbedingungen, nenne Zahlen nur, wenn sie im Briefing stehen. Schließe nie selbst einen Vertrag ab, frage nach keinen Bankdaten, Zählernummern oder Ausweisen, höchstens nach dem Vornamen. Wenn du etwas nicht weißt, sag es ehrlich und verweise auf den Berater.
${briefing ? `Aktuelle Infos und Angebote vom Berater, nutze genau diese:\n${briefing}` : ""}`;
};

const toB64 = (buf: ArrayBuffer) => {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
};

export async function startAgent(
  language: string,
  briefing: string,
  pin: string,
  _audioEl: HTMLAudioElement,
  h: AgentHandlers
): Promise<AgentSession> {
  void _audioEl;
  h.onState("connecting");
  const token = await fetchToken(pin);
  const mic = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });

  const ctx = new AudioContext();
  await ctx.resume();
  const ws = new WebSocket(WS + encodeURIComponent(token));
  let ended = false;
  let muted = false;
  let playAt = 0;
  const sources = new Set<AudioBufferSourceNode>();
  let inBuf = "";
  let outBuf = "";

  let inId = crypto.randomUUID();
  let outId = crypto.randomUUID();

  const flushIn = () => {
    if (inBuf.trim()) h.onLine({ id: inId, from: "kunde", text: inBuf.trim(), final: true });
    inBuf = "";
    inId = crypto.randomUUID();
  };
  const flushOut = () => {
    if (outBuf.trim()) h.onLine({ id: outId, from: "agent", text: outBuf.trim(), final: true });
    outBuf = "";
    outId = crypto.randomUUID();
  };
  const flush = () => {
    flushIn();
    flushOut();
  };

  const stopPlayback = () => {
    sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* schon beendet */
      }
    });
    sources.clear();
    playAt = 0;
  };

  const play = (b64: string) => {
    const bin = atob(b64);
    const n = bin.length >> 1;
    const buf = ctx.createBuffer(1, n, 24000);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) {
      let v = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
      if (v >= 0x8000) v -= 0x10000;
      ch[i] = v / 0x8000;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    playAt = Math.max(playAt, ctx.currentTime + 0.05);
    src.start(playAt);
    playAt += buf.duration;
    sources.add(src);
    src.onended = () => sources.delete(src);
  };

  const micNode = ctx.createMediaStreamSource(mic);
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  micNode.connect(proc);
  proc.connect(mute);
  mute.connect(ctx.destination);
  proc.onaudioprocess = (e) => {
    if (ws.readyState !== WebSocket.OPEN || muted) return;
    const input = e.inputBuffer.getChannelData(0);
    const ratio = ctx.sampleRate / 16000;
    const len = Math.floor(input.length / ratio);
    const out = new Int16Array(len);
    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    ws.send(JSON.stringify({ realtimeInput: { audio: { data: toB64(out.buffer), mimeType: "audio/pcm;rate=16000" } } }));
  };

  const cleanup = () => {
    if (ended) return;
    ended = true;
    stopPlayback();
    proc.disconnect();
    micNode.disconnect();
    mic.getTracks().forEach((t) => t.stop());
    void ctx.close();
    h.onState("ended");
  };

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        setup: {
          model: MODEL,
          generationConfig: {
            responseModalities: ["AUDIO"],
            temperature: 1,
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
          },
          systemInstruction: { parts: [{ text: prompt(language, briefing) }] },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      })
    );
  };

  ws.onmessage = async (ev) => {
    let m: {
      setupComplete?: unknown;
      serverContent?: {
        modelTurn?: { parts?: { inlineData?: { data: string } }[] };
        inputTranscription?: { text?: string };
        outputTranscription?: { text?: string };
        turnComplete?: boolean;
        generationComplete?: boolean;
        interrupted?: boolean;
      };
    };
    try {
      m = JSON.parse(typeof ev.data === "string" ? ev.data : await (ev.data as Blob).text());
    } catch {
      return;
    }
    if (m.setupComplete) {
      h.onState("live");
      ws.send(JSON.stringify({ realtimeInput: { text: "Beginne jetzt das Gespräch." } }));
      return;
    }
    const sc = m.serverContent;
    if (!sc) return;
    if (sc.inputTranscription?.text) {
      flushOut();
      inBuf += sc.inputTranscription.text;
      h.onLine({ id: inId, from: "kunde", text: inBuf.trim() });
    }
    if (sc.outputTranscription?.text) {
      flushIn();
      outBuf += sc.outputTranscription.text;
      h.onLine({ id: outId, from: "agent", text: outBuf.trim() });
    }
    if (sc.generationComplete) flushOut();
    sc.modelTurn?.parts?.forEach((p) => {
      if (p.inlineData?.data) {
        h.onState("speaking");
        play(p.inlineData.data);
      }
    });
    if (sc.interrupted) {
      stopPlayback();
      flush();
      h.onState("live");
    }
    if (sc.turnComplete) {
      flush();
      const wait = Math.max(0, (playAt - ctx.currentTime) * 1000);
      setTimeout(() => !ended && h.onState("live"), wait);
    }
  };

  ws.onerror = () => h.onError("Verbindung zur KI fehlgeschlagen.");
  ws.onclose = (e) => {
    if (!ended && e.code !== 1000 && e.reason) h.onError(e.reason.slice(0, 160));
    cleanup();
  };

  return {
    stop: () => {
      ws.close(1000);
      cleanup();
    },
    setMuted: (v) => {
      muted = v;
    },
  };
}
