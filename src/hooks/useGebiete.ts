import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export interface Gebiet {
  id: string;
  name: string;
  city: string;
  street: string | null;
  created_at: string;
}

export const useGebiete = () => {
  return useQuery({
    queryKey: ["gebiete"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gebiete")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Gebiet[];
    },
  });
};

export const useCreateGebiet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gebiet: Omit<Gebiet, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("gebiete")
        .insert(gebiet)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gebiete"] });
      toast.success("Gebiet erstellt");
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
};

export const useDeleteGebiet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("gebiete")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gebiete"] });
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Gebiet gelöscht");
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
};