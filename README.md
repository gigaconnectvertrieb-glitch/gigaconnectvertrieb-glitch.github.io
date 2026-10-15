# Laufliste (Außendienst)

Mobile PWA zum Abarbeiten von Straßen Tür für Tür.

## Ablauf

1. **Stadt eingeben** – mit Vorschlägen (OpenStreetMap/Nominatim).
2. **Straßen wählen** – die Straßen der Stadt werden automatisch abgefragt (Overpass); mehrere Straßen ankreuzen.
3. **Hausnummern landen in der Liste** – gruppiert nach Straße, sortiert nach Nummer.
4. **Abarbeiten** – pro Tür *Nicht da*, *Kein Interesse* oder *Abschluss* (nochmal tippen = zurück auf offen), Notiz und Navigation (Google Maps) pro Haus.
5. **Bericht** – Tagesstatistik mit CSV-Export.

Fehlen in OSM Hausnummern für eine Straße, können sie als Bereich (von/bis, gerade/ungerade) manuell ergänzt werden.

## Daten

Alles liegt lokal im Browser (localStorage), ohne Login und offline nutzbar. Nur das Laden von Städten/Straßen/Hausnummern braucht Internet. Unter *Mehr* gibt es JSON-Export/-Import, um Listen zwischen Geräten zu übertragen.

## Entwicklung

```
npm install
npm run dev
npm run build
```
