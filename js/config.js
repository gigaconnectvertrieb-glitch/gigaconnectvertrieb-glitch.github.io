/**
 * Supabase-Zugang für den Gebietsmanager.
 * Publishable Key darf im Frontend liegen.
 * Secret Key (sb_secret_…) gehört nicht in dieses öffentliche Repo.
 */
export const SUPABASE_URL = "";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dZDpEtY-YsfbulpdEC0Lxw_o82SPtwh";

export function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}
