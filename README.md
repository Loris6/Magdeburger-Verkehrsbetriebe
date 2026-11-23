# MVB – Magdeburger Verkehrsbetriebe (Webseite)

Webseite im Aufbau des BVG-Vorbilds, für die **Magdeburger Verkehrsbetriebe**, in MVB-Grün. Reines HTML, CSS und JavaScript ohne Build-Schritt – läuft direkt auf GitHub Pages.

## Farben ändern – eine Datei

**`assets/css/variables.css`** enthält alle Farben:

| Variable | Wofür |
|---|---|
| `--mvb-green` (+ Abstufungen) | MVB-Hauptfarbe – falls das Grün nicht stimmt, nur hier ändern |
| `--scrollbar-*` (oberer Block) | Scrollbar rechts im hellen Modus |
| `--scrollbar-*` unter `[data-theme="dark"]` | eigene Scrollbar-Farbe im Dark Mode |
| `--line-tram-1` … `--line-tram-13`, `--line-night`, `--line-bus` | Linienfarben (aus Muvit) |
| `--st-ontime`, `--st-early`, `--st-slight`, `--st-late` | Status: pünktlich, früher, leicht verspätet, verspätet |
| `--tr-*` | Streifen der Seitenwechsel-Animation |
| `--line-closed`, `--line-cross` | Störungskarte: gesperrter Abschnitt und Sperr-Kreuz |

## Seiten

- **Startseite**: Bühne mit aktueller MVB-Meldung, Fahrplanauskunft (Start/Ziel, „Planen mit Karte“), Wichtige Hinweise, Baumaßnahmen & Störungen, ÖPNV-Netz, Abo/Karriere/Unternehmen, MVB-News, Apps
- **Verbindungen** mit drei Reitern:
  - **Verbindung** – Verbindungen mit Echtzeit, proportionale Linienleiste, Zeitstrahl in Linienfarben, Früher/Später
  - **Abfahrt** – Live-Abfahrtstafel (MVB-Echtzeit über den Muvit-Dienst, sonst Transitous), alle 30 s aktualisiert
  - **Interaktive Karte** – *Ebene 1*: komplettes Liniennetz, Straßenbahn / Bus / Nacht umschaltbar, Linie antippen zeigt Verlauf und Haltestellen. *Ebene 2*: Start und Ziel wählen (Karte oder Suche) → schnellster Weg mit Umstiegen und Fußwegen (z. B. Bus-Halt → Tram-Halt), jeder Abschnitt in seiner Linienfarbe, dazu die nächste erreichbare Abfahrt je Abschnitt live
- **Störungsmeldungen** – gefiltert nach Linie/Art/Zeitraum, gruppiert nach Straßenbahn und Bus; jede Meldung hat eine **Störungskarte**: gesperrter Abschnitt ausgegraut, rotes Kreuz an der Sperrung, neuer Fahrweg (Umleitung) bzw. Ersatzverkehr eingezeichnet
- **Neuigkeiten**, **Abos & Tickets**, **Service & Kontakt**, **Unternehmen**, **Netz & Linien**, **MVB-Konto** (nur auf dem Gerät)
- **Karriere** – Stellen und Ausbildungsberufe live von mvbnet.de; „Jetzt bewerben“ bleibt auf dieser Seite: Bewerbungs-Korridor in 5 Schritten (Persönliche Daten → Qualifikation → Unterlagen mit Lebenslauf, **Zeugnis 1 und 2 jeweils Vorder- und Rückseite**, Führerschein → Motivationsschreiben → Prüfen & Absenden)

Linien werden wie in **Muvit** angezeigt: Verkehrsmittel-Zeichen + Linie (`[Tram][9]`, `[Bus][73]`), mit dem Muvit-Statussystem (pünktlich grün, früher blau, leicht verspätet orange, verspätet/fällt aus rot).

Weitere Eigenschaften: kein Hineinzoomen auf der ganzen Seite (`assets/js/nozoom.js` + Viewport; die Karten zoomen trotzdem), fließende Größen für jedes Bildschirmformat, Dark Mode (automatisch oder per Mond/Sonne), Seitenwechsel wie in Train Sim Germany: Streifen fädeln ein → Thema der Seite → Streifen fädeln aus.

## Daten – echt und automatisch aktuell

| Was | Quelle |
|---|---|
| Neuigkeiten, Baustellen, Stellen | live von **mvbnet.de** (WordPress-Schnittstelle), alle 5 Minuten neu; Ersatzstand `data/news.json` |
| Störungsmeldungen | zusätzlich INSA-Verkehrsmeldungen über den Muvit-Dienst |
| Abfahrten (Echtzeit) | MVB-Echtzeit (INSA) über den Muvit-Dienst, sonst Transitous |
| Verbindungen | Transitous (MOTIS 2) |
| Liniennetz (`data/network.json`) | aus den DELFI-Fahrplandaten über Transitous gebaut: `node tools/build-network.mjs` |
| Karte | OpenFreeMap / OpenStreetMap |

Die GitHub Action **„MVB-Daten aktualisieren“** (`.github/workflows/daten.yml`) sichert alle 30 Minuten den Stand von mvbnet.de und baut montags das Liniennetz neu.

### Störungskarten genauer machen
Die Karte entsteht automatisch aus dem Meldungstext („zwischen X und Y“, Straßennamen, Linien). Für eine exakte Darstellung kann man eine Meldung in `data/umleitungen.json` überschreiben (Schlüssel = Slug der Meldung):

```json
{
  "brueckensperrung-nachtbuslinie-n4-wird-umgeleitet-2": {
    "closed": [[[11.6070, 52.1010], [11.6150, 52.1000]]],
    "cross": [[11.6110, 52.1005]],
    "detour": [{ "coords": [[11.6070, 52.1010], [11.6100, 52.1050], [11.6150, 52.1000]], "label": "Umleitung N4" }]
  }
}
```

### Bewerbungen empfangen
In `assets/js/core.js` bei `bewerbungEndpoint` die Adresse eines Formular-Empfängers eintragen (nimmt `multipart/form-data` an, z. B. ein eigener Worker). Solange das Feld leer ist, läuft die Bewerbung im Vorschau-Modus und nichts verlässt das Gerät.

## Hinweis zum Muvit-Dienst
Der Muvit-Dienst erlaubt Abfragen von `https://loris6.github.io` – die Seite muss also dort (GitHub Pages) liegen, damit die MVB-Echtzeit funktioniert. Ohne ihn nutzt die Seite Transitous.
