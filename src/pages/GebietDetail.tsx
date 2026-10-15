import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useGebiete } from "@/hooks/useGebiete";
import { useAddresses, useUpdateAddressStatus, useCreateAddresses } from "@/hooks/useAddresses";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import StreetGroup from "@/components/StreetGroup";
import MapView from "@/components/MapView";
import { ArrowLeft, Map, List, Plus, Search, Loader2 } from "lucide-react";
import { Address } from "@/hooks/useAddresses";
import { StatusType } from "@/lib/utils";
import { getGoogleMapsLoader } from "@/utils/googleMaps";
import toast from "react-hot-toast";

export default function GebietDetail() {
  useRealtimeSync();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "map">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [streetInput, setStreetInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [startNum, setStartNum] = useState("");
  const [endNum, setEndNum] = useState("");
  const [useManual, setUseManual] = useState(false);

  const { data: gebiete = [] } = useGebiete();
  const gebiet = gebiete.find((g) => g.id === id);

  const { data: addresses = [] } = useAddresses(id || null);
  const updateStatus = useUpdateAddressStatus();
  const createAddresses = useCreateAddresses();

  const handleStatusChange = (addressId: string, status: StatusType) => {
    updateStatus.mutate({ id: addressId, status, visitedBy: "Orhan & Uwe" });
  };

  const handleAddStreet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !streetInput) return;

    if (useManual) {
      const start = parseInt(startNum);
      const end = parseInt(endNum);
      if (isNaN(start) || isNaN(end) || start > end) {
        toast.error("Ungültige Hausnummern");
        return;
      }

      setLoading(true);
      try {
        const loader = getGoogleMapsLoader();
        await loader.load();

        const geocoder = new google.maps.Geocoder();
        const newAddresses: Omit<Address, "id" | "created_at" | "updated_at" | "status" | "visited_by" | "visited_at" | "notes">[] = [];
        const city = cityInput || gebiet?.city;

        for (let num = start; num <= end; num++) {
          const addressQuery = `${streetInput} ${num}, ${city}`;
          const result = await geocoder.geocode({ address: addressQuery });
          newAddresses.push({
            gebiet_id: id,
            street_name: streetInput,
            house_number: num.toString(),
            lat: result.results[0]?.geometry.location.lat() || null,
            lng: result.results[0]?.geometry.location.lng() || null,
          });
          await new Promise((resolve) => setTimeout(resolve, 120));
        }

        createAddresses.mutate(newAddresses);
        setIsAdding(false);
        setStreetInput("");
        setStartNum("");
        setEndNum("");
        setUseManual(false);
        toast.success(`${newAddresses.length} Adressen hinzugefügt`);
      } catch (error) {
        toast.error("Fehler beim Laden");
        console.error(error);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const loader = getGoogleMapsLoader();
      await loader.load();

      const geocoder = new google.maps.Geocoder();
      const city = cityInput || gebiet?.city;
      const request: google.maps.GeocoderRequest = {
        address: `${streetInput}, ${city}`,
        componentRestrictions: city ? { country: "DE" } : undefined,
      };

      const result = await geocoder.geocode(request);
      if (result.results.length === 0) {
        toast.error("Straße nicht gefunden");
        setLoading(false);
        return;
      }

      const location = result.results[0].geometry.location;
      const bounds = result.results[0].geometry.viewport;

      const streetBounds = bounds || new google.maps.LatLngBounds(
        new google.maps.LatLng(location.lat() - 0.01, location.lng() - 0.01),
        new google.maps.LatLng(location.lat() + 0.01, location.lng() + 0.01)
      );

      geocoder.geocode({ bounds: streetBounds }, async (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
          const houseNumbers = new Set<string>();
          const addressList: Array<{ num: string, lat: number, lng: number }> = [];

          results.forEach((res) => {
            const addr = res.address_components;
            let hasStreet = false;
            let num = "";
            addr.forEach((c) => {
              if (c.types.includes("route") && c.long_name.toLowerCase().includes(streetInput.toLowerCase())) {
                hasStreet = true;
              }
              if (c.types.includes("street_number")) {
                num = c.long_name;
              }
            });
            if (hasStreet && num && !houseNumbers.has(num)) {
              houseNumbers.add(num);
              addressList.push({
                num,
                lat: res.geometry.location.lat(),
                lng: res.geometry.location.lng(),
              });
            }
          });

          if (addressList.length === 0) {
            toast.error("Keine Hausnummern gefunden. Verwende 'Manuell (Von/Bis)'.");
            setUseManual(true);
            setLoading(false);
            return;
          }

          addressList.sort((a, b) => {
            const na = parseInt(a.num.replace(/\D/g, "")) || 0;
            const nb = parseInt(b.num.replace(/\D/g, "")) || 0;
            return na - nb;
          });

          const newAddrs = addressList.map((a) => ({
            gebiet_id: id,
            street_name: streetInput,
            house_number: a.num,
            lat: a.lat,
            lng: a.lng,
          }));

          createAddresses.mutate(newAddrs);
          setIsAdding(false);
          setStreetInput("");
          toast.success(`${newAddrs.length} Hausnummern automatisch gefunden`);
        } else {
          toast.error("Fehler beim Abrufen der Hausnummern");
          setUseManual(true);
        }
        setLoading(false);
      });
    } catch (error) {
      toast.error("Fehler beim Laden");
      console.error(error);
      setLoading(false);
    }
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
      if (!groups[addr.street_name]) {
        groups[addr.street_name] = [];
      }
      groups[addr.street_name].push(addr);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [addresses, searchTerm]);

  if (!gebiet) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Gebiet nicht gefunden
          </h2>
          <Button onClick={() => navigate("/gebiete")} className="mt-4">
            Zurück zu Gebieten
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white p-3 md:p-4">
        <div className="mb-2 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/gebiete")}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">Zurück</span>
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-900 md:text-xl">
              {gebiet.name}
            </h1>
            <p className="text-xs text-slate-600 md:text-sm">{gebiet.city}</p>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "map" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("map")}
            >
              <Map className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">Straße hinzufügen</span>
            </Button>
          </div>
        </div>

        {isAdding && (
          <Card className="mb-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm md:text-base">
                Straße hinzufügen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStreet} className="flex flex-col gap-2">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Input
                    placeholder="Stadt (optional)"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                  />
                  <Input
                    placeholder="Straßenname (z. B. Hauptstraße)"
                    value={streetInput}
                    onChange={(e) => setStreetInput(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="manual"
                    checked={useManual}
                    onChange={(e) => setUseManual(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="manual" className="text-sm text-slate-700">
                    Manuell (Von/Bis Hausnummer)
                  </label>
                </div>
                {useManual && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Von Nr."
                      value={startNum}
                      onChange={(e) => setStartNum(e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Bis Nr."
                      value={endNum}
                      onChange={(e) => setEndNum(e.target.value)}
                      required
                    />
                  </div>
                )}
                <Button type="submit" disabled={loading || createAddresses.isPending}>
                  {loading || createAddresses.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {useManual ? "Lade..." : "Suche Hausnummern..."}
                    </>
                  ) : (
                    useManual ? "Hinzufügen" : "Automatisch finden"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Straße oder Hausnummer suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 md:p-4">
        {view === "list" ? (
          addresses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
                <p className="text-sm text-slate-500 md:text-base">
                  Noch keine Adressen hinzugefügt
                </p>
                <Button onClick={() => setIsAdding(true)} className="mt-4">
                  <Plus className="h-4 w-4" />
                  Erste Straße hinzufügen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
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
          <Card className="h-full overflow-hidden">
            <CardContent className="h-full p-0">
              <MapView addresses={addresses} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}