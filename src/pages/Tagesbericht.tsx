import { useGebiete } from "@/hooks/useGebiete";
import { useAddresses } from "@/hooks/useAddresses";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Download, Home, XCircle, Ban, CheckCircle2 } from "lucide-react";
import { STATUS_COLORS } from "@/lib/utils";
import { useMemo, useState } from "react";

export default function Tagesbericht() {
  useRealtimeSync();
  const { data: gebiete = [] } = useGebiete();
  const [selectedDate] = useState(new Date());

  // Get all addresses
  const gebietIds = gebiete.map((g) => g.id);
  const addressQueries = gebietIds.map((id) => useAddresses(id));

  const allAddresses = addressQueries.flatMap((q) => q.data || []);
  const isLoading = addressQueries.some((q) => q.isLoading);

  const stats = useMemo(() => {
    const total = allAddresses.length;
    const unvisited = allAddresses.filter((a) => a.status === "unvisited").length;
    const nichtDa = allAddresses.filter((a) => a.status === "nicht_da").length;
    const keinInteresse = allAddresses.filter((a) => a.status === "kein_interesse").length;
    const abschluss = allAddresses.filter((a) => a.status === "abschluss").length;
    const visited = total - unvisited;

    const barData = [
      { name: "Unbesucht", value: unvisited, color: STATUS_COLORS.unvisited },
      { name: "Nicht da", value: nichtDa, color: STATUS_COLORS.nicht_da },
      { name: "Kein Interesse", value: keinInteresse, color: STATUS_COLORS.kein_interesse },
      { name: "Abschluss", value: abschluss, color: STATUS_COLORS.abschluss },
    ];

    const pieData = [
      { name: "Nicht da", value: nichtDa, color: STATUS_COLORS.nicht_da },
      { name: "Kein Interesse", value: keinInteresse, color: STATUS_COLORS.kein_interesse },
      { name: "Abschluss", value: abschluss, color: STATUS_COLORS.abschluss },
    ].filter((d) => d.value > 0);

    const quote = total > 0 ? Math.round((abschluss / visited) * 100) : 0;
    const doorsPerVisit = visited > 0 ? (visited / (gebiete.length || 1)).toFixed(1) : "0";

    return {
      total,
      unvisited,
      nichtDa,
      keinInteresse,
      abschluss,
      visited,
      quote,
      doorsPerVisit,
      barData,
      pieData,
    };
  }, [allAddresses, gebiete.length]);

  const handleExportCSV = () => {
    const headers = ["Straße", "Hausnummer", "Status", "Besucht von", "Besucht am"];
    const rows = allAddresses.map((a) => [
      a.street_name,
      a.house_number,
      a.status === "nicht_da"
        ? "Nicht da"
        : a.status === "kein_interesse"
        ? "Kein Interesse"
        : a.status === "abschluss"
        ? "Abschluss"
        : "Unbesucht",
      a.visited_by || "",
      a.visited_at ? format(new Date(a.visited_at), "dd.MM.yyyy HH:mm") : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tagesbericht_${format(selectedDate, "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-500">Lade Statistik...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto p-3 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
            Tagesbericht
          </h1>
          <p className="text-sm text-slate-600 md:text-base">
            Übersicht über den Fortschritt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <Calendar className="h-4 w-4 text-slate-500" />
            {format(selectedDate, "dd. MMMM yyyy", { locale: de })}
          </div>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4" />
            CSV Export
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">
              Türen gesamt
            </CardTitle>
            <Home className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold md:text-2xl">{stats.total}</div>
            <p className="text-xs text-slate-500">Über alle Gebiete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">
              Besuchte Türen
            </CardTitle>
            <XCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold md:text-2xl">{stats.visited}</div>
            <p className="text-xs text-slate-500">
              {stats.total > 0 ? Math.round((stats.visited / stats.total) * 100) : 0}% der Gesamt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">
              Kein Interesse
            </CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600 md:text-2xl">
              {stats.keinInteresse}
            </div>
            <p className="text-xs text-slate-500">
              {stats.visited > 0 ? Math.round((stats.keinInteresse / stats.visited) * 100) : 0}% der Besuche
            </p>
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
            <div className="text-xl font-bold text-green-600 md:text-2xl">
              {stats.abschluss}
            </div>
            <p className="text-xs text-slate-500">
              Abschlussquote: {stats.quote}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid flex-1 grid-cols-1 gap-4 overflow-auto md:mt-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Verteilung</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[250px] md:min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Besuchte Türen</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[250px] md:min-h-[300px]">
            {stats.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-500">
                  Noch keine besuchten Türen
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}