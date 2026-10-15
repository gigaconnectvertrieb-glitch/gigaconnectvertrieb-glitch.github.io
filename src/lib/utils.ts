import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Status = "open" | "nicht_da" | "kein_interesse" | "abschluss";

export interface Tour {
  id: string;
  city: string;
  createdAt: string;
  owner?: string;
}

export const PEOPLE = ["Orhan", "Luca"];

export interface Entry {
  id: string;
  tourId: string;
  street: string;
  number: string;
  lat: number | null;
  lng: number | null;
  status: Status;
  note: string;
  visitedAt: string | null;
}

export const STATUS_LABELS: Record<Status, string> = {
  open: "Offen",
  nicht_da: "Nicht da",
  kein_interesse: "Kein Interesse",
  abschluss: "Abschluss",
};

export const STATUS_COLORS: Record<Status, string> = {
  open: "#94a3b8",
  nicht_da: "#f97316",
  kein_interesse: "#ef4444",
  abschluss: "#22c55e",
};

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function compareHouseNumbers(a: string, b: string): number {
  const na = parseInt(a.replace(/\D/g, ""), 10) || 0;
  const nb = parseInt(b.replace(/\D/g, ""), 10) || 0;
  if (na !== nb) return na - nb;
  return a.localeCompare(b, "de", { numeric: true });
}

export function isSameDay(iso: string | null, day: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

export function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function navUrl(
  entry: Pick<Entry, "street" | "number" | "lat" | "lng">,
  city: string
) {
  const query =
    entry.lat !== null && entry.lng !== null
      ? `${entry.lat},${entry.lng}`
      : `${entry.street} ${entry.number}, ${city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
