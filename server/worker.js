/* =====================================================================
   WELTENKÄMPFER - DER WELTWEITE SPIELERZÄHLER

   Dieser kleine Server merkt sich zwei Dinge:
     1. wie viele Konten es auf der ganzen Welt gibt
     2. wer gerade spielt

   Er bekommt nie einen Namen und nie ein Passwort zu sehen - nur eine
   zufällige Nummer je Konto. Daraus lässt sich nicht herausfinden, wer
   dahintersteckt.

   Er läuft als Cloudflare Worker und speichert in einer D1-Datenbank.
   Wie man ihn aufsetzt, steht in ANLEITUNG.md.
   ===================================================================== */

const FRIST = 90;                 // so lange gilt jemand als "spielt gerade" (Sekunden)
const ID_MUSTER = /^[A-Za-z0-9_-]{8,40}$/;   // so sehen die Konto-Nummern aus

// Jede Antwort ist JSON und darf von jeder Seite gelesen werden
const KOPF = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "no-store"
};
const antwort = (daten, status) => new Response(JSON.stringify(daten), {status: status || 200, headers: KOPF});

/* Die beiden Zahlen holen: alle Konten und wer gerade dran ist.
   Mitgezählt wird nur, wer auch als Konto bekannt ist - sonst könnten
   mehr Leute "online" sein, als es überhaupt Konten gibt.            */
async function zahlen(db, jetzt){
  const r = await db.batch([
    db.prepare("SELECT COUNT(*) AS n FROM konten"),
    db.prepare("SELECT COUNT(*) AS n FROM aktiv WHERE zeit > ? AND id IN (SELECT id FROM konten)")
      .bind(jetzt - FRIST)
  ]);
  return {gesamt: r[0].results[0].n, online: r[1].results[0].n};
}

// "Ich bin noch da" - die Uhrzeit dieses Kontos wird neu gesetzt
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
    const id = url.searchParams.get("id") || "";
    const jetzt = Math.floor(Date.now() / 1000);

    try{
      if(weg === "/ping"){
        if(!ID_MUSTER.test(id)) return antwort({fehler: "Nummer fehlt"}, 400);
        await melden(db, id, jetzt);
        // Ab und zu aufräumen: wer einen Tag lang nicht da war, fliegt raus
        if(Math.random() < 0.05)
          await db.prepare("DELETE FROM aktiv WHERE zeit < ?").bind(jetzt - 86400).run();

      } else if(weg === "/konto"){
        // Ein neues Konto anmelden. Gibt es die Nummer schon, passiert nichts -
        // darum darf das Spiel diesen Aufruf ruhig wiederholen.
        if(!ID_MUSTER.test(id)) return antwort({fehler: "Nummer fehlt"}, 400);
        await db.prepare("INSERT OR IGNORE INTO konten (id, erstellt) VALUES (?, ?)").bind(id, jetzt).run();
        await melden(db, id, jetzt);

      } else if(weg !== "/zaehler" && weg !== "/"){
        return antwort({fehler: "Diesen Weg gibt es nicht."}, 404);
      }

      return antwort(await zahlen(db, jetzt));

    }catch(fehler){
      return antwort({fehler: String(fehler && fehler.message || fehler)}, 500);
    }
  }
};
