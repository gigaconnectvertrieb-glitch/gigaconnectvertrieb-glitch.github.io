import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useGebiete } from "@/hooks/useGebiete";
import { useAddresses, useUpdateAddressStatus, useCreateAddresses } from "@/hooks/useAddresses";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import StreetGroup from "@/components/StreetGroup";
import MapView from "@/components/MapView";
import { ArrowLeft, Search, Map, List } from "lucide-react";
import { Address } from "@/hooks/useAddresses";
import { StatusType } from "@/lib/utils";
import { fetchStreetAddresses } from "@/utils/overpass";
import toast from "react-hot-toast";

export default function GebietDetail() {
  useRealtimeSync();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "map">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [streetInput, setStreetInput] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: gebiete = [] } = useGebiete();
  const gebiet = gebiete.find((g) => g.id === id);

  const { data: addresses = [] } = useAddresses(id || null);
  const updateStatus = useUpdateAddressStatus();
  const createAddresses = useCreateAddresses();

  const city = gebiet?.city || "";

  const handleLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !streetInput.trim()) return;
    setLoading(true);
    try {
      const found = await fetchStreetAddresses(streetInput.trim(), city);
      if (found.length === 0) {
        toast.error("Keine Hausnummern gefunden");
        setLoading(false);
        return;
      }
      await createAddresses.mutateAsync(
        found.map((a) => ({
          gebiet_id: id,
          street_name: a.street,
          house_number: a.houseNumber,
          lat: a.lat,
          lng: a.lng,
        }))
      );
      toast.success(`${found.length} Hausnummern geladen`);
      setStreetInput("");
    } catch {
      toast.error("Fehler beim Laden");
    }
    setLoading(false);
  };

  const handleStatusChange = (addressId: string, status: StatusType) => {
    updateStatus.mutate({ id: addressId, status, visitedBy: "Orhan & Uwe" });
  };

  const groupedAddresses = useMemo(() => {
    const filtered = addresses.filter((a) =>
      searchTerm === ""
        ? true
        : a.street_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.house_number.includes(searchTerm)
    );
    const groups: Record<string, Address[]> = {};
    filtered.forEach((addr) => {
      if (!groups[addr.street_name]) groups[addr.street_name] = [];
      groups[addr.street_name].push(addr);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, "de"));
  }, [addresses, searchTerm]);

  const stats = useMemo(() => {
    const total = addresses.length;
    const visited = addresses.filter((a) => a.status !== "unvisited").length;
    const progress = total > 0 ? Math.round((visited / total) * 100) : 0;
    return { total, visited, progress };
  }, [addresses]);

  if (!gebiet) {
    return (
      <div className="flex h-full items-center justify-center">
        <Button onClick={() => navigate("/gebiete")}>Zurück</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/gebiete")} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-sm font-semibold">{gebiet.name}</h1>
            <p className="text-xs text-slate-500">{city}</p>
          </div>
          <div className="flex rounded-md border border-slate-200">
            <button
              onClick={() => setView("list")}
              className={`px-2 py-1 ${view === "list" ? "bg-slate-100" : ""}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("map")}
              className={`px-2 py-1 ${view === "map" ? "bg-slate-100" : ""}`}
            >
              <Map className="h-4 w-4" />
            </button>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="mt-2">
            <div className="text-xs text-slate-600">
              {stats.visited}/{stats.total} ({stats.progress}%)
            </div>
            <div className="mt-1 h-1 w-full bg-slate-100">
              <div
                className="h-1 bg-blue-600"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleLoad} className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Straßenname eingeben (z. B. Memelstraße)"
              value={streetInput}
              onChange={(e) => setStreetInput(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button type="submit" disabled={loading || !streetInput}>
            {loading ? "Lädt..." : "Laden"}
          </Button>
        </form>

        <div className="mt-2">
          <Input
            placeholder="Suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {view === "list" ? (
          groupedAddresses.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Keine Adressen geladen
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {groupedAddresses.map(([street, streetAddresses]) => (
                <StreetGroup
                  key={street}
                  streetName={street}
                  addresses={streetAddresses}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )
        ) : (
          <MapView addresses={addresses} />
        )}
      </div>
    </div>
  );
}