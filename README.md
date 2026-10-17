# Teilnehmerliste

Schlanke Checkliste zum Abhaken von Teilnehmenden pro Gruppe. Die Liste kommt aus
einer Excel-Datei, jedes Arbeitsblatt ist eine Gruppe. Alles läuft im Browser: kein
Backend, keine Analytics, keine externen Requests. Namen und Häkchen liegen nur in
`localStorage` des jeweiligen Geräts.

## Funktionen

- Import von `.xlsx`, `.xls`, `.xlsm`, `.ods` und `.csv` (UTF-8 oder Windows-1252).
  Namen aus der ersten Spalte oder über eine Kopfzeile: `Name`, `Vorname` + `Nachname`,
  `Name` + `Vorname`. Leere und ausgeblendete Blätter werden übersprungen.
- Gruppen als Tabs mit Zähler, Gesamtzähler im Kopf, Suche über alle Gruppen,
  „Erledigte ausblenden“.
- Erneuter Import übernimmt bestehende Häkchen (Abgleich über Gruppe und Name,
  unabhängig von Groß-/Kleinschreibung und Akzenten).
- Export als Excel: ein Blatt pro Gruppe mit `Name` und `Abgehakt`. Der Export lässt
  sich wieder importieren, auch auf einem anderen Gerät.
- Demo-Modus mit erfundenen Namen, getrennt von echten Daten gespeichert.
- Offline nutzbar: Ein Service Worker hält alle Dateien vor, sobald die App einmal
  online geöffnet wurde. Auf dem Homescreen installierbar.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```sh
npm install
npm run dev        # Entwicklungsserver auf http://localhost:5173
```

Der Service Worker ist nur im Build aktiv. Zum Ausprobieren des Builds:

```sh
npm run build
npm run preview    # http://localhost:4173
```

Die Header aus `public/_headers` (CSP usw.) setzt erst Cloudflare Pages, nicht der
lokale Server.

## Testen

```sh
npm test           # Vitest: Parser, Merge, Dateiformate, Export, Demo
npm run build      # prüft auch die Typen
```

Die Test-Dateien in `test/fixtures/` erzeugt `npm run fixtures`. Sie enthalten nur
erfundene Namen.

## Deployen (Cloudflare Pages)

Einmalig anmelden und das Projekt anlegen:

```sh
npx wrangler login
npx wrangler pages project create teilnehmerliste --production-branch main
```

Ohne Browser-Login gehen auch die Umgebungsvariablen `CLOUDFLARE_API_TOKEN`
(Recht „Cloudflare Pages: Edit“) und `CLOUDFLARE_ACCOUNT_ID`.

```sh
npm run deploy:preview      # Vorschau: https://preview.teilnehmerliste.pages.dev
npm run deploy:production   # Produktion: https://teilnehmerliste.pages.dev
```

`wrangler` gibt zusätzlich eine URL pro Deployment aus.

## Aufbau

```
index.html             Grundgerüst
src/app.ts             Zustand, Darstellung, Ereignisse
src/storage.ts         localStorage (echte Liste und Demo getrennt)
src/model/             Parser, Merge, Normalisierung, Demo-Daten (ohne DOM, getestet)
src/import/            SheetJS-Anbindung, wird erst bei Bedarf geladen
src/sw-register.ts     Anmeldung und Update-Verhalten des Service Workers
sw/sw.js               Service Worker; die Dateiliste setzt vite.config.ts beim Build ein
public/_headers        CSP, Referrer-Policy, noindex für Cloudflare Pages
reference/             ursprünglicher Prototyp als Einzeldatei
```

SheetJS wird nicht aus npm (`xlsx@0.18.5`, veraltet) bezogen, sondern als Tarball von
`cdn.sheetjs.com` (siehe `package.json`). Zum Aktualisieren die Version dort prüfen
und die URL anpassen.

## Datenschutz

- Keine Daten verlassen den Browser. Import und Export passieren lokal.
- Strikte Content Security Policy (`default-src 'self'`), `Referrer-Policy: no-referrer`,
  `X-Robots-Tag: noindex`.
- Geschützt sind die Namen durch die Gerätesperre. Nach dem Einsatz die Liste über
  das Menü löschen („Liste löschen“).
