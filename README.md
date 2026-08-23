# ⚔️ Weltenkämpfer Blockwelt

Ein Voxel-Rollenspiel im Browser — bauen, graben, kämpfen und durch elf Welten reisen.
Alles steckt in **einer einzigen HTML-Datei**: keine Installation, keine Bibliotheken, kein Server.

**▶ [Hier spielen](https://mikkel-thiemann.github.io/weltenkaempfer/)**

## Was das Spiel kann

- **Echte 3D-Blockwelt** mit selbstgeschriebener WebGL-Engine — 192 × 192 Blöcke, 56 hoch
- **Überlebensmodus**: Du fängst mit leeren Händen an. Blöcke abbauen dauert Zeit, das Material landet im Inventar, setzen kannst du nur, was du hast.
- **Werkbank mit 3×3-Gitter** wie im Original: Muster legen, Schwerter, Äxte und Spitzhacken in zwölf Stufen schmieden
- **Elf Welten**, jede mit eigenen Blöcken, Gegnern, Quests und Boss
- **Mehrere Spielstände** nebeneinander, jeder mit eigenem Startwert — gleicher Startwert, gleiche Landschaft
- **Rundenkämpfe** mit Angriff, Feuerball, Heilzauber und Tränken
- Alles Gebaute wird gespeichert, in jeder Welt getrennt

## Die Welten

| # | Welt | Boss |
|---|---|---|
| 1 | 🌲 Grünwald | 👹 Waldtroll |
| 2 | 🌸 Kirschblütenhain | 🦌 Blütenwächter |
| 3 | 🌋 Feuerwüste | 🐉 Lavadrache |
| 4 | 🌑 Schattenreich | 💀 Schattenfürst |
| 5 | 🌵 Dornenwüste | 👑 Dornenkönig |
| 6 | 🌴 Dschungeltiefe | 🌿 Uralte Ranke |
| 7 | 🐸 Seuchensumpf | 🦎 Seuchenmolch |
| 8 | ❄️ Ewiges Eis | 🧊 Frostkoloss |
| 9 | 🍄 Pilzland | 🕸️ Sporenmutter |
| 10 | 🟡 Schwefelhöhle | 🐲 Schwefelwyrm |
| 11 | 🌫️ Seelengarten | 👁️ Hüter der Seelen |

## Steuerung

| Taste | Wirkung |
|---|---|
| `W` `A` `S` `D` | Laufen |
| Leertaste | Springen |
| `Shift` | Rennen |
| Maus | Umsehen (einmal klicken, dann fängt das Spiel die Maus) |
| Linke Maustaste **halten** | Block abbauen |
| Rechtsklick | Block setzen |
| `1`–`9` / Mausrad | Material wählen |
| `E` | Werkbank, Lagerfeuer oder Portal benutzen |
| `Q` | Quests |
| `I` | Inventar und Herstellen |
| `Esc` | Maus freigeben |

Auf dem Handy erscheinen Knöpfe zum Laufen, Wischen auf der rechten Bildhälfte dreht die Kamera.

## Selbst öffnen

`index.html` herunterladen und doppelklicken. Mehr braucht es nicht — das Spiel läuft auch ohne Internet.

## Dateien

- `index.html` — das ganze Spiel
- `weltenkaempfer-web.html` — dieselbe Fassung ohne Rahmen-Tags, zum Einbetten
- `index-2d-alt.html` — die allererste 2D-Fassung, aus Nostalgie aufgehoben

## Skins

Im Spiel kannst du unter **✏️ Name & Skin** aus mitgelieferten Skins wählen
oder ein eigenes Skin-Bild laden (64 × 64 PNG, ganz alte 64 × 32 gehen auch).
Das Bild bleibt auf deinem Gerät und wird nirgendwohin geschickt.

Die mitgelieferten Skins liegen als PNG im Ordner `skins/`. Sie stammen von
Skin-Seiten und wurden von anderen Leuten gemacht — die Dateinamen weisen auf
die Vorlage hin. Wer eigene beisteuern will: PNG in den Ordner legen und im
Spiel in `SKIN_SAMMLUNG` eintragen.
