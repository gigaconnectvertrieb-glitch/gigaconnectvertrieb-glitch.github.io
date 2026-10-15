import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Smartphone, WifiOff, Wifi, Download } from "lucide-react";

export default function Settings() {
  const isOnline = navigator.onLine;

  const handleInstall = async () => {
    if ("serviceWorker" in navigator && "BeforeInstallPromptEvent" in window) {
      // @ts-ignore
      const event = window.deferredPrompt;
      if (event) {
        event.prompt();
      }
    }
  };

  return (
    <div className="flex h-full flex-col overflow-auto p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl font-bold text-slate-900 md:text-2xl">
          Einstellungen
        </h1>
        <p className="text-sm text-slate-600 md:text-base">
          App-Einstellungen & Status
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Netzwerk-Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                <span className="text-sm text-slate-700 md:text-base">
                  Online - Sync aktiv
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-orange-500" />
                <span className="text-sm text-slate-700 md:text-base">
                  Offline - Lokale Speicherung
                </span>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">
              Als App installieren
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleInstall} className="w-full md:w-auto">
              <Download className="h-4 w-4" />
              Zum Home-Bildschirm hinzufügen
            </Button>
            <p className="mt-2 text-xs text-slate-500">
              Auf Android: Über Browser-Menü "Zum Startbildschirm". Auf iOS: Teilen
              → "Zum Home-Bildschirm".
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Über die App</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 md:text-base">
                  E1 Gebietstracker
                </h3>
                <p className="text-xs text-slate-500 md:text-sm">
                  E1 Direktvertrieb - Strom & Gas D2D
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Version 1.0.0
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}