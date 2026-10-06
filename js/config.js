/**
 * Supabase-Zugang der eigenständigen Gebiets-App.
 * Publishable und Secret sind der hinterlegte Dummy-Key.
 * Google-3D braucht einen Maps-JavaScript-Key mit Map Tiles API.
 */
export const SUPABASE_URL = "https://kekojtckeefmxhiaziur.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dZDpEtY-YsfbulpdEC0Lxw_o82SPtwh";
export const SUPABASE_SECRET_KEY = "sb_publishable_dZDpEtY-YsfbulpdEC0Lxw_o82SPtwh";
export const GOOGLE_MAPS_API_KEY = "AIzaSyBIlujIrecGRQUpllxMNgcpnaXNyvD4TDU";

export function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);
}
