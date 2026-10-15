import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { StatusType } from "@/lib/utils";
import { toast } from "react-hot-toast";

export interface Address {
  id: string;
  gebiet_id: string;
  street_name: string;
  house_number: string;
  lat: number | null;
  lng: number | null;
  status: StatusType;
  visited_by: string | null;
  visited_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useAddresses = (gebietId: string | null) => {
  return useQuery({
    queryKey: ["addresses", gebietId],
    queryFn: async () => {
      if (!gebietId) return [];

      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("gebiet_id", gebietId)
        .order("street_name", { ascending: true })
        .order("house_number", { ascending: true });

      if (error) throw error;
      return data as Address[];
    },
    enabled: !!gebietId,
  });
};

export const useUpdateAddressStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      visitedBy,
    }: {
      id: string;
      status: StatusType;
      visitedBy?: string;
    }) => {
      const { data, error } = await supabase
        .from("addresses")
        .update({
          status,
          visited_by: visitedBy || "Orhan & Uwe",
          visited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
};

export const useCreateAddresses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addresses: Omit<Address, "id" | "created_at" | "updated_at" | "status" | "visited_by" | "visited_at" | "notes">[]) => {
      const { data, error } = await supabase
        .from("addresses")
        .insert(
          addresses.map((addr) => ({
            ...addr,
            status: "unvisited" as StatusType,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Adressen hinzugefügt");
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
};