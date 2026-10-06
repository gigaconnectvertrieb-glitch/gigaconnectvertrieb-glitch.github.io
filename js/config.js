/**
 * Supabase-Zugang für den Gebietsmanager.
 * Beide Werte sind Dummy-Keys, bis die echte Projekt-URL steht.
 * Echten Secret Key (sb_secret_…) nicht in dieses öffentliche Repo legen.
 */
export const SUPABASE_URL = "";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dZDpEtY-YsfbulpdEC0Lxw_o82SPtwh";
export const SUPABASE_SECRET_KEY = "sb_publishable_dZDpEtY-YsfbulpdEC0Lxw_o82SPtwh";

export function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}
