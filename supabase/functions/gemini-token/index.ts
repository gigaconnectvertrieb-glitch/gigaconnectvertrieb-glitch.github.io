// Supabase Edge Function: erzeugt kurzlebige Tokens für die Gemini Live API.
// Secrets: GEMINI_API_KEY (Pflicht, kostenloser Key aus Google AI Studio), TEAM_PIN (optional).
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
  if (pin && req.headers.get("x-team-pin") !== pin) return json({ error: "PIN falsch" }, 401);
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "GEMINI_API_KEY fehlt" }, 500);

  const now = Date.now();
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      uses: 1,
      expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
      newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.name) return json({ error: data?.error?.message ?? `Gemini ${res.status}` }, 502);
  return json({ value: data.name });
});
