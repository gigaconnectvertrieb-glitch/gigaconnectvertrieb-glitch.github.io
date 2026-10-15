// Supabase Edge Function: erzeugt kurzlebige Tokens für die OpenAI Realtime API.
// Secrets: OPENAI_API_KEY (Pflicht), TEAM_PIN (optional, schützt vor Fremdnutzung).
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-team-pin",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const pin = Deno.env.get("TEAM_PIN");
  if (pin && req.headers.get("x-team-pin") !== pin) {
    return json({ error: "PIN falsch" }, 401);
  }
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "OPENAI_API_KEY fehlt" }, 500);

  let body: { language?: string; briefing?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* leer */
  }
  const language = String(body.language ?? "Türkisch").slice(0, 40);
  const briefing = String(body.briefing ?? "").slice(0, 1500);

  const instructions = `Du bist ein freundlicher, kompetenter Berater von E1 Direktvertrieb und sprichst an der Haustür mit einem Kunden.
Sprache: Sprich ausschließlich ${language}, außer der Kunde wechselt selbst die Sprache. Dann passe dich an.
Stil: natürlich, warm, ruhig und menschlich wie ein netter Nachbar. Kurze Sätze, maximal zwei Sätze pro Antwort, danach eine Frage oder eine Pause. Keine Aufzählungen, kein Fachjargon, keine Floskeln.
Ablauf: kurz begrüßen und sagen, dass du von E1 Direktvertrieb bist und eine KI-Assistentin, die für den Berater vor Ort übersetzt und erklärt. Frage dann nach dem aktuellen Anbieter und den monatlichen Kosten für Strom, Internet oder Handy. Höre aktiv zu und gehe auf die Antworten ein. Zeige mögliche Ersparnis, ohne Zahlen zu erfinden. Wenn Interesse da ist, bitte den Kunden, den Berater vor Ort einzubeziehen.
Regeln: Erfinde keine Preise, Tarife oder Vertragsbedingungen. Schließe nie selbst einen Vertrag ab und verlange keine Daten außer dem Namen. Bei Einwänden zeige Verständnis, mache keinen Druck und akzeptiere ein Nein freundlich. Wenn du etwas nicht weißt, sag es ehrlich und verweise auf den Berater.
${briefing ? `Zusätzliche Infos vom Berater:\n${briefing}` : ""}`;

  const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 600 },
      session: {
        type: "realtime",
        model: "gpt-realtime",
        instructions,
        audio: {
          input: {
            transcription: { model: "gpt-4o-mini-transcribe" },
            turn_detection: { type: "semantic_vad" },
          },
          output: { voice: "marin" },
        },
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json({ error: data?.error?.message ?? `OpenAI ${res.status}` }, 502);
  return json({ value: data.value });
});
