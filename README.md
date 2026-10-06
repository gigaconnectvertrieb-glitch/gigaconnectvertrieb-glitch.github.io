# Gebietsmanager

Eigenständige Gebiets-App für den Außendienst. Nicht Teil von EnergyOne und nicht an dessen Postgres auf Render gebunden.

Gebiete anlegen, Gebäude aus OpenStreetMap lesen, Mitarbeitern zuweisen, Türen abgehen, Nachlauf in der Wochenliste.

Backend ist das eigene Supabase-Projekt (`js/config.js`). Die App selbst ist statisch und läuft über GitHub Pages.

## Start

```bash
npx serve .
```

Oder `index.html` im Browser öffnen. Ohne Supabase-Sync liegen Daten lokal (`localStorage`, Schlüssel `gm.v2`).

## Funktionen

- Punkte auf der Karte setzen. Die Verbindung ist die Gebietsgrenze. Darin werden Straße, Hausnummer, Einfamilie/Mehrfamilie und Wohneinheiten aus OpenStreetMap gelesen und nach Straße sortiert.
- Gebäude als Einfamilienhaus (1 Wohneinheit) oder Mehrfamilienhaus (mehrere Wohneinheiten)
- Gebiet anlegen, GeoJSON oder CSV importieren (`street,house,zip,city,lat,lng`)
- Mitarbeiter zuweisen und Gebiet annehmen
- Besuch eintragen: nicht angetroffen, Laufzeit, Termin, kein Interesse, Abschluss
- Wochenliste, sortiert nach Grund und Nachlaufdatum
- Export als GeoJSON

## Nachlauf

| Grund | Nachlauf |
| --- | --- |
| nicht angetroffen | 7 Tage |
| Laufzeit passt nicht | 30 Tage |
| Termin vereinbart | 7 Tage |
| später nochmal | 3 Tage |

## Offen

- Supabase-Client und Tabellen fehlen noch. `js/config.js` hat URL und Dummy-Keys, `app.js` liest sie nicht.
- Echter Publishable Key statt Dummy. Secret Key nicht in dieses öffentliche Repo.
- Login und Team kommen aus Supabase, nicht aus der fest verdrahteten Demo-Liste.
