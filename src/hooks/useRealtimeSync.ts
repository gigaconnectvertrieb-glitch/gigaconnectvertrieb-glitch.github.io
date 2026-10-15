import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useRealtimeSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "addresses",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["addresses"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gebiete",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["gebiete"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};