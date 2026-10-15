import { useState } from "react";
import { useGebiete, useCreateGebiet } from "@/hooks/useGebiete";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "react-router-dom";
import { MapPin, Plus, Trash2, Search } from "lucide-react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useDeleteGebiet } from "@/hooks/useGebiete";

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
    if (confirm("Gebiet wirklich löschen?")) {
      setDeletingId(id);
      deleteGebiet.mutate(id, { onSettled: () => setDeletingId(null) });
    }
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Gebiete</h1>
              <p className="text-xs text-slate-500">Stadt für Stadt abarbeiten</p>
            </div>
          </div>
          <Button onClick={() => setIsCreating(!isCreating)} size="sm">
            <Plus className="h-4 w-4" />
            Neues Gebiet
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-4">
        {isCreating && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <Input
                  placeholder="Gebietsname (z. B. Groß-Zimmern)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  placeholder="Stadt"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={createGebiet.isPending}>
                    Anlegen
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

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Suche nach Gebiet oder Stadt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Lade Gebiete...
          </div>
        ) : filteredGebiete.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500">Noch keine Gebiete</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredGebiete.map((gebiet) => (
              <Card key={gebiet.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <Link
                    to={`/gebiete/${gebiet.id}`}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {gebiet.name}
                    </h3>
                    <p className="truncate text-xs text-slate-500">
                      {gebiet.city}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(gebiet.id)}
                    disabled={deletingId === gebiet.id}
                  >
                    <Trash2 className="h-4 w-4 text-slate-400" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}