import { useState } from "react";
import { useGebiete, useCreateGebiet, useDeleteGebiet } from "@/hooks/useGebiete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "react-router-dom";
import { Plus, MapPin, Search, Trash2 } from "lucide-react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function Gebiete() {
  useRealtimeSync();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: gebiete = [], isLoading } = useGebiete();
  const createGebiet = useCreateGebiet();
  const deleteGebiet = useDeleteGebiet();

  const filteredGebiete = gebiete.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city) return;

    createGebiet.mutate({
      name,
      city,
      street: null,
    });

    setName("");
    setCity("");
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Wirklich dieses Gebiet mit allen Adressen löschen?")) {
      setDeletingId(id);
      deleteGebiet.mutate(id, {
        onSettled: () => setDeletingId(null),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-500">Lade Gebiete...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto p-3 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
            Gebiete
          </h1>
          <p className="text-sm text-slate-600 md:text-base">
            Alle Gebiete verwalten
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="w-full md:w-auto">
          <Plus className="h-4 w-4" />
          Neues Gebiet
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-4 md:mb-6">
          <CardHeader>
            <CardTitle>Neues Gebiet anlegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
              <Input
                placeholder="Gebietsname (z. B. Groß-Zimmern)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                placeholder="Stadt/Ort"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={createGebiet.isPending}>
                  Erstellen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-3 md:mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Gebiet oder Stadt suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredGebiete.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
              <MapPin className="h-10 w-10 text-slate-300 md:h-12 md:w-12" />
              <h3 className="mt-3 text-base font-medium text-slate-900 md:text-lg">
                {gebiete.length === 0
                  ? "Noch keine Gebiete"
                  : "Keine Treffer"}
              </h3>
              <p className="mt-1 text-center text-sm text-slate-500">
                {gebiete.length === 0
                  ? "Legt euer erstes Gebiet an"
                  : "Versucht eine andere Suche"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 md:gap-3">
            {filteredGebiete.map((gebiet) => (
              <Card key={gebiet.id} className="h-full transition-colors hover:bg-slate-50">
                <CardContent className="p-3 md:p-4">
                  <Link to={`/gebiete/${gebiet.id}`} className="block">
                    <h3 className="text-sm font-semibold text-slate-900 md:text-base">
                      {gebiet.name}
                    </h3>
                    <p className="text-xs text-slate-500 md:text-sm">
                      {gebiet.city}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Erstellt: {new Date(gebiet.created_at).toLocaleDateString("de-DE")}
                    </p>
                  </Link>
                  <div className="mt-2 flex gap-2">
                    <Link to={`/gebiete/${gebiet.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Öffnen
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(gebiet.id)}
                      disabled={deletingId === gebiet.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}