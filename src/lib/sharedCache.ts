const BASE = "https://syjwagsgxwfiacbfkoyp.supabase.co/rest/v1/ll_cache";
const KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5andhZ3NneHdmaWFjYmZrb3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5ODk2MDEsImV4cCI6MjEwNzU2NTYwMX0.Xfb_qgUfoUMUYV9DbotVNOKrFxorQ8Y8UOJHjgSVNZ8";

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const quote = (k: string) => `"${k.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/** Gemeinsamer Cache für OSM-Daten. Fehler sind unkritisch, dann wird live abgefragt. */
export async function sharedGet<T>(keys: string[]): Promise<Record<string, T>> {
  const out: Record<string, T> = {};
  for (let i = 0; i < keys.length; i += 25) {
    const part = keys.slice(i, i + 25);
    try {
      const filter = encodeURIComponent(`in.(${part.map(quote).join(",")})`);
      const res = await fetch(`${BASE}?select=key,data&key=${filter}`, {
        headers,
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      for (const row of (await res.json()) as { key: string; data: T }[]) {
        out[row.key] = row.data;
      }
    } catch {
      /* ignorieren */
    }
  }
  return out;
}

export function sharedPut(rows: { key: string; data: unknown }[]) {
  if (!rows.length) return;
  const at = new Date().toISOString();
  void fetch(BASE, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows.map((r) => ({ ...r, updated_at: at }))),
  }).catch(() => undefined);
}
