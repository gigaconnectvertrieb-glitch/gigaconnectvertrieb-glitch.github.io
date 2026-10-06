/**
 * Supabase-Zugang für den Gebietsmanager.
 * Keys sind Dummy, bis die echten gesetzt sind.
 * Echten Secret Key (sb_secret_…) nicht in dieses öffentliche Repo legen.
 */
export const SUPABASE_URL = "https://kekojtckeefmxhiaziur.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dZDpEtY-YsfbulpdEC0Lxw_o82SPtwh";
export const SUPABASE_SECRET_KEY = "sb_publishable_dZDpEtY-YsfbulpdEC0Lxw_o82SPtwh";

export function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}
