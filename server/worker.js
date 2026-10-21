/* =====================================================================
   WELTENKÄMPFER - DER OFFIZIELLE SERVER

   Er merkt sich drei Dinge:
     1. wie viele Spieler es auf der ganzen Welt gibt
     2. wer gerade spielt
     3. das Profil jedes Spielers: Name, Stufe, Welten, Kreaturen

   Er bekommt nie ein Passwort und nie eine Welt zu sehen. Nur das, was
   im Profil stehen soll, und eine zufällige Nummer, an der er einen
   Spieler wiedererkennt.

   Er läuft als Cloudflare Worker und speichert in einer D1-Datenbank.
   Wie man ihn aufsetzt, steht in ANLEITUNG.md.
   ===================================================================== */

const FRIST = 90;                 // so lange gilt jemand als "spielt gerade" (Sekunden)
const ID_MUSTER = /^[A-Za-z0-9_-]{8,40}$/;   // so sehen die Spielernummern aus
const LISTE_MAX = 100;            // so viele Profile gibt die Liste höchstens zurück

// Jede Antwort ist JSON und darf von jeder Seite gelesen werden
const KOPF = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "no-store"
};
const antwort = (daten, status) => new Response(JSON.stringify(daten), {status: status || 200, headers: KOPF});

/* Was von aussen hereinkommt, ist erst einmal nichts wert: Namen werden
   gekürzt und von Steuerzeichen befreit, Zahlen auf einen sinnvollen
   Bereich gestutzt.                                                    */
function sauberName(roh){
  return String(roh || "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 18);
}
function sauberZahl(roh, groesstes){
  const n = Math.floor(Number(roh));
  return Number.isFinite(n) ? Math.max(0, Math.min(groesstes, n)) : 0;
}

/* Die beiden Zahlen holen: alle Spieler und wer gerade dran ist.
   Mitgezählt wird nur, wer auch als Spieler bekannt ist - sonst könnten
   mehr Leute "online" sein, als es überhaupt Spieler gibt.            */
async function zahlen(db, jetzt){
  const r = await db.batch([
    db.prepare("SELECT COUNT(*) AS n FROM konten"),
    db.prepare("SELECT COUNT(*) AS n FROM aktiv WHERE zeit > ? AND id IN (SELECT id FROM konten)")
      .bind(jetzt - FRIST)
  ]);
  return {gesamt: r[0].results[0].n, online: r[1].results[0].n};
}

// "Ich bin noch da" - die Uhrzeit dieses Spielers wird neu gesetzt
async function melden(db, id, jetzt){
  await db.prepare(
    "INSERT INTO aktiv (id, zeit) VALUES (?1, ?2) ON CONFLICT(id) DO UPDATE SET zeit = ?2"
  ).bind(id, jetzt).run();
}

export default {
  async fetch(anfrage, umgebung){
    if(anfrage.method === "OPTIONS") return new Response(null, {headers: KOPF});

    const db = umgebung.DB;
    if(!db) return antwort({fehler: "Keine Datenbank verbunden. Bindung DB fehlt."}, 500);

    const url = new URL(anfrage.url);
    const weg = url.pathname.replace(/\/+$/, "") || "/";
    const f = url.searchParams;
    const id = f.get("id") || "";
    const jetzt = Math.floor(Date.now() / 1000);
    const brauchtId = weg === "/ping" || weg === "/melden" || weg === "/konto";

    if(brauchtId && !ID_MUSTER.test(id)) return antwort({fehler: "Nummer fehlt"}, 400);

    try{
      if(weg === "/melden" || weg === "/konto"){
        /* Profil eintragen oder auffrischen. Gibt es die Nummer schon,
           werden nur die Werte überschrieben - erstellt bleibt stehen. */
        await db.prepare(
          "INSERT INTO konten (id, erstellt, name, stufe, welten, kreaturen) VALUES (?1, ?2, ?3, ?4, ?5, ?6) " +
          "ON CONFLICT(id) DO UPDATE SET name = ?3, stufe = ?4, welten = ?5, kreaturen = ?6"
        ).bind(id, jetzt, sauberName(f.get("name")), sauberZahl(f.get("stufe"), 9999),
               sauberZahl(f.get("welten"), 9999), sauberZahl(f.get("kreaturen"), 9999)).run();
        await melden(db, id, jetzt);

      } else if(weg === "/ping"){
        await melden(db, id, jetzt);
        // Ab und zu aufräumen: wer einen Tag lang nicht da war, fliegt aus der Liste
        if(Math.random() < 0.05)
          await db.prepare("DELETE FROM aktiv WHERE zeit < ?").bind(jetzt - 86400).run();

      } else if(weg === "/profile"){
        const reihen = await db.prepare(
          "SELECT k.id AS id, k.name AS name, k.stufe AS stufe, k.welten AS welten, " +
          "k.kreaturen AS kreaturen, k.erstellt AS erstellt, COALESCE(a.zeit, 0) AS zeit " +
          "FROM konten k LEFT JOIN aktiv a ON a.id = k.id " +
          "WHERE k.name <> '' ORDER BY zeit DESC LIMIT ?"
        ).bind(LISTE_MAX).all();
        // Die Nummern bleiben beim Server - nach aussen geht nur das Profil
        const spieler = (reihen.results || []).map(r => ({
          name: r.name, stufe: r.stufe, welten: r.welten, kreaturen: r.kreaturen,
          zuletzt: r.zeit, erstellt: r.erstellt,
          online: r.zeit > jetzt - FRIST,
          ich: r.id === id
        }));
        return antwort(Object.assign(await zahlen(db, jetzt), {spieler}));

      } else if(weg !== "/zaehler" && weg !== "/"){
        return antwort({fehler: "Diesen Weg gibt es nicht."}, 404);
      }

      return antwort(await zahlen(db, jetzt));

    }catch(fehler){
      return antwort({fehler: String(fehler && fehler.message || fehler)}, 500);
    }
  }
};
