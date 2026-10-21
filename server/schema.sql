-- Die zwei Tabellen für den offiziellen Server.
-- Gespeichert wird nur das, was im Profil stehen soll - nie ein Passwort
-- und nie eine Welt.

-- Jeder Spieler der Welt, einmal, mit seinem Profil
CREATE TABLE IF NOT EXISTS konten (
  id        TEXT PRIMARY KEY,              -- zufällige Nummer, kein Name
  erstellt  INTEGER NOT NULL,
  name      TEXT    NOT NULL DEFAULT '',
  stufe     INTEGER NOT NULL DEFAULT 0,
  welten    INTEGER NOT NULL DEFAULT 0,
  kreaturen INTEGER NOT NULL DEFAULT 0
);

-- Wer sich zuletzt wann gemeldet hat
CREATE TABLE IF NOT EXISTS aktiv (
  id   TEXT PRIMARY KEY,
  zeit INTEGER NOT NULL
);

-- Damit das Zählen der gerade Spielenden schnell geht
CREATE INDEX IF NOT EXISTS aktiv_zeit ON aktiv (zeit);
