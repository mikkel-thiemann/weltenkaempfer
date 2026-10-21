# Der weltweite Spielerzähler – Schritt für Schritt

Damit dein Spiel zeigen kann, **wie viele Konten es auf der ganzen Welt gibt**
und **wer gerade spielt**, braucht es einen kleinen Server im Internet.
Den richtest du hier ein. Es ist **gratis** und du brauchst **nichts zu
installieren** – alles geht auf der Cloudflare-Webseite.

Rechne mit etwa **15 Minuten**.

---

## Schritt 1 – Cloudflare-Konto anlegen

1. Geh auf **https://dash.cloudflare.com/sign-up**
2. E-Mail und Passwort eingeben, Konto bestätigen.
3. Du brauchst **keine Kreditkarte**. Wähle überall den **Free**-Tarif.

---

## Schritt 2 – Die Datenbank anlegen

1. Links im Menü auf **Storage & Databases** → **D1 SQL Database**.
2. Knopf **Create** (oder *Create database*).
3. Als Namen genau das hier eintragen:

   ```
   weltenkaempfer
   ```

4. Auf **Create** klicken.

---

## Schritt 3 – Die Tabellen anlegen

1. Klick auf deine neue Datenbank **weltenkaempfer**.
2. Oben auf den Reiter **Console**.
3. Öffne hier im Ordner die Datei **`schema.sql`**, kopiere **alles** daraus
   und füge es in die Console ein.
4. Auf **Execute** klicken.

Es sollte „Success“ oder eine leere Antwort kommen. Fehler? Dann war etwas
beim Kopieren verloren – nochmal alles markieren und einfügen.

---

## Schritt 4 – Den Server anlegen

1. Links im Menü auf **Compute (Workers)** → **Workers & Pages**.
2. Knopf **Create** → **Start with Hello World!** (oder *Create Worker*).
3. Als Namen genau das hier eintragen:

   ```
   weltenkaempfer-zaehler
   ```

4. Auf **Deploy** klicken. (Noch steht nur Beispiel-Code drin, das ist ok.)

---

## Schritt 5 – Meinen Code einsetzen

1. Auf deinem neuen Worker auf **Edit code** (oder **`</>` Edit**).
2. Im Editor **alles markieren und löschen** (Strg + A, dann Entf).
3. Öffne hier im Ordner die Datei **`worker.js`**, kopiere **alles** daraus
   und füge es in den Editor ein.
4. Oben rechts auf **Deploy**.

---

## Schritt 6 – Datenbank und Server verbinden

Das ist der wichtigste Schritt – ohne ihn findet der Server die Datenbank nicht.

1. Geh zurück zu deinem Worker (**Workers & Pages** → **weltenkaempfer-zaehler**).
2. Reiter **Settings** → **Bindings** → **Add** → **D1 database**.
3. Trag ein:
   - **Variable name:** `DB`  ← **genau so, groß geschrieben**
   - **D1 database:** `weltenkaempfer` auswählen
4. **Deploy** / **Save**.

---

## Schritt 7 – Testen

Oben bei deinem Worker steht seine Adresse. Sie sieht ungefähr so aus:

```
https://weltenkaempfer-zaehler.DEIN-NAME.workers.dev
```

Öffne im Browser diese Adresse mit `/zaehler` hinten dran:

```
https://weltenkaempfer-zaehler.DEIN-NAME.workers.dev/zaehler
```

Richtig ist, wenn so etwas erscheint:

```json
{"gesamt":0,"online":0}
```

**Kommt stattdessen `{"fehler":"Keine Datenbank verbunden. Bindung DB fehlt."}`?**
Dann stimmt Schritt 6 noch nicht – der Variablenname muss genau `DB` sein.

---

## Schritt 8 – Mir die Adresse schicken

Schreib mir im Chat:

> Meine Server-Adresse ist https://weltenkaempfer-zaehler.DEIN-NAME.workers.dev

Dann baue ich sie ins Spiel ein und der Zähler oben zählt ab sofort **alle
Spieler auf der Welt**.

---

## Was der Server speichert

Nur dein **Profil** – also das, was andere Spieler sehen sollen:

| Was | Beispiel |
|---|---|
| eine zufällige Nummer je Spieler | `w7f3b9a2c1d8` |
| dein Spielername | `Mikkel` |
| deine höchste Stufe | `12` |
| wie viele Welten du hast | `3` |
| wie viele Kreaturen du gefangen hast | `41` |
| wann du zuletzt gespielt hast | `1792617000` |

**Nicht** gespeichert werden: dein Passwort, deine Welten und alles,
was du gebaut hast. Das bleibt nur auf deinem eigenen Gerät.

Die Nummer verlässt den Server nie – in der Spielerliste stehen nur
Name und Spielstände.

⚠️ **Dein Spielername wird für alle sichtbar**, die das Spiel öffnen.
Nimm darum einen Spitznamen und nicht deinen vollen echten Namen.

## Kostet das etwas?

Nein. Der Gratis-Tarif erlaubt 5 Millionen Lesezugriffe und 100 000
Schreibzugriffe pro Tag. Ein Spieler braucht etwa **60 Schreibzugriffe pro
Stunde**. Selbst mit hundert Spielern gleichzeitig bist du weit darunter.
