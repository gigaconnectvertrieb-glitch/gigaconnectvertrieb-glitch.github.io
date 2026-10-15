import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_OPTIONS = [
  { value: "unvisited", label: "Unbesucht", color: "bg-gray-400" },
  { value: "nicht_da", label: "Nicht da", color: "bg-orange-500" },
  { value: "kein_interesse", label: "Kein Interesse", color: "bg-red-500" },
  { value: "abschluss", label: "Abschluss", color: "bg-green-500" },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  unvisited: "Unbesucht",
  nicht_da: "Nicht da",
  kein_interesse: "Kein Interesse",
  abschluss: "Abschluss",
};

export const STATUS_COLORS: Record<string, string> = {
  unvisited: "#9ca3af",
  nicht_da: "#f97316",
  kein_interesse: "#ef4444",
  abschluss: "#22c55e",
};

export type StatusType = "unvisited" | "nicht_da" | "kein_interesse" | "abschluss";