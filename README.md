# Gebietsmanager

Eigenständige Gebiets-App. Nicht Teil von EnergyOne.

Gebiete anlegen, Gebäude aus OpenStreetMap lesen, Team zuweisen, Türen abgehen, Wochenliste.

## Start

```bash
npx serve .
```

Daten liegen lokal (`localStorage`, `gm.v2`) und werden nach Supabase geschrieben, sobald Tabellen und Key gültig sind.

## Supabase

URL, Publishable Key und Secret Key stehen in `js/config.js`. Der Client nutzt den Secret Key.

Einmal im SQL-Editor ausführen: `supabase/schema.sql`.

Danach lädt die App Gebiete, Türen, Besuche und Team von Supabase. Ist der Key ungültig oder fehlen Tabellen, bleibt alles lokal und der Status oben rechts zeigt den Grund.
