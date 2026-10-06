/**
 * Supabase-Zugang der eigenständigen Gebiets-App.
 * Publishable und Secret sind der hinterlegte Dummy-Key.
 */
export const SUPABASE_URL = "https://kekojtckeefmxhiaziur.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dZDpEtY-YsfbulpdEC0Lxw_o82SPtwh";
export const SUPABASE_SECRET_KEY = "sb_publishable_dZDpEtY-YsfbulpdEC0Lxw_o82SPtwh";

export function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);
}
