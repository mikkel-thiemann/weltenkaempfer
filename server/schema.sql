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

-- ---- Die gemeinsame Welt ----
-- Wer wo steht
CREATE TABLE IF NOT EXISTS weltspieler (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  x    REAL NOT NULL DEFAULT 0,
  y    REAL NOT NULL DEFAULT 0,
  z    REAL NOT NULL DEFAULT 0,
  g    REAL NOT NULL DEFAULT 0,
  zeit INTEGER NOT NULL DEFAULT 0
);

-- Jeder Block, den jemand verändert hat
CREATE TABLE IF NOT EXISTS weltbloecke (
  k    TEXT PRIMARY KEY,          -- "welt:index"
  b    INTEGER NOT NULL,
  zeit INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS weltbloecke_zeit ON weltbloecke (zeit);

-- Was gesagt wurde
CREATE TABLE IF NOT EXISTS weltchat (
  nr   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  zeit INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS weltchat_zeit ON weltchat (zeit);
