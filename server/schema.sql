-- Die zwei Tabellen für den weltweiten Zähler.
-- Es werden nur zufällige Nummern gespeichert, keine Namen und keine Passwörter.

-- Jedes Konto der Welt, einmal
CREATE TABLE IF NOT EXISTS konten (
  id       TEXT PRIMARY KEY,
  erstellt INTEGER NOT NULL
);

-- Wer sich zuletzt wann gemeldet hat
CREATE TABLE IF NOT EXISTS aktiv (
  id   TEXT PRIMARY KEY,
  zeit INTEGER NOT NULL
);

-- Damit das Zählen der gerade Spielenden schnell geht
CREATE INDEX IF NOT EXISTS aktiv_zeit ON aktiv (zeit);
