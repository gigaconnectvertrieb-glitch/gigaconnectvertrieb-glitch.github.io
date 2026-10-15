import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useGebiete } from "@/hooks/useGebiete";
import { useAddresses, useUpdateAddressStatus, useCreateAddresses } from "@/hooks/useAddresses";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import StreetGroup from "@/components/StreetGroup";
import MapView from "@/components/MapView";
import { ArrowLeft, Search, Map, List, Loader2, X } from "lucide-react";
import { Address } from "@/hooks/useAddresses";
import { StatusType } from "@/lib/utils";
import { searchStreets, fetchStreetAddresses } from "@/utils/overpass";
import toast from "react-hot-toast";

export default function GebietDetail() {
  useRealtimeSync();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "map">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [streetSearch, setStreetSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ street: string; city: string }>>([]);
  const [loadingStreet, setLoadingStreet] = useState<string | null>(null);

  const { data: gebiete = [] } = useGebiete();
  const gebiet = gebiete.find((g) => g.id === id);

  const { data: addresses = [] } = useAddresses(id || null);
  const updateStatus = useUpdateAddressStatus();
  const createAddresses = useCreateAddresses();

  const city = gebiet?.city || "";

  useEffect(() => {
    if (!city || streetSearch.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await searchStreets(city, streetSearch);
        setSuggestions(res);
      } catch {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [streetSearch, city]);

  const handleStatusChange = (addressId: string, status: StatusType) => {
    updateStatus.mutate({ id: addressId, status, visitedBy: "Orhan & Uwe" });
  };

  const handleLoadStreet = async (street: string) => {
    if (!id) return;
    setLoadingStreet(street);
    try {
      const found = await fetchStreetAddresses(street, city);
      if (found.length === 0) {
        toast.error("Keine Hausnummern gefunden");
        setLoadingStreet(null);
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
      setStreetSearch("");
      setSuggestions([]);
    } catch {
      toast.error("Fehler beim Laden");
    }
    setLoadingStreet(null);
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
    const abschluss = addresses.filter((a) => a.status === "abschluss").length;
    return {
      total,
      visited,
      abschluss,
      progress: total > 0 ? Math.round((visited / total) * 100) : 0,
    };
  }, [addresses]);

  if (!gebiet) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">Gebiet nicht gefunden</h2>
          <Button onClick={() => navigate("/gebiete")} className="mt-4">
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-4 py-2">
          <button
            onClick={() => navigate("/gebiete")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-sm font-semibold text-slate-900">{gebiet.name}</h1>
            <p className="text-xs text-slate-500">{city}</p>
          </div>
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setView("list")}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                view === "list" ? "bg-white shadow-sm" : ""
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                view === "map" ? "bg-white shadow-sm" : ""
              }`}
            >
              <Map className="h-4 w-4" />
            </button>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="px-4 pb-2">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
              <span>{stats.visited}/{stats.total}</span>
              <span>{stats.progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Straße suchen & laden..."
              value={streetSearch}
              onChange={(e) => setStreetSearch(e.target.value)}
              className="h-9 pl-9"
            />
            {streetSearch && (
              <button
                onClick={() => {
                  setStreetSearch("");
                  setSuggestions([]);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                {suggestions.map((s) => (
                  <button
                    key={`${s.street}-${s.city}`}
                    onClick={() => handleLoadStreet(s.street)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{s.street}</p>
                      <p className="text-xs text-slate-500">{s.city}</p>
                    </div>
                    {loadingStreet === s.street ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="text-xs text-blue-600">Laden</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Filter Straße/Hausnummer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {view === "list" ? (
          groupedAddresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-slate-500">Keine Adressen geladen</p>
              <p className="mt-1 text-xs text-slate-400">
                Suche oben eine Straße und klicke zum Laden
              </p>
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
          <div className="h-full overflow-hidden rounded-lg">
            <MapView addresses={addresses} />
          </div>
        )}
      </div>
    </div>
  );
}