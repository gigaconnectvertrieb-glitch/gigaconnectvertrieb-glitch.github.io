# E1 Laufliste – Übergabe an eine andere KI

Stand: 15.10.2026. Dieses Dokument enthält alles, um nahtlos weiterzuarbeiten. Sprache mit dem Nutzer: Deutsch.

## 1. Was die App ist
Mobile-first PWA für den Haustürvertrieb (E1 Direktvertrieb). Team: **Orhan** und **Luca** (Uwe/Partner).
Ablauf: Stadt eingeben → Straßen live aus OpenStreetMap → Straßen auswählen → Hausnummern landen als abzuarbeitende Liste → pro Haus Status setzen (Nicht da / Kein Interesse / Abschluss), Notiz → Bericht (zählt Orhan + Luca zusammen) → CSV-Export.
Tabs: **Lauflisten**, **Pitch**, **Bericht**, **Mehr**.

## 2. Tech-Stack
React 18 + Vite + TypeScript + Tailwind + zustand + react-router (HashRouter) + vite-plugin-pwa + lucide-react + react-hot-toast. Fonts lokal über @fontsource (Manrope, Libre Baskerville). Pfad-Alias `@/` = `src/`.
Backend: nur Supabase (REST ohne Bibliothek) + eine Edge Function. Kein eigener Server.

## 3. Hosting / Deploy (wichtig)
- Live: GitHub Pages aus Repo `gigaconnectvertrieb-glitch/gigaconnectvertrieb-glitch.github.io`, Branch `main` (enthält NUR gebaute Dateien, deploy-only).
- Quellcode: Branch `source` auf origin und lokaler Branch `main` (divergieren gewollt).
- Lokaler Ordner: `C:\Users\BossBitch\Documents\Standardprojekt\e1-gebietstracker`.
- Dev: `npx vite --port 5199 --host --force`, URL `http://localhost:5199/app.html` (Entry ist `app.html`, nicht index.html). Bei Tailwind-Config-Änderungen oder neuen Dateien Server neu starten.
- **Deploy-Ablauf:**
  1. `npm run deploy` (baut nach `dist/`, benennt app.html → index.html um, siehe `scripts/deploy.mjs`)
  2. Quellcode committen (`git add -A`, Commit)
  3. Temp-Worktree von `origin/main` anlegen (`$env:TEMP\wt-deploy`), alles außer `.git` löschen, `dist\*` hineinkopieren, committen
  4. `git push -q origin HEAD:main`, Worktree entfernen
  5. `git push -q origin main:source`
- Niemals force-push. Commit-Identität: `-c user.name="E1 Tracker" -c user.email=tracker@e1.de`. Trailer: `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
- Letzter Stand: `origin/main` = `b4445237` (Deploy), `origin/source` = `366837a8` (Quellcode). Danach kam nur diese HANDOFF.md dazu.
- PowerShell: kein `&&`, git-stderr erscheint als Fehler (harmlos).

## 4. Dateien
| Datei | Zweck |
|---|---|
| `src/App.tsx` | Routen: `/`, `/liste/:id`, `/pitch`, `/bericht`, `/mehr` |
| `src/store/useStore.ts` | zustand-Store, persistiert in localStorage `laufliste-v1`. Touren, Einträge, `me` (Orhan/Luca), Tombstones, `applyRemote` für Sync |
| `src/lib/sync.ts` | Live-Sync mit Supabase (REST). Exportiert `KEY` (anon-Key). Push nach 1,5 s Debounce, Pull alle 15 s, bei Fokus und online. Last-write-wins über `updatedAt`. Zustand in localStorage `laufliste-sync-v1` |
| `src/lib/sharedCache.ts` | `sharedGet`/`sharedPut` auf Tabelle `ll_cache` (gemeinsamer Straßen-/Hausnummern-Cache), stiller Fallback |
| `src/utils/osm.ts` | OSM/Overpass: parallele Mirrors, Area-ID, Straßen- und Hausnummern-Abfrage, lokaler + gemeinsamer Cache |
| `src/lib/utils.ts` | Helfer, `PEOPLE = ["Orhan","Luca"]` |
| `src/lib/pitch.ts` | 19 Sprachen (`LANGS`), Pitch-Bausteine, `translate()` über MyMemory, Web-Speech-Hilfen |
| `src/lib/geminiLive.ts` | Voice-Agent: Gemini Live über WebSocket (siehe 6) |
| `src/pages/Home.tsx` | Personenwahl, Stadt-Autocomplete, Lauflisten |
| `src/pages/Tour.tsx` | Liste einer Stadt, Fortschritt, Filter Offen/Erledigt/Alle |
| `src/pages/Report.tsx` | Tagesbericht, Personenfilter, Quote, CSV-Export |
| `src/pages/More.tsx` | Sync-Status, Export/Import, Installationshinweis, Alles löschen |
| `src/pages/PitchHub.tsx` | Umschalter KI-Sprachagent (Standard) / Dolmetscher |
| `src/pages/PitchAgent.tsx` | UI Voice-Agent: Sprache, PIN, Briefing, Start/Stop, Stumm, Transkript mit dt. Übersetzung |
| `src/pages/Pitch.tsx` | Dolmetscher (kostenlos, Web Speech + MyMemory) |
| `src/components/*` | `AddStreetsSheet`, `CityAutocomplete` (Nominatim), `HouseRow`, `StreetSection`, `Layout` (4 Tabs, `h-[100dvh]`) |
| `supabase/schema.sql` | Tabellen `ll_tours`, `ll_entries` + RLS |
| `supabase/cache.sql` | Tabelle `ll_cache` + RLS |
| `supabase/functions/gemini-token/index.ts` | Edge Function für Gemini-Ephemeral-Token |
| `tailwind.config.js`, `src/index.css` | Dark-Theme, Responsive |

## 5. Supabase
- Projekt-URL: `https://syjwagsgxwfiacbfkoyp.supabase.co`. Der anon-Key steckt in `src/lib/sync.ts` (`KEY`). Er ist öffentlich gedacht.
- Tabellen `ll_tours`, `ll_entries`: Spalten `id`, `tour_id` (bei Einträgen), `data jsonb`, `updated_at text`, `deleted`. RLS erlaubt `anon` alles. **Es gibt kein Login.** Jeder mit dem Key kann lesen und schreiben.
- `ll_cache`: `supabase/cache.sql` wurde vom Nutzer **noch nicht ausgeführt**. Bis dahin fällt der gemeinsame Cache still auf lokal zurück. Nach dem Ausführen testen, ob Schreiben und Lesen klappt.
- Der Nutzer hat keinen Zugriff über CLI für mich. Änderungen an Supabase macht er im Dashboard (SQL Editor, Edge Functions, Secrets).

## 6. Voice-Agent (zuletzt gebaut, ungetestet)
- Von OpenAI Realtime auf **Gemini Live** umgestellt, weil der Nutzer kein Geld hat. Alter OpenAI-Code ist gelöscht.
- Ablauf: `fetchToken()` ruft `…/functions/v1/gemini-token` (Header `apikey`, `Authorization: Bearer <anon>`, `x-team-pin`). Die Function erzeugt über `POST generativelanguage.googleapis.com/v1beta/auth_tokens` einen Token (`uses:1`, 30 min). Der Client öffnet `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=<token>`.
- Erste Nachricht `setup`: Modell `models/gemini-3.8-live`, `responseModalities:["AUDIO"]`, Stimme `Kore`, System-Prompt (Berater von E1, deutsch formuliert, spricht Zielsprache, kurze Sätze, KI offenlegen, keine erfundenen Preise, kein Vertragsabschluss), `inputAudioTranscription`, `outputAudioTranscription`.
- Audio rein: ScriptProcessor, Downsampling auf 16 kHz PCM16, `realtimeInput.audio` mit `audio/pcm;rate=16000`. Audio raus: PCM16 24 kHz, per WebAudio planmäßig abgespielt. `interrupted` stoppt die Wiedergabe.
- Nach `setupComplete` wird ein Text gesendet, damit die KI zuerst begrüßt.
- **Nicht gegen die Realität getestet.** Modellname, Token-Body (`auth_tokens`), ScriptProcessor-Verhalten auf iOS und Echo sind Risiken. Wenn der Token-Aufruf scheitert, Antwort von Google prüfen. Wenn das Modell nicht gefunden wird, aktuelle Modellnamen in der Google-Live-API-Doku nachsehen.
- **Einrichtung durch den Nutzer** (steht noch aus):
  1. Key auf aistudio.google.com erstellen (nicht im Chat posten).
  2. Supabase → Edge Functions → neue Function `gemini-token`, Code aus `supabase/functions/gemini-token/index.ts`.
  3. Secrets `GEMINI_API_KEY` und optional `TEAM_PIN`.
- Ohne eingerichtete Function zeigt die App "Voice-Agent ist noch nicht eingerichtet" bzw. einen CORS-Fehler in der Konsole.

## 7. Bekannte Fakten und Fallstricke
- **Hausnummern kommen aus OSM**, nicht amtlich. Google Maps liefert keine Straßen- oder Hausnummernlisten.
- Overpass-Server sind oft überlastet. Brauchbare Mirrors: `overpass-api.de`, `lz4.overpass-api.de`, `z.overpass-api.de`, `maps.mail.ru`. Nicht nutzbar: `overpass.osm.ch`, `kumi.systems`, `private.coffee`.
- Gemessen: 66 Hausnummern in ca. 14 s, Straßenliste Darmstadt lädt, dauert aber spürbar. Der gemeinsame Cache soll das für die zweite Person beschleunigen.
- Dark-Theme: Tailwind-Standardfarben sind umdefiniert (white = Kartenfläche `#12161e`, slate invertiert, blue = Gold `#c9a227`, Hintergrund `#0b0d12`). Neue UI-Teile mit den vorhandenen Klassen bauen, sonst wirkt es falsch.
- Responsive: `100dvh`, Safe-Area-Padding, Eingabeschrift mind. 16 px (iOS-Zoom), `max-w-3xl`. Getestet bei 320, 390, 820, 1440 px.
- Mikrofon, Vorlesen und Spracherkennung wurden nie auf echten Geräten getestet. iOS braucht Safari und Mikrofonfreigabe. MyMemory hat ein Tageslimit.
- Playwright-Browser-Tests: ein offener Dialog blockiert die Seite. Frisches Gerät simulieren durch Löschen von `laufliste-sync-v1` und `laufliste-v1` im localStorage. Achtung: Sync holt Daten dann von Supabase zurück.
- Testdaten nie im geteilten Sync lassen (zuletzt die Darmstadt-Testliste gelöscht). Es existieren echte Listen "Weitersta" und "Weiterstadt".

## 8. Offene Punkte (Priorität)
1. Nutzer richtet Gemini-Function und Secrets ein, dann Voice-Agent auf echtem Handy testen und Fehler beheben.
2. Nutzer führt `supabase/cache.sql` aus, danach Cache testen.
3. Optional: Team-PIN bzw. Login für die ganze App (aktuell offen für jeden mit dem anon-Key).
4. `README.md` ist veraltet (Deploy-Flow, Sync, Pitch). Aktualisieren.
5. Mikrofon-/Audio-Test des Dolmetschers auf iOS und Android.
6. Gemini-Audio: `ScriptProcessorNode` ist veraltet, später auf AudioWorklet umstellen.

## 9. Sicherheitshinweise
- Der Nutzer hat früher einen GitHub-PAT im Chat gepostet. Er wurde nie benutzt. Der Nutzer sollte ihn widerrufen. Nie Keys in den Code committen außer dem öffentlichen Supabase-anon-Key.
- Der anon-Key schützt die Edge Function nicht. `TEAM_PIN` setzen, sonst kann jeder das Gemini-Kontingent verbrauchen.

## 10. Nutzerpräferenzen
Deutsch, kurz und direkt. Er will funktionierende, getestete Ergebnisse, keine Skizzen. Verifizieren statt behaupten. Keine Rückfragen-Ketten, vernünftige Annahmen treffen und nennen.
