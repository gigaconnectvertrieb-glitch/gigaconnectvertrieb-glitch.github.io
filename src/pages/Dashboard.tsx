import { useGebiete } from "@/hooks/useGebiete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Link } from "react-router-dom";
import { MapPin, Home, TrendingUp, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const { data: gebiete = [] } = useGebiete();

  return (
    <div className="flex h-full flex-col overflow-auto p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
          Dashboard
        </h1>
        <p className="text-sm text-slate-600 md:text-base">
          Übersicht über euer Gebiet
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">
              Gebiete
            </CardTitle>
            <MapPin className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold md:text-2xl">{gebiete.length}</div>
            <p className="text-xs text-slate-500">Erstellt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">
              Häuser gesamt
            </CardTitle>
            <Home className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold md:text-2xl">-</div>
            <p className="text-xs text-slate-500">Über alle Gebiete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">
              Abschlüsse
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600 md:text-2xl">-</div>
            <p className="text-xs text-slate-500">Gesamt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">
              Abschlussquote
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold md:text-2xl">- %</div>
            <p className="text-xs text-slate-500">Gesamt</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 flex-1 overflow-auto md:mt-6">
        <h2 className="mb-2 text-lg font-semibold text-slate-900 md:mb-3 md:text-xl">
          Letzte Gebiete
        </h2>
        {gebiete.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
              <MapPin className="h-10 w-10 text-slate-300 md:h-12 md:w-12" />
              <h3 className="mt-3 text-base font-medium text-slate-900 md:text-lg">
                Noch keine Gebiete
              </h3>
              <p className="mt-1 text-center text-sm text-slate-500">
                Legt euer erstes Gebiet in "Gebiete" an
              </p>
              <Link
                to="/gebiete"
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Erstes Gebiet anlegen
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 md:gap-3">
            {gebiete.slice(0, 6).map((gebiet) => (
              <Link key={gebiet.id} to={`/gebiete/${gebiet.id}`}>
                <Card className="h-full transition-colors hover:bg-slate-50">
                  <CardContent className="p-3 md:p-4">
                    <h3 className="text-sm font-semibold text-slate-900 md:text-base">
                      {gebiet.name}
                    </h3>
                    <p className="text-xs text-slate-500 md:text-sm">
                      {gebiet.city}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}