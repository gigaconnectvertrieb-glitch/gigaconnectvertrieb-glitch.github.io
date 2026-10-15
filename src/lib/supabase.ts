import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials missing");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Database = {
  public: {
    Tables: {
      gebiete: {
        Row: {
          id: string;
          name: string;
          city: string;
          street: string | null;
          bounds: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city: string;
          street?: string | null;
          bounds?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string;
          street?: string | null;
          bounds?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          gebiet_id: string;
          street_name: string;
          house_number: string;
          lat: number | null;
          lng: number | null;
          status: "unvisited" | "nicht_da" | "kein_interesse" | "abschluss";
          visited_by: string | null;
          visited_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gebiet_id: string;
          street_name: string;
          house_number: string;
          lat?: number | null;
          lng?: number | null;
          status?: "unvisited" | "nicht_da" | "kein_interesse" | "abschluss";
          visited_by?: string | null;
          visited_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gebiet_id?: string;
          street_name?: string;
          house_number?: string;
          lat?: number | null;
          lng?: number | null;
          status?: "unvisited" | "nicht_da" | "kein_interesse" | "abschluss";
          visited_by?: string | null;
          visited_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};