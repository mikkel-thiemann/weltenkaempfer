/* =====================================================================
   WELTENKÄMPFER - DER OFFIZIELLE SERVER

   Er kann zwei Dinge:

   A) DER ZÄHLER  (/melden, /ping, /zaehler, /profile)
      Merkt sich, wie viele Spieler es gibt, wer gerade spielt und das
      Profil jedes Spielers: Name, Stufe, Welten, Kreaturen.

   B) DIE GEMEINSAME WELT  (/welt)
      Eine einzige Welt, in der alle zusammen sind. Der Server merkt
      sich, welcher Block wo verändert wurde, und sagt jedem sofort
      Bescheid, wenn jemand baut, abbaut, sich bewegt oder etwas sagt.

      Die Landschaft selbst wird nicht verschickt: jeder baut sie aus
      demselben Startwert bei sich selbst auf. Darum müssen nur die
      Änderungen über die Leitung - das ist winzig.

   Er bekommt nie ein Passwort zu sehen.

   Er läuft als Cloudflare Worker. Teil B braucht zusätzlich die
   Bindung WELT auf die Klasse "Welt" (Durable Object).
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

/* =====================================================================
   B) DIE GEMEINSAME WELT
   Ein Durable Object ist ein kleiner Server, den es nur einmal gibt.
   Alle Spieler hängen mit einer offenen Leitung (WebSocket) daran, und
   was einer schickt, bekommen alle anderen sofort.
   ===================================================================== */
const BLOCK_GRENZE = 30000;       // so viele veränderte Blöcke merkt sich die Welt
const NAME_MAX = 18, CHAT_MAX = 160;

export class Welt {
  constructor(ctx, umgebung){
    this.ctx = ctx;
    this.umgebung = umgebung;
    this.bloecke = null;          // Map "welt:index" -> Blocknummer
    this.naechsteNr = 1;
  }

  /* Die veränderten Blöcke einmal aus dem Speicher holen. Danach liegen
     sie im Arbeitsspeicher und das Nachschlagen kostet nichts mehr.    */
  async bloeckeLaden(){
    if(this.bloecke) return this.bloecke;
    const m = new Map();
    let ab = undefined;
    for(let runde = 0; runde < 60; runde++){
      const teil = await this.ctx.storage.list({prefix: "b:", limit: 1000, startAfter: ab});
      if(!teil.size) break;
      for(const [k, v] of teil){ m.set(k.slice(2), v); ab = k; }
      if(teil.size < 1000) break;
    }
    this.bloecke = m;
    return m;
  }

  // Alle offenen Leitungen ausser einer bestimmten
  senden(nachricht, ausser){
    const text = JSON.stringify(nachricht);
    for(const s of this.ctx.getWebSockets()){
      if(s === ausser) continue;
      try{ s.send(text); }catch(e){}
    }
  }
  // Was weiss ich über diese Leitung?
  wer(ws){
    try{ return ws.deserializeAttachment() || null; }catch(e){ return null; }
  }

  async fetch(anfrage){
    if(anfrage.headers.get("Upgrade") !== "websocket")
      return new Response("Hier geht es nur mit WebSocket weiter.", {status: 426});

    const paar = new WebSocketPair();
    const client = paar[0], server = paar[1];
    this.ctx.acceptWebSocket(server);

    // Eine Nummer, an der die anderen diesen Spieler erkennen
    const nr = "s" + Date.now().toString(36) + Math.floor(Math.random()*1296).toString(36);
    server.serializeAttachment({nr: nr, name: "", x: 0, y: 0, z: 0, g: 0});

    return new Response(null, {status: 101, webSocket: client});
  }

  async webSocketMessage(ws, roh){
    let n;
    try{ n = JSON.parse(roh); }catch(e){ return; }
    if(!n || typeof n.t !== "string") return;
    const ich = this.wer(ws);
    if(!ich) return;

    // ---- Anmelden: Name sagen und alles bekommen, was es schon gibt
    if(n.t === "hi"){
      ich.name = sauberName(n.name).slice(0, NAME_MAX) || "Gast";
      ich.x = +n.x || 0; ich.y = +n.y || 0; ich.z = +n.z || 0; ich.g = +n.g || 0;
      ws.serializeAttachment(ich);

      const bloecke = await this.bloeckeLaden();
      // Dieselbe Packweise wie im Spiel: je Welt "index:block" zur Basis 36
      const proWelt = {};
      for(const [k, b] of bloecke){
        const p = k.indexOf(":");
        const w = k.slice(0, p);
        (proWelt[w] = proWelt[w] || []).push(
          parseInt(k.slice(p+1), 10).toString(36) + ":" + (b|0).toString(36));
      }
      const gepackt = {};
      for(const w in proWelt) gepackt[w] = proWelt[w].join(",");

      const andere = [];
      for(const s of this.ctx.getWebSockets()){
        if(s === ws) continue;
        const a = this.wer(s);
        if(a && a.name) andere.push(a);
      }
      ws.send(JSON.stringify({t: "start", du: ich.nr, bloecke: gepackt, spieler: andere}));
      this.senden({t: "dazu", spieler: ich}, ws);
      return;
    }

    if(!ich.name) return;          // wer sich nicht gemeldet hat, darf nichts

    // ---- Wo ich gerade bin
    if(n.t === "p"){
      ich.x = +n.x || 0; ich.y = +n.y || 0; ich.z = +n.z || 0; ich.g = +n.g || 0;
      ich.b = !!n.b;               // bewegt sich gerade
      ws.serializeAttachment(ich);
      this.senden({t: "p", nr: ich.nr, x: ich.x, y: ich.y, z: ich.z, g: ich.g, b: ich.b}, ws);
      return;
    }

    // ---- Ein Block wurde gesetzt oder abgebaut
    if(n.t === "b"){
      const w = sauberZahl(n.w, 20), i = sauberZahl(n.i, 1e9), b = sauberZahl(n.b, 255);
      const schluessel = w + ":" + i;
      const bloecke = await this.bloeckeLaden();
      if(!bloecke.has(schluessel) && bloecke.size >= BLOCK_GRENZE){
        ws.send(JSON.stringify({t: "voll"}));
        return;
      }
      bloecke.set(schluessel, b);
      await this.ctx.storage.put("b:" + schluessel, b);
      this.senden({t: "b", w: w, i: i, b: b, nr: ich.nr}, ws);
      return;
    }

    // ---- Etwas gesagt
    if(n.t === "c"){
      const text = String(n.text || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, CHAT_MAX);
      if(!text) return;
      this.senden({t: "c", nr: ich.nr, name: ich.name, text: text});
      ws.send(JSON.stringify({t: "c", nr: ich.nr, name: ich.name, text: text}));
      return;
    }
  }

  async webSocketClose(ws){
    const ich = this.wer(ws);
    if(ich && ich.name) this.senden({t: "weg", nr: ich.nr}, ws);
  }
  async webSocketError(ws){
    const ich = this.wer(ws);
    if(ich && ich.name) this.senden({t: "weg", nr: ich.nr}, ws);
  }
}

/* =====================================================================
   DIE GEMEINSAME WELT ÜBER GANZ NORMALE ANFRAGEN
   Durable Objects lassen sich nur mit einem Befehl vom Computer aus
   einschalten. Damit das Zusammenspielen trotzdem heute schon geht,
   kann die Welt auch über die Datenbank laufen: jeder sagt viermal je
   Sekunde "ich bin hier" und bekommt in derselben Antwort zurück, wo
   die anderen stehen, was sich an Blöcken geändert hat und was jemand
   gesagt hat. Eine Anfrage, alles drin.
   ===================================================================== */
const WELT_FRIST = 10000;         // wer sich 10 Sekunden nicht meldet, ist weg
const CHAT_HALT = 600000;         // Gesagtes bleibt zehn Minuten stehen

async function weltSync(db, f, jetzt){
  const id = f.get("id") || "";
  if(!ID_MUSTER.test(id)) return antwort({fehler: "Nummer fehlt"}, 400);
  const name = sauberName(f.get("name")) || "Gast";
  const zahl = (s2) => { const n = Number(s2); return Number.isFinite(n) ? Math.round(n*100)/100 : 0; };
  const seit = Math.max(0, Math.min(jetzt, Math.floor(Number(f.get("seit")) || 0)));

  const schreiben = [
    db.prepare(
      "INSERT INTO weltspieler (id, name, x, y, z, g, zeit) VALUES (?1,?2,?3,?4,?5,?6,?7) " +
      "ON CONFLICT(id) DO UPDATE SET name=?2, x=?3, y=?4, z=?5, g=?6, zeit=?7"
    ).bind(id, name, zahl(f.get("x")), zahl(f.get("y")), zahl(f.get("z")), zahl(f.get("g")), jetzt)
  ];

  // Blöcke, die dieser Spieler gerade verändert hat: "welt:index:block,..."
  const roh = (f.get("b") || "").split(",").filter(Boolean).slice(0, 40);
  for(const stueck of roh){
    const teil = stueck.split(":");
    if(teil.length !== 3) continue;
    const w = sauberZahl(teil[0], 20), i = sauberZahl(teil[1], 1e9), b = sauberZahl(teil[2], 255);
    schreiben.push(db.prepare(
      "INSERT INTO weltbloecke (k, b, zeit) VALUES (?1,?2,?3) ON CONFLICT(k) DO UPDATE SET b=?2, zeit=?3"
    ).bind(w + ":" + i, b, jetzt));
  }
  // Etwas gesagt?
  const gesagt = String(f.get("c") || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, CHAT_MAX);
  if(gesagt) schreiben.push(db.prepare(
    "INSERT INTO weltchat (name, text, zeit) VALUES (?1,?2,?3)").bind(name, gesagt, jetzt));

  await db.batch(schreiben);

  // Und jetzt alles einsammeln, was der Spieler noch nicht kennt
  const lesen = await db.batch([
    db.prepare("SELECT id, name, x, y, z, g FROM weltspieler WHERE zeit > ?1 AND id <> ?2")
      .bind(jetzt - WELT_FRIST, id),
    db.prepare("SELECT k, b FROM weltbloecke WHERE zeit > ? ORDER BY zeit LIMIT 4000").bind(seit),
    db.prepare("SELECT name, text FROM weltchat WHERE zeit > ? ORDER BY zeit LIMIT 30").bind(seit)
  ]);

  // Blöcke in derselben Packweise wie im Spiel: je Welt "index:block" zur Basis 36
  const proWelt = {};
  for(const r of (lesen[1].results || [])){
    const p = r.k.indexOf(":");
    const w = r.k.slice(0, p);
    (proWelt[w] = proWelt[w] || []).push(
      parseInt(r.k.slice(p+1), 10).toString(36) + ":" + (r.b|0).toString(36));
  }
  const bloecke = {};
  for(const w in proWelt) bloecke[w] = proWelt[w].join(",");

  // Ab und zu aufräumen
  if(Math.random() < 0.02){
    await db.batch([
      db.prepare("DELETE FROM weltchat WHERE zeit < ?").bind(jetzt - CHAT_HALT),
      db.prepare("DELETE FROM weltspieler WHERE zeit < ?").bind(jetzt - 86400000)
    ]);
  }

  return antwort({
    jetzt: jetzt,
    spieler: (lesen[0].results || []).map(r => ({
      nr: r.id, name: r.name, x: r.x, y: r.y, z: r.z, g: r.g
    })),
    bloecke: bloecke,
    chat: (lesen[2].results || []).map(r => ({name: r.name, text: r.text}))
  });
}

export default {
  async fetch(anfrage, umgebung){
    if(anfrage.method === "OPTIONS") return new Response(null, {headers: KOPF});

    const url = new URL(anfrage.url);
    const weg = url.pathname.replace(/\/+$/, "") || "/";

    // ---- Die gemeinsame Welt läuft über eine offene Leitung
    if(weg === "/welt"){
      if(!umgebung.WELT) return antwort({fehler: "Die gemeinsame Welt ist nicht eingerichtet. Bindung WELT fehlt."}, 500);
      if(anfrage.headers.get("Upgrade") !== "websocket")
        return antwort({fehler: "Hier geht es nur mit WebSocket weiter."}, 426);
      const kennung = umgebung.WELT.idFromName("welt1");
      return umgebung.WELT.get(kennung).fetch(anfrage);
    }

    // ---- Alles andere braucht die Datenbank
    const db = umgebung.DB;
    if(!db) return antwort({fehler: "Keine Datenbank verbunden. Bindung DB fehlt."}, 500);

    const f = url.searchParams;
    if(weg === "/welt/sync"){
      try{ return await weltSync(db, f, Date.now()); }
      catch(fehler){ return antwort({fehler: String(fehler && fehler.message || fehler)}, 500); }
    }
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
