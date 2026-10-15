const FN = "https://syjwagsgxwfiacbfkoyp.supabase.co/functions/v1/realtime-token";
const KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5andhZ3NneHdmaWFjYmZrb3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5ODk2MDEsImV4cCI6MjEwNzU2NTYwMX0.Xfb_qgUfoUMUYV9DbotVNOKrFxorQ8Y8UOJHjgSVNZ8";

export interface AgentLine {
  id: string;
  from: "kunde" | "agent";
  text: string;
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

async function fetchToken(language: string, briefing: string, pin: string): Promise<string> {
  const res = await fetch(FN, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      "x-team-pin": pin,
    },
    body: JSON.stringify({ language, briefing }),
  });
  const data = (await res.json().catch(() => ({}))) as { value?: string; error?: string };
  if (!res.ok || !data.value) {
    if (res.status === 404) throw new Error("Voice-Agent ist noch nicht eingerichtet (Edge Function fehlt).");
    throw new Error(data.error ?? `Fehler ${res.status}`);
  }
  return data.value;
}

export async function startAgent(
  language: string,
  briefing: string,
  pin: string,
  audioEl: HTMLAudioElement,
  h: AgentHandlers
): Promise<AgentSession> {
  h.onState("connecting");
  const token = await fetchToken(language, briefing, pin);

  const pc = new RTCPeerConnection();
  pc.ontrack = (e) => {
    audioEl.srcObject = e.streams[0];
    void audioEl.play().catch(() => undefined);
  };

  const mic = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  mic.getTracks().forEach((t) => pc.addTrack(t, mic));

  const dc = pc.createDataChannel("oai-events");
  const partial = new Map<string, string>();

  dc.onopen = () => {
    h.onState("live");
    // Agent begrüßt den Kunden zuerst
    dc.send(JSON.stringify({ type: "response.create" }));
  };
  dc.onmessage = (ev) => {
    let m: { type?: string; transcript?: string; item_id?: string; response_id?: string; error?: { message?: string } };
    try {
      m = JSON.parse(ev.data as string);
    } catch {
      return;
    }
    switch (m.type) {
      case "conversation.item.input_audio_transcription.completed":
        if (m.transcript?.trim())
          h.onLine({ id: m.item_id ?? crypto.randomUUID(), from: "kunde", text: m.transcript.trim() });
        break;
      case "response.output_audio_transcript.done":
        if (m.transcript?.trim())
          h.onLine({ id: m.item_id ?? crypto.randomUUID(), from: "agent", text: m.transcript.trim() });
        break;
      case "output_audio_buffer.started":
        h.onState("speaking");
        break;
      case "output_audio_buffer.stopped":
      case "output_audio_buffer.cleared":
        h.onState("live");
        break;
      case "error":
        h.onError(m.error?.message ?? "Fehler im Voice-Agent");
        break;
    }
    void partial;
  };

  pc.onconnectionstatechange = () => {
    if (["failed", "disconnected", "closed"].includes(pc.connectionState)) h.onState("ended");
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    body: offer.sdp,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/sdp" },
  });
  if (!sdpRes.ok) {
    mic.getTracks().forEach((t) => t.stop());
    pc.close();
    throw new Error(`Verbindung fehlgeschlagen (${sdpRes.status})`);
  }
  await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });

  return {
    stop: () => {
      mic.getTracks().forEach((t) => t.stop());
      dc.close();
      pc.close();
      h.onState("ended");
    },
    setMuted: (muted) => mic.getAudioTracks().forEach((t) => (t.enabled = !muted)),
  };
}
