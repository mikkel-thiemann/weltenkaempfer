// Built from ../index.html - the same models and ball pictures as in the game.
const MOB_EINHEIT = 1/16;
function artUV(nr){ return [((nr % 4) + 0.5)/4, (Math.floor(nr/4) + 0.5)/2]; }

/* ---------- Kästen bauen ---------- */
/* Ein Kasten darf schräg stehen. Gedreht wird um seinen eigenen
   Ankerpunkt, in der Reihenfolge X, Y, Z - so wie es die Modelle in
   Minecraft-Mods auch machen. Ohne Drehung kostet es nichts.        */
let artDrehung = null;          // [rx, ry, rz] in Grad
let artAnker = null;            // Punkt, um den gedreht wird
function artPunkt(x, y, z){
  if(!artDrehung) return [x, y, z];
  const a = artAnker || [0, 0, 0];
  let px = x - a[0], py = y - a[1], pz = z - a[2];
  const g = Math.PI/180;
  const rx = artDrehung[0]*g, ry = artDrehung[1]*g, rz = artDrehung[2]*g;
  if(rx){ const c = Math.cos(rx), si = Math.sin(rx);
          const ny = py*c - pz*si, nz = py*si + pz*c; py = ny; pz = nz; }
  if(ry){ const c = Math.cos(ry), si = Math.sin(ry);
          const nx = px*c + pz*si, nz = -px*si + pz*c; px = nx; pz = nz; }
  if(rz){ const c = Math.cos(rz), si = Math.sin(rz);
          const nx = px*c - py*si, ny = px*si + py*c; px = nx; py = ny; }
  return [px + a[0], py + a[1], pz + a[2]];
}
function artFlaeche(aus, ecken, farbe, licht, teil){
  const uv = artUV(farbe);
  for(const i of [0,1,2, 0,2,3]){
    const e = artPunkt(ecken[i][0], ecken[i][1], ecken[i][2]);
    aus.push(e[0]*MOB_EINHEIT, e[1]*MOB_EINHEIT, e[2]*MOB_EINHEIT, uv[0], uv[1], licht, teil || 0);
  }
}
function artKasten(aus, x0, y0, z0, w, h, d, farbe, teil, bauchFarbe, dreh){
  artDrehung = (dreh && (dreh[0] || dreh[1] || dreh[2])) ? dreh : null;
  artAnker = artDrehung ? [x0 + w/2, y0, z0 + d/2] : null;
  const x1 = x0+w, y1 = y0+h, z1 = z0+d;
  const unten = bauchFarbe === undefined ? farbe : bauchFarbe;
  artFlaeche(aus, [[x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0]], farbe, 1.00, teil);
  artFlaeche(aus, [[x0,y0,z1],[x0,y0,z0],[x1,y0,z0],[x1,y0,z1]], unten, 0.45, teil);
  artFlaeche(aus, [[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]], farbe, 0.72, teil);
  artFlaeche(aus, [[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]], farbe, 0.72, teil);
  artFlaeche(aus, [[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]], farbe, 0.92, teil);
  artFlaeche(aus, [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]], farbe, 0.62, teil);
  artDrehung = null; artAnker = null;
}

/* ---------- Die Baupläne ----------
   Alle Maße in Texturpixeln, sechzehn davon sind ein Block. Der
   Ursprung liegt zwischen den Füßen, vorne ist -z.
   Teil 0 steht still, 1 und 2 sind die Beinpaare über Kreuz,
   3 und 4 die Flügel, die auf und ab schlagen.                        */
/* Farben: 0 Haupt, 1 Dunkel, 2 Hell, 3 Akzent, 4 Bauch, 5 Auge, 6 Weiß, 7 Akzent dunkel.
   Die Figuren sind bewusst kopflastig gebaut - großer Kopf, kleiner
   Körper, große Augen. Das ist der Kniff, der aus einem Klotz eine
   Kreatur macht. Augen stehen ein Stück vor dem Gesicht, sonst
   verschwinden sie in der Fläche.                                    */
function augen(k, y, z, breit, abstand){
  const b = breit || 3;
  k(-abstand-b, y, z, b, b, 0.8, 6, 0);            // Weiß links
  k(abstand,    y, z, b, b, 0.8, 6, 0);            // Weiß rechts
  k(-abstand-b+0.6, y+0.5, z-0.5, b-1.2, b-1.2, 0.8, 5, 0);   // Pupille
  k(abstand+0.6,    y+0.5, z-0.5, b-1.2, b-1.2, 0.8, 5, 0);
}
/* =====================================================================
   DIE ZWANZIG KREATUREN-REIHEN
   Jede Reihe hat drei Stufen - klein, mittel, groß - und ein eigenes
   Modell aus Kästen. Die Stufe bestimmt, wie groß das Tier ist und was
   dazukommt: Blätter werden zum Busch, Stummelhörner zum Geweih.
   Jede Art trägt ihre eigenen acht Farben:
   0 Haupt, 1 Dunkel, 2 Hell, 3 Akzent, 4 Bauch, 5 Auge, 6 Weiß, 7 Akzent dunkel.
   ===================================================================== */

/* Ein Vierbeiner aus Rumpf, Kopf, Schnauze, Augen und vier Beinen.
   Gibt die wichtigsten Punkte zurück, damit man Ohren, Hörner, Blätter
   und Flammen genau an die richtige Stelle setzen kann.              */
function rbVier(k, m, p){
  const L = p.L, bw = p.bw, bh = p.bh, bl = p.bl;
  const lw = p.lw || Math.max(2, bw*0.3);
  k(-bw/2, L, -bl/2, bw, bh, bl, p.fk === undefined ? 0 : p.fk, 0, 4);
  if(p.bauch !== false) k(-bw/2+0.6, L-0.4, -bl/2+0.8, bw-1.2, 1.4, bl-1.6, 4, 0, 4);
  const hw = p.hw, hh = p.hh, hd = p.hd;
  const ky = L + bh - hh*(p.kopfTief === undefined ? 0.3 : p.kopfTief) + (p.kopfHoch || 0);
  const kz = -bl/2 - hd + (p.kopfIn === undefined ? 2 : p.kopfIn);
  if(p.kopfHoch)                                                   // Hals bis zum Kopf
    k(-Math.min(bw, hw)*0.3, L + bh*0.5, -bl/2 - 1, Math.min(bw, hw)*0.6, ky - L - bh*0.5 + 2, 4, p.fk === undefined ? 0 : p.fk, 0, 4);
  k(-hw/2, ky, kz, hw, hh, hd, p.kk === undefined ? 0 : p.kk, 0, 4);
  let vorn = kz;
  if(p.sn){
    const [sw, sh, sd] = p.sn;
    k(-sw/2, ky + 0.3, kz - sd, sw, sh, sd, p.snf === undefined ? 4 : p.snf, 0, 4);
    k(-0.9, ky + 0.3 + sh - 1.1, kz - sd - 0.5, 1.8, 1.1, 0.8, 5, 0);      // Nase
    vorn = kz - sd;
  }
  const eb = p.eb || Math.max(2.2, hw*0.27);
  augen(k, ky + hh*(p.augeY || 0.42), kz - 0.4, eb, p.ea === undefined ? hw*0.1 : p.ea);
  const bx = bw/2 - lw - (p.beinEin === undefined ? 0.2 : p.beinEin);
  const vz = -bl/2 + 0.4, hz = bl/2 - lw - 0.4;
  for(const [x, z, t] of [[-bx-lw, vz, 1], [bx, hz, 1], [bx, vz, 2], [-bx-lw, hz, 2]]){
    k(x, 0.9, z, lw, L + 0.1, lw, p.bf === undefined ? 1 : p.bf, t);
    k(x-0.25, 0, z-0.5, lw+0.5, 1.2, lw+0.7, p.pf === undefined ? 7 : p.pf, t);
  }
  m.beinY = L;
  return {ky:ky, kz:kz, kh:hh, kw:hw, kd:hd, kopfOben:ky+hh, rOben:L+bh, hinten:bl/2,
          vornRumpf:-bl/2, vorn:vorn, L:L, bw:bw, bl:bl};
}
// Zwei gleiche Kästen links und rechts, gespiegelt samt Kippung
function rbPaar(k, x, y, z, w, h, d, f, teil, dreh){
  const r = dreh || [0, 0, 0];
  k(-x-w, y, z, w, h, d, f, teil ? teil[0] : 0, f, [r[0], -r[1], -r[2]]);
  k(x, y, z, w, h, d, f, teil ? teil[1] : 0, f, r);
}
// Spitze Ohren oben auf dem Kopf
function rbOhren(k, a, w, h, f, innen, kipp){
  const x = a.kw/2 - w - 0.2, y = a.kopfOben - 0.6, z = a.kz + a.kd*0.35;
  rbPaar(k, x, y, z, w, h, Math.max(1.2, w*0.55), f, null, [-10, 0, -(kipp === undefined ? 14 : kipp)]);
  if(innen !== undefined)
    rbPaar(k, x + w*0.25, y + 0.5, z - 0.3, w*0.5, h*0.6, 0.6, innen, null, [-10, 0, -(kipp === undefined ? 14 : kipp)]);
}
// Eine Kette von Kästen, jeder ein Stück weiter - ergibt Schwänze, Hälse und Geweihe
function rbKette(k, x, y, z, glieder){
  for(const [w, h, d, dy, dz, f, dx] of glieder){
    k(x - w/2, y, z, w, h, d, f, 0, f);
    y += dy; z += dz; x += dx || 0;
  }
}
// Kristall: ein hoher schmaler Kasten mit hellerer Spitze
function rbKristall(k, x, y, z, b, h, f, spitze, dreh){
  k(x - b/2, y, z - b/2, b, h, b, f, 0, f, dreh);
  k(x - b*0.3, y + h - 0.2, z - b*0.3, b*0.6, h*0.3, b*0.6, spitze, 0, spitze, dreh);
}

const REIHEN = {
  /* 001 Mossleaf - der Waldspross: Welpe mit Keimling, Hund mit
     Blättermähne, massiger Moosbär mit einem Baum auf dem Rücken.  */
  mossleaf: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(3,5,7), lw:v(2.4,3,4.8), bw:v(6.5,8.5,14), bh:v(5,7,11), bl:v(7,11,16),
      hw:v(8.5,9,11), hh:v(7.5,8,9.5), hd:v(7,8,9), sn:v(null,[4.6,3,2.6],[6.4,4,3]),
      kopfTief:v(0.15,0.3,0.6), bf:v(1,1,3), pf:v(7,7,7)});
    if(s === 0){
      k(-0.5, a.kopfOben, a.kz + 3, 1, 2.4, 1, 3, 0);                          // Keimling
      k(-3.4, a.kopfOben + 2, a.kz + 2.6, 3, 0.9, 2, 2, 0, 2, [0, 0, -18]);
      k(0.4, a.kopfOben + 2, a.kz + 2.6, 3, 0.9, 2, 2, 0, 2, [0, 0, 18]);
      k(-1, a.rOben - 1, a.hinten - 1, 2, 2, 3, 2, 0, 2, [-30, 0, 0]);          // Blattschwanz
      rbOhren(k, a, 2, 2.2, 1);
    } else if(s === 1){
      rbOhren(k, a, 2.4, 3.6, 2, 1);
      for(let i = 0; i < 4; i++)                                                  // Blättermähne
        k(-3 + (i % 2)*0.6, a.rOben - 0.5 + (i < 2 ? 1 : 0), a.vornRumpf - 1 + i*2.4, 5.4, 2.2, 2.6, i % 2 ? 1 : 2, 0, 1, [-18, 0, 0]);
      rbKette(k, 0, a.rOben - 2, a.hinten - 1, [[3,3,3,1.5,2.4,0],[3,3,3,1.8,2,2],[2.4,1.4,4,0,0,1]]);
    } else {
      rbOhren(k, a, 2.6, 2.4, 1);
      k(-6.5, a.rOben - 1, -6, 13, 2.2, 12, 2, 0, 1);                             // Moosdecke
      for(const [x, z] of [[-6.6, -4], [5.2, -1], [-6.4, 3], [5, 5]])
        k(x, a.rOben - 5, z, 1.4, 4.5, 2.6, 1, 0, 1);                             // Moos hängt herab
      k(-1.8, a.rOben, -1.5, 3.6, 8, 3.6, 3, 0, 7);                               // Stamm
      k(-6, a.rOben + 6.5, -5.5, 12, 6, 11, 0, 0, 1);                             // Krone
      k(-4.5, a.rOben + 12, -4, 9, 3.6, 8, 2, 0, 0);
      k(-7.2, a.rOben + 7.6, -2.2, 3, 3, 5, 2, 0, 1);
      k(4.2, a.rOben + 7.6, -3, 3, 3.6, 5, 1, 0, 1);
      k(-2, a.rOben + 15, -1.5, 4, 2.2, 3.6, 2, 0, 2);
    }
  },

  /* 002 Aquabobble - die Süßwasserquelle: Kätzchen mit Blasenschwanz,
     Fuchs mit Flossenohren, schlankes Wasserross mit Wellenmähne.  */
  aquabobble: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(3,6,11), lw:v(2.2,2.6,3.4), bw:v(6,7,9), bh:v(5,6,8.5), bl:v(7,11,15),
      hw:v(8.5,8,8.5), hh:v(7.5,7.5,8), hd:v(7,7.5,8.5), sn:v(null,[3.8,2.6,2.6],[4.6,3.2,4]),
      kopfTief:v(0.2,0.2,0), kopfHoch:v(0,1.5,6), bf:v(0,0,0), pf:v(7,7,4)});
    rbOhren(k, a, v(2.2,2.6,2.4), v(2.6,4.4,3.8), v(0,2,2), v(3,3,undefined), v(14,24,20));
    if(s === 0){
      rbKette(k, 0, a.rOben - 2, a.hinten - 0.5, [[2,2,3,1.6,2.4,0],[2,2,2.6,0.8,2,0]]);
      k(-2.2, a.rOben + 0.6, a.hinten + 3.6, 4.4, 4.4, 4.4, 2, 0, 2);          // Wasserblase
      k(-1.2, a.rOben + 3.2, a.hinten + 3.2, 1.4, 1.2, 0.6, 6, 0);
    } else if(s === 1){
      k(-0.8, a.rOben, a.vornRumpf + 1, 1.6, 2.4, 7, 3, 0, 3);                   // Rückenflosse
      rbKette(k, 0, a.rOben - 2, a.hinten - 0.5, [[2.6,2.6,3,1.4,2.4,0],[2.4,2.4,3,1.6,2.4,2],[1.2,5,4,0,0,3]]);
      k(-2, a.rOben + 2.5, a.hinten + 6.2, 4, 4, 4, 2, 0, 2);
    } else {
      for(let i = 0; i < 6; i++)                                                  // Wellenmähne aus Würfeln
        k(-1.6 + (i % 2)*0.4, a.kopfOben - 1 - i*2.2, a.kz + a.kd - 1 + i*1.8, 3.2 - (i % 2)*0.8, 3.2, 3.2, i % 3 === 2 ? 6 : (i % 2 ? 3 : 2), 0, 2);
      rbKette(k, 0, a.rOben - 3, a.hinten - 0.5, [[3,3,3.4,1.2,2.6,3],[3.4,3.4,3.4,1.8,2.2,2],[2.6,2.6,2.6,2,1.4,6],[3.6,3.6,3.6,0,0,2]]);
      k(-2.4, a.L + 1, a.hinten - 5, 4.8, 3, 1, 3, 0);                            // Wasserstreifen
    }
  },

  /* 003 Stonkitt - die Felskatze: Kätzchen, Katze mit Steinplatten,
     große Felsenkatze mit Panzer aus Gestein.                      */
  stonkitt: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(3,5,8), lw:v(2.2,2.8,4.2), bw:v(6,8,12), bh:v(5,6.5,10), bl:v(7,11,16),
      hw:v(8.5,9,11), hh:v(7.5,7.5,9), hd:v(7,7.5,9), sn:v([3.6,2.4,1.6],[4.4,2.8,2],[6,3.6,2.6]),
      kopfTief:v(0.2,0.25,0.35), bf:v(0,4,4), pf:v(4,4,7)});
    rbOhren(k, a, v(2.4,2.8,3.2), v(2.8,3.4,3.6), 0, 1, 12);
    k(-a.kw/2 + 0.6, a.kopfOben - 1.8, a.kz - 0.2, 2.6, 1.2, 0.5, 2, 0);          // Wangenstreifen
    k(a.kw/2 - 3.2, a.kopfOben - 1.8, a.kz - 0.2, 2.6, 1.2, 0.5, 2, 0);
    if(s === 0){
      rbKette(k, 0, a.rOben - 1.5, a.hinten - 0.5, [[1.8,1.8,2.6,2,1.6,0],[1.8,2.6,1.8,2.4,0.4,0],[1.8,1.8,1.8,0,0,1]]);
    } else {
      const n = v(0, 3, 5);
      for(let i = 0; i < n; i++)                                                  // Steinplatten
        k(-a.bw/2 + 0.8 + (i % 2), a.rOben - 0.4, a.vornRumpf + 1 + i*(a.bl - 2)/n, a.bw - 1.6 - (i % 2)*2, v(0,1.8,2.8), (a.bl - 2)/n - 0.4, i % 2 ? 7 : 3, 0, 7);
      rbKette(k, 0, a.rOben - 2, a.hinten - 0.5, s === 1
        ? [[2.4,2.4,3,2.2,2,0],[2.4,3,2.4,2.6,0.6,3],[2.2,2.2,2.2,0,0,0]]
        : [[3.2,3.2,3.4,2.6,2.2,0],[3.4,3.8,3,3,0.6,3],[3,3,3,2.6,-0.6,7],[3.4,3,3,0,0,3]]);
      if(s === 2){
        k(-7, a.L + 2, -4, 2, 5, 6, 3, 0, 7);                                     // Felsen an den Schultern
        k(5, a.L + 2, -4, 2, 5, 6, 3, 0, 7);
        k(-1.6, a.kopfOben - 0.5, a.kz + 1.5, 3.2, 2.4, 4, 3, 0, 7);
      }
    }
  },

  /* 004 Flarenk - die Glutechse: Fuchswelpe mit Flammenschwanz,
     roter Glutfuchs, dunkler Feuerhirsch mit Flammenring.         */
  flarenk: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(3,5.5,10), lw:v(2.2,2.6,3.4), bw:v(6,7.5,10), bh:v(5,6.5,9), bl:v(7,12,16),
      hw:v(8.5,8.5,9.5), hh:v(7.5,7.5,8.5), hd:v(7,8,9), sn:v([3.8,2.6,2],[4.4,3,3],[5,3.4,4]),
      kopfTief:v(0.2,0.25,0), kopfHoch:v(0,0,4), bf:v(1,1,1), pf:v(1,1,3)});
    rbOhren(k, a, v(2.4,2.6,2.2), v(3.2,4,3), 0, v(4,4,3), 16);
    if(s === 0){
      rbKette(k, 0, a.rOben - 2, a.hinten - 0.5, [[2.2,2.2,2.4,1.8,1.8,0],[2.6,2.6,2.6,1.8,0.6,3],[1.8,2,1.8,0,0,2]]);
      k(-1, a.kopfOben, a.kz + 2, 2, 1.6, 2, 3, 0);                               // Glutfleck
    } else if(s === 1){
      for(let i = 0; i < 3; i++)                                                  // Flammen auf dem Rücken
        k(-1.2, a.rOben - 0.2, a.vornRumpf + 2 + i*3.4, 2.4, 2.6 - i*0.4, 2.4, i % 2 ? 2 : 3, 0, 3);
      rbKette(k, 0, a.rOben - 2, a.hinten - 0.5, [[2.6,2.6,3,2,2,0],[3,3.4,3,2.4,0.8,3],[2.6,3,2.6,2,-0.4,2],[1.6,2.4,1.6,0,0,6]]);
    } else {
      // Flammenmähne und ein glühender Ring hinter dem Rücken
      for(let i = 0; i < 5; i++)
        k(-1.8, a.kopfOben - 2 - i*1.8, a.kz + a.kd - 1 + i*1.6, 3.6, 3.4, 2.8, i % 2 ? 2 : 3, 0, 3);
      const cy = a.rOben + 6, cz = a.hinten - 1, R = 6;
      for(let i = 0; i < 12; i++){
        const w = i/12*Math.PI*2;
        k(-1.1, cy + Math.sin(w)*R - 1.1, cz + Math.cos(w)*R - 1.1, 2.2, 2.2, 2.2, i % 3 ? 3 : 2, 0, 3);
      }
      rbKette(k, 0, a.rOben - 2.5, a.hinten - 0.5, [[3,3,3.4,1.6,2.4,1],[3,3,3,1.8,2,3],[2.4,2.4,2.4,0,0,2]]);
      rbPaar(k, 1.2, a.kopfOben - 0.4, a.kz + 2.6, 1.4, 4.6, 1.4, 7, null, [-20, 0, -20]);  // Hörner
    }
  },

  /* 005 Zephydeer - der Bergwind: Rehkitz, junger Hirsch mit kleinem
     Geweih, stolzer Himmelshirsch mit weitem Geweih.              */
  zephydeer: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(4,7,12), lw:v(2,2.4,3), bw:v(5.5,6.5,9), bh:v(5,6,8.5), bl:v(7,11,15),
      hw:v(7.5,7.5,8.5), hh:v(7,7,8), hd:v(7,8,9), sn:v([3.4,2.4,2],[4,2.8,3],[4.6,3.2,4]),
      kopfTief:v(0.1,0,0), kopfHoch:v(1,3,6), bf:v(0,0,0), pf:v(7,7,7)});
    rbOhren(k, a, 2.2, v(2.4,2.8,3), 0, 4, 60);
    for(const [x, z] of [[-2, -2], [1.4, 1.6], [-1.6, 3.4]])                      // helle Flecken
      if(a.bw > 5) k(x, a.rOben - 0.5, z * a.bl/12, 1.6, 0.8, 1.6, 6, 0);
    k(-1.4, a.rOben - 2, a.hinten - 0.4, 2.8, 2.4, 1.8, 6, 0, 6);                  // Stummelschwanz
    if(s >= 1){
      const h = v(0, 5, 13), top = a.kopfOben - 0.5;
      for(const seite of [-1, 1]){
        const x0 = seite*1.6;
        const glieder = s === 1
          ? [[1.2,h*0.6,1.2, h*0.6,0,3, seite*0.8],[1.2,h*0.5,1.2,0,0,2, 0]]
          : [[1.4,h*0.4,1.4, h*0.4,0.6,3, seite*1.2],[1.4,h*0.35,1.4, h*0.3,0.4,3, seite*1.6],
             [1.4,h*0.35,1.4, h*0.35,0.2,3, seite*1.4],[1.2,h*0.3,1.2,0,0,2,0]];
        rbKette(k, x0, top, a.kz + 2.5, glieder);
        if(s === 2){
          k(x0 + seite*2 - 0.6, top + h*0.45, a.kz + 0.4, 1.2, h*0.35, 1.2, 3, 0, 3, [-30, 0, 0]);  // Sprossen
          k(x0 + seite*4.4 - 0.6, top + h*0.8, a.kz + 1.2, 1.2, h*0.35, 1.2, 2, 0, 2, [-30, 0, 0]);
          k(x0 + seite*3.6 - 0.6, top + h*0.7, a.kz + 4.2, 1.2, h*0.3, 1.2, 3, 0, 3, [30, 0, 0]);
        }
      }
    }
    if(s === 2){                                                                   // Windwirbel an den Beinen
      k(-6.5, a.L - 3, -5, 1, 1, 5, 6, 0); k(5.5, a.L - 5, 3, 1, 1, 5, 6, 0);
    }
  },

  /* 006 Shadwisp - der Zwielichtgeist: rundes Schattenkätzchen mit
     leuchtenden Augen, Schattenkatze, dunkles Wesen mit langen Hörnern. */
  shadwisp: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(2.5,5,9), lw:v(2.4,2.6,3.4), bw:v(7,8,10), bh:v(6,6.5,9), bl:v(7,11,15),
      hw:v(9.5,9,10), hh:v(8.5,8,9), hd:v(8,8,9), sn:v(null,null,[4.4,3,3]),
      kopfTief:v(0.1,0.25,0.1), kopfHoch:v(0,0,3), bf:v(1,1,1), pf:v(1,7,7), eb:v(3,2.8,2.6)});
    rbOhren(k, a, v(2.6,2.6,2), v(3,4,2.6), 0, 7, 18);
    if(s === 0){
      rbKette(k, 0, a.rOben - 2, a.hinten - 0.5, [[3,3,2.6,1,2,0],[2.4,2.4,2.4,1.6,1.8,2],[1.6,1.6,1.6,0,0,7]]);
      k(-a.bw/2 - 0.6, a.L + 1, -1, 1, 1, 1, 7, 0); k(a.bw/2 - 0.4, a.L + 3, 2, 1, 1, 1, 7, 0);   // Funken
    } else {
      rbKette(k, 0, a.rOben - 2, a.hinten - 0.5, [[2.6,2.6,3,1.6,2.4,0],[2.2,2.2,3,2,2.2,1],[2.6,3.4,2.6,2.6,0.8,2],[1.8,2.2,1.8,0,0,7]]);
      const n = v(0, 3, 5);
      for(let i = 0; i < n; i++)                                                  // Schattenfetzen am Rücken
        k(-1.4, a.rOben - 0.4, a.vornRumpf + 1.5 + i*2.6, 2.8, 2.2 + (i % 2), 2, i % 2 ? 1 : 2, 0, 1, [-20, 0, 0]);
      const h = v(0, 3, 9);
      for(const seite of [-1, 1])                                                  // Hörner, weit geschwungen
        rbKette(k, seite*2.2, a.kopfOben - 0.5, a.kz + 3, s === 1
          ? [[1.4,h,1.4,h,0,1,seite*0.6],[1,1.4,1,0,0,7,0]]
          : [[1.8,h*0.35,1.8,h*0.35,1,1,seite*1.2],[1.6,h*0.35,1.6,h*0.3,1.4,1,seite*1.4],[1.4,h*0.3,1.4,h*0.25,1.4,3,seite*0.8],[1,1.6,1,0,0,7,0]]);
      if(s === 2) for(let i = 0; i < 4; i++)
        k(-a.bw/2 - 1.2 + (i % 2)*(a.bw + 1.2), a.L - 1 + i*0.8, -3 + i*2.4, 1.2, 1.2, 1.2, 7, 0);
    }
  },

  /* 007 Crystuff - das Geodentier: kleines Tier mit Kristallsplittern,
     größeres mit Kristallkamm, mächtiges mit Kristallwald am Rücken. */
  crystuff: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(3,5,8), lw:v(2.4,3,4.4), bw:v(6.5,8.5,13), bh:v(5,7,10), bl:v(7,11,16),
      hw:v(8.5,9,10.5), hh:v(7.5,8,9), hd:v(7,8,9), sn:v(null,[4.4,2.8,2],[5.6,3.4,3]),
      kopfTief:v(0.2,0.25,0.35), bf:v(1,1,1), pf:v(7,1,1)});
    rbOhren(k, a, 2.2, v(2.4,2.8,3), 0, 3, 18);
    const orte = [
      [[0, -1, 2.2, 4.4, 3], [-2, 2, 1.6, 3.2, 2]],
      [[0, -3, 2.6, 6, 3], [-2.6, 0, 2, 4.4, 7], [2.4, 1.6, 2, 5, 3], [0, 4, 2, 3.6, 2]],
      [[0, -5, 3.2, 9, 3], [-4, -2, 2.6, 6.5, 7], [4, -1, 2.6, 7.5, 3], [-2, 2.5, 2.8, 8, 3],
       [3, 4.5, 2.2, 5.5, 2], [-4.4, 5.5, 2, 4.4, 7], [0.4, 7, 2.4, 6, 3]]
    ][s];
    for(const [x, z, b, h, f] of orte)
      rbKristall(k, x, a.rOben - 0.6, z, b, h, f, f === 7 ? 6 : 2, [x < 0 ? -6 : 6, 0, x < 0 ? 12 : -12]);
    rbKristall(k, 0, a.kopfOben - 0.6, a.kz + 3, v(1.6,2,2.4), v(2.4,3.4,4.4), 7, 6);
    rbKette(k, 0, a.rOben - 2.2, a.hinten - 0.5, [[v(2,2.4,3),v(2,2.4,3),3,1,2.2,0],[1.6,v(2.6,3.6,5),1.6,0,0,3]]);
  },

  /* 008 Swamble - das Sumpftier: kleiner Molch, Sumpfechse mit
     Flossenkamm, großer Moorlord mit langem Schwanz.              */
  swamble: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(2.2,3.5,6), lw:v(2.4,3,4.2), bw:v(7,9,12), bh:v(4.5,6,9), bl:v(8,12,17),
      hw:v(9.5,10,11.5), hh:v(6.5,7,8.5), hd:v(7,8,9), sn:v([6,2.6,2],[7,3,3],[8,3.6,4]),
      kopfTief:v(0.3,0.3,0.1), kopfHoch:v(0,0,3), bf:v(1,1,1), pf:v(3,3,3), snf:v(4,4,2), augeY:v(0.62,0.62,0.6)});
    k(-a.kw/2 - 0.4, a.ky + a.kh*0.55, a.kz + 1, 1.4, 2.4, 3, 3, 0);              // Kiemenflossen
    k(a.kw/2 - 1, a.ky + a.kh*0.55, a.kz + 1, 1.4, 2.4, 3, 3, 0);
    const n = v(2, 4, 6);
    for(let i = 0; i < n; i++)                                                    // Rückenkamm
      k(-0.8, a.rOben - 0.4, a.vornRumpf + 1 + i*(a.bl - 1)/n, 1.6, v(1.6,2.8,4) - (i % 2)*0.8, (a.bl - 1)/n - 0.2, i % 2 ? 7 : 3, 0, 7);
    const t = v(1, 1.3, 1.8);
    rbKette(k, 0, a.L + 0.5, a.hinten - 0.5, [[3*t,3*t,3*t,0,2.6*t,0],[2.6*t,2.6*t,3*t,0.4,2.6*t,1],[2*t,2*t,3*t,0.8,2.4*t,0],[1.2*t,2.6*t,2.4*t,0,0,3]]);
    if(s === 2){
      for(const [x, z] of [[-6.4, -5], [5.4, -2], [-6.2, 3]])                     // Schilfbüschel
        k(x, a.L + 1, z, 1, 6, 1, 7, 0);
      rbPaar(k, 2.2, a.kopfOben - 0.4, a.kz + 2, 1.4, 3.4, 1.4, 3, null, [-24, 0, -24]);
    }
  },

  /* 009 Voltrix - der Sturmfuchs: gelber Fuchswelpe mit Blitzschwanz,
     weiß-blauer Elektrofuchs, großer Sturmfuchs mit Flügeln.      */
  voltrix: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(3,5.5,9), lw:v(2.2,2.6,3.2), bw:v(6,7.5,9.5), bh:v(5,6.5,8.5), bl:v(7,11,15),
      hw:v(8.5,8.5,9.5), hh:v(7.5,7.5,8.5), hd:v(7,8,9), sn:v([3.8,2.6,2],[4.4,3,3],[5,3.4,3.6]),
      kopfTief:v(0.2,0.25,0.1), kopfHoch:v(0,0,2.5), bf:v(1,0,0), pf:v(1,1,1)});
    rbOhren(k, a, v(2.6,2.8,2.6), v(4,5.4,6), 1, 3, v(14,18,22));
    // Blitzschwanz im Zickzack
    const t = v(1, 1.3, 1.7);
    rbKette(k, 0, a.rOben - 2, a.hinten - 0.5, [
      [2.4*t,2.4*t,3*t, 2.6*t, 1*t, 0],
      [2.4*t,2.4*t,3.2*t, 2.2*t,-1.2*t, 3],
      [2.4*t,2.4*t,3.2*t, 2.6*t, 1.4*t, 0],
      [2*t,2*t,2.8*t, 0, 0, 3]]);
    k(-a.kw/2 - 0.3, a.ky + 1, a.kz + 1, 1, 2.4, 2.4, 3, 0);                     // Wangen
    k(a.kw/2 - 0.7, a.ky + 1, a.kz + 1, 1, 2.4, 2.4, 3, 0);
    if(s >= 1) for(let i = 0; i < v(0, 2, 4); i++)                                // Blitzstreifen
      k(-a.bw/2 - 0.2 + (i % 2)*(a.bw - 0.6), a.L + 1.5, a.vornRumpf + 2 + i*2.6, 0.8, 3, 1.2, 3, 0);
    if(s === 2){
      m.fluegelY = a.rOben;
      rbPaar(k, 1.5, a.rOben - 0.6, -4, 9, 1.4, 8, 0, [3, 4], [0, 0, 16]);
      rbPaar(k, 10, a.rOben + 2.2, -3, 8, 1.2, 7, 6, [3, 4], [0, 0, 30]);
      rbPaar(k, 17, a.rOben + 6, -2.5, 4, 1.2, 6, 3, [3, 4], [0, 0, 40]);
      rbPaar(k, 8, a.rOben + 1, 3.6, 7, 1.2, 3, 1, [3, 4], [0, 0, 22]);
    }
  },

  /* 010 Sandroo - der Dünenspringer: kleines Sandtier mit großen Ohren,
     Springer mit starken Hinterbeinen, großer Dünenwidder mit Hörnern. */
  sandroo: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(3,5.5,9), lw:v(2.4,3,4), bw:v(6.5,8,11), bh:v(5,6.5,9), bl:v(7,11,15),
      hw:v(8.5,9,10), hh:v(7.5,8,9), hd:v(7,8,9), sn:v([3.6,2.6,2],[4.6,3,3],[5.4,3.6,3.6]),
      kopfTief:v(0.2,0.2,0.1), kopfHoch:v(0,1,2.5), bf:v(0,0,1), pf:v(7,7,7)});
    if(s < 2) rbOhren(k, a, v(3,3.2,0), v(4,5,0), 0, 2, 30);
    else rbOhren(k, a, 2, 2, 0, 2, 70);
    k(-a.bw/2 - 0.4, a.L - 0.5, a.hinten - v(3,4,5.5), a.bw + 0.8, v(3,4,5.5), v(3,4,5.5), 0, 0, 4);  // Sprungkeulen
    rbKette(k, 0, a.rOben - 2.5, a.hinten - 0.5, [[v(2.4,3,3.4),v(2.4,3,3.4),3.4,v(1,0.6,1),2.6,0],[v(2,2.6,3),v(2,2.6,3),3,0,0,2]]);
    for(let i = 0; i < v(1, 2, 3); i++)                                           // Streifen
      k(-a.bw/2 - 0.1, a.rOben - 2, a.vornRumpf + 2 + i*2.6, a.bw + 0.2, 1, 1, 1, 0);
    if(s === 2){
      for(const seite of [-1, 1]){                                                // Widderhörner, eingerollt
        const x = seite*(a.kw/2 + 0.6);
        k(x - 1.6, a.kopfOben - 2, a.kz + 3, 3.2, 3, 3.4, 3, 0, 7);
        k(x - 1.6 + seite*0.6, a.kopfOben - 0.6, a.kz + 5.6, 3.2, 3, 3, 3, 0, 7);
        k(x - 1.6 + seite*1, a.kopfOben - 3.4, a.kz + 7, 3.2, 3.2, 3, 7, 0, 7);
        k(x - 1.6 + seite*0.8, a.kopfOben - 6, a.kz + 5, 3.2, 3, 3, 3, 0, 7);
        k(x - 1.2 + seite*0.4, a.kopfOben - 5.4, a.kz + 2.2, 2.4, 2.4, 3, 7, 0, 7);
      }
      k(-1.4, a.rOben - 0.4, -3, 2.8, 1.6, 8, 1, 0);                              // Mähne
    }
  },

  /* 011 Frosturt - die Gletscherschildkröte: kleine Eisschildkröte,
     größere mit Frostpanzer, riesige mit Eiszacken.                */
  frosturt: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(2.4,3.5,6), lw:v(2.6,3.4,5), bw:v(7,9.5,14), bh:v(4,5,7), bl:v(8,11,16),
      hw:v(7,7.5,9), hh:v(6.5,6.5,8), hd:v(6,7,8.5), sn:v(null,[4.4,2.6,2],[5.6,3.2,2.6]),
      kopfTief:v(0.6,0.7,0.7), kopfIn:v(1.5,1.5,1.5), bf:v(0,0,0), pf:v(2,2,2), fk:1});
    const ph = v(5, 6.5, 9);
    k(-a.bw/2 - 0.6, a.rOben - 1, -a.bl/2 - 0.2, a.bw + 1.2, ph*0.55, a.bl + 0.4, 3, 0, 7);      // Panzer
    k(-a.bw/2 + 0.6, a.rOben - 1 + ph*0.5, -a.bl/2 + 1, a.bw - 1.2, ph*0.45, a.bl - 2, 7, 0, 7);
    k(-a.bw/2 + 2, a.rOben - 1 + ph*0.9, -a.bl/2 + 2.4, a.bw - 4, ph*0.25, a.bl - 4.8, 2, 0, 2);
    const n = v(0, 3, 7);
    const spitzen = [[0,-3],[-3.4,0.4],[3.2,1],[0,4.4],[-4.8,-4.2],[4.4,-4.6],[-1.6,-6.4]];
    for(let i = 0; i < n; i++)                                                    // Eiszacken
      rbKristall(k, spitzen[i][0], a.rOben - 1 + ph*v(1,1,0.95), spitzen[i][1], v(1.6,2,2.6), v(2,3,4.6) + (i % 3), i % 2 ? 2 : 6, 6,
                 [spitzen[i][1] < 0 ? 10 : -10, 0, spitzen[i][0] < 0 ? 10 : -10]);
    k(-1, a.L + 0.5, a.hinten, 2, 2, 2.4, 0, 0);                                  // Schwanz
  },

  /* 012 Luminmoth - die Leuchtmotte: kleine Motte mit glühenden Flügeln,
     größere mit zwei Flügelpaaren, prachtvolle Motte mit Fühlerkrone. */
  luminmoth: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const g = v(1, 1.3, 1.7);
    m.schweben = v(6, 8, 10);
    m.fluegelY = 7*g;
    k(-2.6*g, 4.6*g, -2*g, 5.2*g, 5*g, 6*g, 0, 0, 1);                             // Brust
    k(-3.2*g, 7.4*g, -2.6*g, 6.4*g, 2.4*g, 3*g, 4, 0, 4);                         // Pelzkragen
    rbKette(k, 0, 4.4*g, 3.6*g, [[4.4*g,4.4*g,3.4*g,-0.6*g,3*g,1],[3.6*g,3.6*g,3*g,-0.4*g,2.6*g,0],[2.6*g,2.6*g,2.4*g,0,0,3]]);  // Hinterleib
    k(-3.2*g, 5.6*g, -7.4*g, 6.4*g, 6*g, 5.8*g, 0, 0, 1);                         // Kopf
    augen(k, 7.4*g, -7.9*g, 2.8*g, 0.2*g);
    rbPaar(k, 0.6*g, 11.4*g, -6.4*g, 0.9*g, 4.4*g, 0.9*g, 7, null, [-34, 0, -26]); // Fühler
    rbPaar(k, 1.4*g, 14.6*g, -9*g, 2.4*g, 1.6*g, 1.2*g, 4, null, [-34, 0, -26]);
    // Flügel: vorne groß, hinten kleiner, mit dunklem Rand
    const fw = v(7, 9, 12)*g/1.1;
    rbPaar(k, 2.4*g, 7*g + fw*0.3, -4.6*g, fw, 1, fw*0.95, 3, [3, 4], [0, 0, 38]);
    rbPaar(k, 2.4*g + fw*0.72, 7*g + fw*0.95, -4*g, 1.6, 1, fw*0.85, 1, [3, 4], [0, 0, 38]);
    rbPaar(k, 3.2*g + fw*0.25, 7.3*g + fw*0.5, -2.4*g, fw*0.4, 1.2, fw*0.4, 6, [3, 4], [0, 0, 38]);
    if(s >= 1) rbPaar(k, 2.4*g, 5.6*g, 1.4*g, fw*0.8, 1, fw*0.7, 3, [3, 4], [0, 0, -8]);
    if(s === 2){
      rbPaar(k, 2.4*g + fw*0.8 - 0.2, 5.2*g, 1.6*g, 1.6, 1, fw*0.6, 7, [3, 4], [0, 0, -12]);
      for(let i = 0; i < 6; i++) k(-6*g + i*2.4*g, 2*g - (i % 2)*1.5, -5*g + (i % 3)*4*g, 1, 1, 1, 6, 0);   // Leuchtstaub
    }
    for(const x of [-2, 1.2]) k(x*g, 2.8*g, -1.4*g, 0.9*g, 2.4*g, 0.9*g, 1, 1);  // Beinchen
    m.beinY = 5*g;
  },

  /* 013 Terrhook - der Höhlenmaulwurf: kleiner Maulwurf, Tunnelgräber
     mit Grabkrallen, großes Tier mit riesigen Klauen und Stachelrücken. */
  terrhook: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(2.4,3.6,6), lw:v(2.6,3.2,4.6), bw:v(7.5,9.5,14), bh:v(5,7,10.5), bl:v(8,12,17),
      hw:v(8,8.5,10), hh:v(6.5,7,8.5), hd:v(6.5,7.5,8.5), sn:v([4,3,2.6],[4.6,3.4,3.4],[5.6,4,4]),
      kopfTief:v(0.5,0.55,0.6), bf:v(1,1,1), pf:v(1,1,1), snf:v(2,2,2), eb:v(2,2.2,2.6), augeY:v(0.55,0.55,0.55)});
    const kl = v(1, 2.2, 4.4);                                                    // Grabkrallen vorne
    for(const seite of [-1, 1])
      for(let i = 0; i < 3; i++)
        k(seite*(a.bw/2 - 1.8) + (i - 1)*v(0.9,1.1,1.5) - 0.4, 0, -a.bl/2 - kl + 0.4, v(0.8,1,1.3), v(1,1.2,1.8), kl + 1, 3, seite < 0 ? 1 : 2, 3);
    k(-a.bw/2 + 1, a.rOben - 1, -a.bl/2 + 1, a.bw - 2, 1.6, a.bl - 2, 1, 0);      // dunkler Rücken
    if(s === 2){
      for(let i = 0; i < 8; i++)                                                  // Stachelrücken
        k(-4 + (i % 3)*3, a.rOben + 0.4, -6 + i*1.8, 2, 3 + (i % 2)*1.6, 2, i % 2 ? 1 : 2, 0, 1, [-24, 0, (i % 3 - 1)*16]);
      rbPaar(k, 1.2, a.kopfOben - 0.4, a.kz + 2, 1.6, 2.6, 1.6, 3, null, [-30, 0, -20]);
    }
    k(-0.8, a.L + 1, a.hinten - 0.4, 1.6, 1.6, v(1.6,2.4,3), 1, 0);
  },

  /* 014 Bloomtide - die Lotusblüte: kleine Knospe auf Blattfüßen, halb
     offene Blüte, riesige Lotusblume mit zwei Blätterkränzen.     */
  bloomtide: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const g = v(1, 1.35, 1.8);
    m.beinY = 2.4*g;
    // Seerosenblatt als Rock, zwei Blattfüße
    k(-5.4*g, 2.2*g, -5.4*g, 10.8*g, 1.4*g, 10.8*g, 3, 0, 7);
    k(-3.6*g, 0, -2.6*g, 3*g, 2.6*g, 4*g, 7, 1);
    k(0.6*g, 0, -2.6*g, 3*g, 2.6*g, 4*g, 7, 2);
    // Körper - bei der Knospe sind die Blütenblätter noch geschlossen
    k(-3.6*g, 3.4*g, -3.6*g, 7.2*g, 6.4*g, 7.2*g, s === 0 ? 0 : 4, 0, 4);
    augen(k, 5.8*g, -4*g, 2.2*g, 0.5*g);
    k(-1*g, 4.6*g, -4.1*g, 2*g, 0.8*g, 0.6, 1, 0);
    const kranz = (y, r, h, n, f1, f2, kipp) => {
      for(let i = 0; i < n; i++){
        const w = i/n*Math.PI*2;
        const x = Math.sin(w)*r, z = Math.cos(w)*r;
        k(x - 1.8*g, y, z - 1.8*g, 3.6*g, h, 3.6*g, i % 2 ? f2 : f1, 0, f2,
          [Math.cos(w)*kipp, 0, -Math.sin(w)*kipp]);
      }
    };
    if(s === 0){
      kranz(8.4*g, 2.2*g, 5, 5, 0, 2, 18);                                        // geschlossene Knospe
      k(-1.2, 12.8, -1.2, 2.4, 1.8, 2.4, 2, 0);
    } else {
      kranz(9*g, 3.4*g, 5*g, 6, 0, 2, 34);                                        // offene Blütenblätter
      k(-2*g, 9.2*g, -2*g, 4*g, 1.6*g, 4*g, 4, 0);                               // gelbe Mitte
      for(let i = 0; i < 4; i++) k(-2*g + (i % 2)*3*g, 10.8*g, -2*g + (i > 1 ? 3*g : 0), 1, 1.4*g, 1, 6, 0);
    }
    if(s === 2){
      kranz(8*g, 5*g, 4.4*g, 8, 1, 0, 58);                                        // äußerer Kranz
      for(let i = 0; i < 4; i++){
        const w = (i + 0.5)/4*Math.PI*2;
        k(Math.sin(w)*6.6*g - 2.6*g, 2*g, Math.cos(w)*6.6*g - 2.6*g, 5.2*g, 1, 5.2*g, 7, 0, 3);  // große Blätter
      }
    }
    rbPaar(k, 3.4*g, 5*g, -1*g, 2.6*g, 1.2*g, 2*g, 3, [1, 2], [0, 0, -30]);      // Blattärmchen
  },

  /* 015 Obsidrone - der Wächter: kleiner Obsidianvogel, Schwingen-
     wächter, großer Greif mit violett leuchtenden Flügeln.        */
  obsidrone: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    if(s < 2){
      const g = v(1, 1.4, 0);
      m.beinY = 3*g; m.fluegelY = 8*g; m.schweben = v(0, 4, 0);
      k(-3.4*g, 3*g, -3.4*g, 6.8*g, 6.4*g, 7.4*g, 0, 0, 4);                      // Rumpf
      k(-3.6*g, 8.6*g, -7*g, 7.2*g, 6.4*g, 6.4*g, 0, 0, 1);                      // Kopf
      augen(k, 11*g, -7.5*g, 2.4*g, 0.6*g);
      k(-1*g, 9.4*g, -9*g, 2*g, 1.6*g, 2.4*g, 7, 0);                             // Schnabel
      rbKristall(k, 0, 14.6*g, -4*g, 1.4*g, 2.6*g, 3, 6);                        // Kristall auf dem Kopf
      rbPaar(k, 3*g, 7.6*g, -2.6*g, v(4, 7, 0)*g/1.2, 1.2, 6*g, 1, [3, 4], [0, 0, 14]);
      rbPaar(k, 3*g + v(4, 7, 0)*g/1.2 - 0.4, 8.4*g, -1.6*g, 1.4, 1, 4.6*g, 3, [3, 4], [0, 0, 22]);
      rbKette(k, 0, 4*g, 3.6*g, [[3*g,1.2,3*g,0.4,2.4*g,1],[3.4*g,1.2,2.4*g,0,0,3]]);
      k(-2.4*g, 0, -1.4*g, 1.6*g, 3.4*g, 1.6*g, 1, 1); k(0.8*g, 0, -1.4*g, 1.6*g, 3.4*g, 1.6*g, 1, 2);
      return;
    }
    const a = rbVier(k, m, {L:9, lw:3.4, bw:10, bh:9, bl:15, hw:9, hh:8.5, hd:9, sn:[3.6,3,3.4],
      kopfTief:0, kopfHoch:3, bf:1, pf:7, snf:7});
    m.fluegelY = a.rOben;
    rbKristall(k, 0, a.kopfOben - 0.5, a.kz + 3, 2.2, 5, 3, 6);
    rbPaar(k, 1.2, a.kopfOben - 0.8, a.kz + 4.4, 1.4, 4.6, 1.4, 1, null, [-40, 0, -16]);
    rbPaar(k, 2.4, a.rOben - 0.8, -5, 9, 1.4, 9, 0, [3, 4], [0, 0, 18]);          // große Schwingen
    rbPaar(k, 10.6, a.rOben + 2, -4, 8, 1.2, 8, 1, [3, 4], [0, 0, 30]);
    rbPaar(k, 17.2, a.rOben + 5.8, -3, 4, 1.2, 7, 3, [3, 4], [0, 0, 38]);
    for(let i = 0; i < 3; i++) rbPaar(k, 5 + i*4, a.rOben + 1 + i*1.6, -4.4, 1.2, 1.4, 8, 7, [3, 4], [0, 0, 18 + i*6]);
    rbKette(k, 0, a.rOben - 2.5, a.hinten - 0.5, [[3,3,3.4,-0.4,3,0],[2.4,2.4,3.4,-0.4,3,1],[4.4,1.2,4.4,0,0,3]]);
  },

  /* 016 Pyroshroom - der Waldbrandpilz: kleiner Glutpilz, Feuerpilz
     mit Glutadern, riesiger Lavapilz mit Flammenfüßen.            */
  pyroshroom: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const g = v(1, 1.35, 1.85);
    m.beinY = 2.4*g;
    k(-3*g, 2*g, -3*g, 6*g, 6.6*g, 6*g, 3, 0, 4);                                // Stiel = Körper
    augen(k, 5*g, -3.4*g, 2*g, 0.4*g);
    k(-1*g, 3.6*g, -3.3*g, 2*g, 0.8*g, 0.5, 1, 0);                               // Mund
    k(-2.8*g, 0, -2.4*g, 2.4*g, 2.4*g, 3.2*g, 4, 1);                             // Füßchen
    k(0.4*g, 0, -2.4*g, 2.4*g, 2.4*g, 3.2*g, 4, 2);
    const hut = v(10, 11, 12)*g/1.1;
    k(-hut/2, 8.4*g, -hut/2, hut, 3.6*g, hut, 0, 0, 1);                          // Hut
    k(-hut/2 + 1.4*g, 11.8*g, -hut/2 + 1.4*g, hut - 2.8*g, 2.2*g, hut - 2.8*g, 0, 0, 0);
    k(-hut/2 + 3*g, 13.8*g, -hut/2 + 3*g, hut - 6*g, 1.2*g, hut - 6*g, 0, 0, 0);
    k(-hut/2 - 0.2, 8.2*g, -hut/2 - 0.2, hut + 0.4, 1*g, hut + 0.4, 1, 0, 4);    // Hutrand
    const punkte = [[-3, -2.4, 11.6], [1.6, -3.6, 11], [2.4, 1.4, 12.6], [-2, 2.6, 12.2], [0, 0, 14.2], [-4.2, 1, 10]];
    for(const [x, z, y] of punkte.slice(0, v(4, 5, 6)))                          // weiße Punkte
      k(x*g/1.1 - 0.9*g, y*g, z*g/1.1 - 0.9*g, 1.8*g, 1.2*g, 1.8*g, 2, 0);
    if(s >= 1) for(let i = 0; i < v(0, 3, 6); i++)                               // Glutfunken
      k(-4*g + i*1.6*g, 0.6*g + (i % 2)*1.6*g, -4*g + (i % 3)*3*g, 1*g, 1*g, 1*g, 7, 0);
    if(s === 2){
      k(-hut/2 - 0.4, 9.2*g, -1, hut + 0.8, 1.2, 2, 7, 0);                         // Lavaadern
      k(-1, 9.2*g, -hut/2 - 0.4, 2, 1.2, hut + 0.8, 7, 0);
      for(const [x, z] of [[-4.6, -4.6], [2.6, -4.6], [-4.6, 2.6], [2.6, 2.6]])  // kleine Pilze am Fuß
        { k(x*g/1.2, 0, z*g/1.2, 2.2, 3, 2.2, 3, 0); k(x*g/1.2 - 1, 3, z*g/1.2 - 1, 4.2, 2, 4.2, 0, 0, 1); }
    }
  },

  /* 017 Tidalfin - die Meeresströmung: kleiner Delfin, Riffschwimmer,
     großer Strömungsjäger mit gelben Flossen. Alle schweben wie im Wasser. */
  tidalfin: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const g = v(1, 1.35, 1.8);
    m.schweben = v(4, 5, 6);
    m.beinY = 5*g; m.fluegelY = 5*g;
    k(-3*g, 2.4*g, -5*g, 6*g, 5.6*g, 11*g, 0, 0, 4);                             // Körper
    k(-2.6*g, 2*g, -4.6*g, 5.2*g, 2*g, 9.6*g, 4, 0, 4);                          // Bauch
    k(-2.8*g, 3*g, -10*g, 5.6*g, 5.2*g, 5.4*g, 0, 0, 4);                         // Kopf
    k(-1.6*g, 3*g, -12.6*g, 3.2*g, 2.2*g, 2.8*g, 4, 0, 4);                       // Schnauze
    augen(k, 5.6*g, -10.4*g, 2*g, 0.8*g);
    k(-0.8*g, 7.6*g, -2.6*g, 1.6*g, v(2.6,3.6,5)*g, 4*g, 3, 0, 3, [-24, 0, 0]);  // Rückenflosse
    rbKette(k, 0, 3.4*g, 5.6*g, [[4*g,3.8*g,3*g,0.4*g,2.6*g,0],[2.8*g,2.6*g,3*g,0,0,1]]);
    k(-4.4*g, 3.6*g, 10.4*g, 8.8*g, 1.2*g, 3*g, 3, 1, 3);                        // Schwanzflosse
    rbPaar(k, 2.6*g, 3*g, -5*g, 4*g, 1*g, 3.2*g, 3, [3, 4], [0, 0, -22]);         // Seitenflossen
    if(s >= 1) k(-3.1*g, 5*g, -5*g, 6.2*g, 1*g, 8*g, 2, 0);                      // helle Streifen
    if(s === 2){
      rbPaar(k, 1.4*g, 7.6*g, -9*g, 1.2*g, 2.4*g, 3*g, 7, null, [-40, 0, -20]);   // Kopfflossen
      for(let i = 0; i < 3; i++) k(-1.2 + i*1.4, 12*g + i*1.4, 6 - i*5, 1.2, 1.2, 1.2, 6, 0);   // Blasen
    }
  },

  /* 018 Brambleox - der Dornenochse: Kalb mit Blattrücken, junger
     Ochse mit Dornenbusch, gewaltiger Waldochse mit Hörnern und Busch. */
  brambleox: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(3,5,7.5), lw:v(2.6,3.4,5), bw:v(7,9.5,14), bh:v(5.5,7.5,11), bl:v(8,12,17),
      hw:v(8,9,11), hh:v(7,8,9.5), hd:v(7,8,9), sn:v([5,3,2],[6,3.6,2.6],[7.4,4.2,3]),
      kopfTief:v(0.3,0.4,0.55), bf:v(1,1,1), pf:v(1,1,7), snf:2});
    rbPaar(k, a.kw/2 - 0.4, a.kopfOben - 3, a.kz + 2, v(2.4,2.6,3), 1.6, 2, 0, null, [0, 0, -10]);  // Ohren seitlich
    // Blätter und Dornen auf dem Rücken
    const busch = v(2, 4.5, 8);
    k(-a.bw/2 + 0.4, a.rOben - 0.8, -a.bl/2 + 1, a.bw - 0.8, busch*0.5, a.bl - 2, 3, 0, 3);
    if(s >= 1) k(-a.bw/2 + 1.6, a.rOben - 0.8 + busch*0.45, -a.bl/2 + 2.6, a.bw - 3.2, busch*0.45, a.bl - 5.2, 3, 0, 3);
    if(s === 2){
      k(-a.bw/2 + 3.4, a.rOben + busch*0.85, -a.bl/2 + 4.4, a.bw - 6.8, 2.6, a.bl - 8.8, 3, 0, 3);
      for(const [x, z] of [[-6.6, -4], [5.4, -6], [-5.4, 4], [6, 3], [0, -7.4], [-1, 6.4]])
        k(x, a.rOben + 1 + (x > 0 ? 1.4 : 0), z, 2.4, 2.4, 2.4, (x + z) % 2 ? 2 : 1, 0, 1);   // Beeren und Holz
      for(const seite of [-1, 1])                                                  // große Hörner
        rbKette(k, seite*(a.kw/2 + 0.6), a.kopfOben - 2.4, a.kz + 3, [[2.6,2.4,2.4,1,0,7,seite*2.2],[2.2,2.4,2.2,1.8,-0.4,7,seite*1],[1.6,2.8,1.6,0,0,6,0]]);
    } else if(s === 1){
      for(const seite of [-1, 1])
        rbKette(k, seite*(a.kw/2), a.kopfOben - 1.6, a.kz + 3, [[1.8,1.6,1.8,0.8,0,7,seite*1.2],[1.4,2,1.4,0,0,6,0]]);
      for(let i = 0; i < 4; i++) k(-4 + i*2.6, a.rOben + busch*0.9, -4 + (i % 2)*4, 1, 2, 1, 1, 0);   // Dornen
    } else {
      k(-2.4, a.rOben + 0.6, -1.4, 2, 1, 3, 2, 0, 2, [0, 0, 20]);
      k(0.4, a.rOben + 0.6, -1.4, 2, 1, 3, 2, 0, 2, [0, 0, -20]);
    }
    rbKette(k, 0, a.rOben - 2, a.hinten - 0.5, [[1.2,1.2,v(2,3,4),-1,v(2,3,4),0],[2,2,2,0,0,3]]);
  },

  /* 019 Solstrider - der Morgenhengst: weißes Fohlen mit goldener Mähne,
     schneller Sonnenläufer, erhabener Sonnenhengst mit Goldkrone.   */
  solstrider: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(5,8,12), lw:v(2,2.6,3.4), bw:v(5.5,7,9.5), bh:v(5,6.5,9), bl:v(8,12,16),
      hw:v(6.5,7,8), hh:v(6.5,7,8), hd:v(7,8,9), sn:v([4,3,2.6],[4.4,3.4,3.6],[5,3.8,4.4]),
      kopfTief:0, kopfHoch:v(2,4,6.5), bf:v(0,0,0), pf:v(3,3,3), snf:v(4,4,4)});
    rbOhren(k, a, 1.8, v(2.4,2.8,3), 0, 3, 8);
    const n = v(3, 5, 7);
    for(let i = 0; i < n; i++)                                                    // goldene Mähne
      k(-1.2 - (i % 2)*0.3, a.kopfOben - 1.2 - i*v(1.4,1.6,1.8), a.kz + a.kd - 1.6 + i*1.6, 2.4 + (i % 2)*0.6, v(2.4,3,3.4), 2, i % 3 === 2 ? 7 : 3, 0, 7);
    rbKette(k, 0, a.rOben - 1.5, a.hinten - 0.5, [[2.6,2.6,v(2,2.6,3),-1.4,v(2,2.6,3),3],[2.8,3,2.6,-1.6,1.4,3],[2.4,3,2.4,0,0,7]]);
    for(let i = 0; i < 4; i++) if(s >= 1)                                          // Goldsaum an den Hufen
      k((i < 2 ? -1 : 1)*(a.bw/2 - 1.4) - 1.6, 1.2, (i % 2 ? a.bl/2 - 3.2 : -a.bl/2 + 0.2), 3.2, 0.8, 3.2, 6, 0);
    if(s === 1) rbKristall(k, 0, a.kopfOben - 0.4, a.kz + 2, 1.2, 2.6, 3, 6);
    if(s === 2){
      for(const seite of [-1, 1]){                                                  // Goldkrone wie ein Geweih
        rbKette(k, seite*1.8, a.kopfOben - 0.4, a.kz + 3, [[1.4,3,1.4,3,0.4,3,seite*1.2],[1.4,3,1.4,2.6,0.8,3,seite*1.6],[1.2,2.4,1.2,0,0,7,0]]);
        k(seite*3.8 - 0.6, a.kopfOben + 3, a.kz + 1.2, 1.2, 3, 1.2, 3, 0, 3, [-30, 0, 0]);
      }
      rbKristall(k, 0, a.kopfOben - 0.4, a.kz + 2, 1.6, 4, 3, 6);
      rbPaar(k, a.bw/2 - 0.2, a.L + 3, -3.4, 0.6, 3, 6, 3, null, [0, 0, 0]);       // goldene Flanken
    }
  },

  /* 020 Nullspire - der Leereturm: kleiner Schattenwicht mit Kristall,
     Turmkriecher mit Dornen, riesiges Wesen mit schwarzen Kristalltürmen. */
  nullspire: function(k, s, m){
    const v = (a, b, c) => [a, b, c][s];
    const a = rbVier(k, m, {L:v(2.6,5,8), lw:v(2.4,3,4.4), bw:v(6.5,8.5,13), bh:v(5.5,7,10), bl:v(7,11,16),
      hw:v(9,9,10.5), hh:v(8,8,9), hd:v(7.5,8,9), sn:v(null,[4,2.6,2],[5.4,3.2,3]),
      kopfTief:v(0.1,0.25,0.3), kopfHoch:v(0,0,2), bf:v(0,1,1), pf:v(1,7,7)});
    rbOhren(k, a, v(2.6,2.4,2.4), v(3.4,4.6,4), 0, 7, 10);
    rbKristall(k, 0, a.kopfOben - 0.6, a.kz + 2.4, v(1.8,2.2,2.6), v(3,4,5.6), 3, 6);
    const turm = [
      [],
      [[-2.4, -1, 1.8, 5], [2.4, 2, 1.8, 6], [0, 4.4, 1.6, 4]],
      [[-3.6, -4, 2.8, 8], [3.6, -2, 2.8, 11], [-3, 2.4, 2.6, 13], [3, 5.6, 2.4, 9], [0, 0, 2.2, 7], [-0.4, 7, 2, 6]]
    ][s];
    for(const [x, z, b, h] of turm){
      rbKristall(k, x, a.rOben - 0.6, z, b, h, 1, 3, [x < 0 ? -4 : 4, 0, x < 0 ? 8 : -8]);
      k(x - b*0.2, a.rOben + h*0.4, z - b*0.55, b*0.4, h*0.35, 0.5, 7, 0);       // violettes Leuchten
    }
    rbKette(k, 0, a.rOben - 2, a.hinten - 0.5, [[v(2,2.6,3.4),v(2,2.6,3.4),3,1.4,2.4,0],[v(1.6,2,2.6),v(1.6,2,2.6),3,1.6,2,1],[1.6,v(2,3,4),1.6,0,0,3]]);
    if(s === 0) k(-a.bw/2 - 1, a.L + 3, 1, 1, 1, 1, 7, 0);
  }
};

/* ---------- Die Arten der zwanzig Reihen ----------
   nr = Nummer im Kreaturenbuch, rs = Stufe in der Reihe (0, 1, 2).  */
const REIHEN_ARTEN = [];
function reiheAnlegen(nr, reihe, typ, biom, tempo, namen, farben){
  namen.forEach((name, i) => {
    REIHEN_ARTEN.push({
      id: name.toLowerCase(), nameDe: name, nr: nr, reihe: reihe, rs: i,
      emoji: ["🥚","🐾","⭐"][i], typ: typ, rang: i, biom: biom,
      tempo: tempo + i*0.3, plan: reihe === "tidalfin" ? "fisch" : "vierbeiner",
      farben: farben[i] || farben[0],
      wird: namen[i+1] ? namen[i+1].toLowerCase() : undefined
    });
  });
}
// Farben: Haupt, Dunkel, Hell, Akzent, Bauch, Auge, Weiß, Akzent dunkel
const AU = "#17131f", WE = "#f8fafc";
reiheAnlegen(1,  "mossleaf",   "pflanze", 0, 3.0, ["Sprigbud","Leafling","Mossant"], [
  ["#5aa83c","#2f6a24","#9ad866","#6b4a2a","#c4e48e",AU,WE,"#3d2a18"],
  ["#4f9a38","#2c6322","#8fd060","#6b4a2a","#b8dc80",AU,WE,"#3d2a18"],
  ["#3f7f2e","#264d1c","#6fb44a","#5a3e24","#8fbf62",AU,WE,"#3a2716"]]);
reiheAnlegen(2,  "aquabobble", "wasser",  0, 3.4, ["Bubbit","Streamlet","Cascadier"], [
  ["#5a9ae8","#2e5aaa","#a8dcff","#23408e","#e0f2ff",AU,WE,"#16286a"],
  ["#4a88e0","#2a4fa0","#9fd4ff","#1f3a8a","#d8f0ff",AU,WE,"#16286a"],
  ["#8cc0f0","#3a64b8","#c8ecff","#2a52c0","#eef8ff",AU,WE,"#1a3478"]]);
reiheAnlegen(3,  "stonkitt",   "stein",   4, 3.2, ["Pebkit","Cragmeow","Monolith"], [
  ["#a89480","#62564a","#e6ddd0","#8a8a86","#f2ece2",AU,WE,"#5c5c58"],
  ["#9a8672","#5e5246","#e0d6c8","#8c8c88","#efe8dc",AU,WE,"#5a5a56"],
  ["#8a7866","#4e443a","#d8cebe","#92928c","#e8e0d2",AU,WE,"#5e5e58"]]);
reiheAnlegen(4,  "flarenk",    "feuer",   5, 3.6, ["Sparkit","Cindrake","Blazigon"], [
  ["#ee7a2e","#8a3414","#ffc070","#ffd23a","#ffe6b0",AU,WE,"#3a2a26"],
  ["#d8482a","#7a2012","#ffa040","#ffd23a","#ffd8a0",AU,WE,"#3a2626"],
  ["#3a3236","#1e1a1c","#ff9a2a","#ff6a1a","#5a4a48",AU,WE,"#d8a040"]]);
reiheAnlegen(5,  "zephydeer",  "flug",    7, 4.2, ["Breefaun","Gusthorn","Skyantler"], [
  ["#9ed0f0","#5a8cc0","#e8f6ff","#d8b880","#f4fbff",AU,WE,"#4a6a9a"],
  ["#88c0ea","#4a7fb8","#e0f2ff","#d0b078","#f2faff",AU,WE,"#3f5f92"],
  ["#6aa0e0","#3a64a8","#dceeff","#e8d8b0","#f0f8ff",AU,WE,"#34528a"]]);
reiheAnlegen(6,  "shadwisp",   "geist",   6, 3.4, ["Whisplet","Shadeveil","Umbralis"], [
  ["#4e3e70","#261c3a","#7a5aa8","#e060d0","#3a2c52","#ff9af0","#ff5ad8","#b048e0"],
  ["#40325e","#1e1630","#6a4c98","#e060d0","#332848","#ff9af0","#ff5ad8","#a040d8"],
  ["#2e2440","#140f1e","#5a4280","#d050e0","#241c32","#ffb0f4","#ff4ad0","#9a3ae0"]]);
reiheAnlegen(7,  "crystuff",   "stein",   8, 2.8, ["Shardling","Crystawn","Gemhorn"], [
  ["#9486d6","#4e3e90","#d4c8ff","#b070ff","#e4dcff",AU,WE,"#60e0f0"],
  ["#8a7ad0","#4a3a8a","#c8b8ff","#a660ff","#e0d8ff",AU,WE,"#58d8f0"],
  ["#7a68c4","#3e2e7a","#c0b0ff","#9a50f8","#d8ceff",AU,WE,"#50d0ee"]]);
reiheAnlegen(8,  "swamble",    "wasser",  6, 2.8, ["Mudlet","Bogbelle","Fenlord"], [
  ["#6a9040","#34502a","#a0c458","#2a7a8a","#e4c858",AU,WE,"#1a4a5a"],
  ["#5a8a3a","#2e4a24","#9ac050","#2a6a7a","#e0c050",AU,WE,"#1a3a4a"],
  ["#3e6a4a","#22382a","#6a9a58","#2a8aa0","#e8c040",AU,WE,"#153848"]]);
reiheAnlegen(9,  "voltrix",    "elektro", 1, 4.6, ["Zapkit","Electrine","Voltara"], [
  ["#f4cc30","#b08a18","#fff09a","#2a3a6a","#fff6d0",AU,WE,"#1c2850"],
  ["#eef0f6","#2a3a6a","#ffffff","#f2cc30","#fafbff",AU,WE,"#b89020"],
  ["#f2f4fa","#24325e","#ffffff","#f4c828","#ffffff",AU,WE,"#2a3a6a"]]);
reiheAnlegen(10, "sandroo",    "boden",   4, 3.8, ["Dunbop","Sandleap","Duneclaw"], [
  ["#d4ac78","#8a6440","#f0dcb4","#9a6a3a","#f6e8cc",AU,WE,"#6a4424"],
  ["#c8a070","#7a5a3a","#ecd8b0","#8a5a30","#f4e6c8",AU,WE,"#5e3c20"],
  ["#b48a5a","#6a4a2c","#e0c89a","#7a4a24","#eedcb8",AU,WE,"#4e3018"]]);
reiheAnlegen(11, "frosturt",   "eis",     7, 2.2, ["Chillet","Frostshell","Glacidon"], [
  ["#86b4e0","#46689a","#d0ecff","#a8e0ff","#e8f4ff",AU,WE,"#6aa0d0"],
  ["#7aa8d8","#3a5a8a","#c8e4ff","#98d4f8","#e8f4ff",AU,WE,"#5a8ac0"],
  ["#6a96c8","#2e4a78","#c0e0ff","#8ac8f0","#e0f0ff",AU,WE,"#4a78b0"]]);
reiheAnlegen(12, "luminmoth",  "kaefer",  8, 4.0, ["Glowpin","Lumoth","Aurafly"], [
  ["#2e2e48","#16161f","#4a4a6a","#fff27a","#f0e4a8",AU,"#fffbd0","#a0ff60"],
  ["#2a2a44","#15151f","#4a4a6a","#fff070","#f0e0a0",AU,"#fffbd0","#98f860"],
  ["#262640","#12121c","#46466a","#fff590","#f4e8b0",AU,"#ffffe0","#b0ff70"]]);
reiheAnlegen(13, "terrhook",   "boden",   5, 2.6, ["Digdot","Tunneler","Deepclaw"], [
  ["#7a5436","#402c1c","#b08462","#ece4d4","#c89a70",AU,WE,"#f08a9a"],
  ["#6a4a30","#3a2818","#a0785a","#e8e0d0","#c09068",AU,WE,"#e07a8a"],
  ["#5a3e28","#302014","#906a4c","#f0e8d8","#b08058",AU,WE,"#e07080"]]);
reiheAnlegen(14, "bloomtide",  "pflanze", 1, 2.6, ["Lotil","Florasis","Petalune"], [
  ["#f07ab0","#b03a78","#ffd0e8","#4aa040","#ffe060",AU,WE,"#2a6a2a"],
  ["#f482b8","#c04484","#ffd8ec","#48a03e","#ffe060",AU,WE,"#2a6a2a"],
  ["#f58cc0","#c84c8c","#ffe0f0","#46a03c","#ffe46a",AU,WE,"#2c6e2c"]]);
reiheAnlegen(15, "obsidrone",  "unlicht", 6, 4.2, ["Shardrone","Obsiwing","Eclipseon"], [
  ["#2e283a","#16121e","#4e4462","#a050f0","#3e3450","#f0d0ff","#d8a8ff","#6a2ab0"],
  ["#2a2436","#15101e","#4a3e60","#a050f0","#3a3048","#f0d0ff","#d0b0ff","#6a2ab0"],
  ["#241e30","#110d18","#443a58","#b060ff","#342a42","#f4d8ff","#d8b8ff","#7a30c8"]]);
reiheAnlegen(16, "pyroshroom", "feuer",   8, 2.6, ["Embrill","Fungalite","Inferoom"], [
  ["#d83a2a","#8a1a14","#ffffff","#f0e0c8","#ffd0a0",AU,WE,"#ff9a2a"],
  ["#d0302a","#801614","#fff4ec","#ecd8bc","#ffc898",AU,WE,"#ff8a1a"],
  ["#c42420","#6e1010","#fff0e0","#e0c8a8","#ffb888",AU,WE,"#ffa020"]]);
reiheAnlegen(17, "tidalfin",   "wasser",  1, 4.4, ["Finlet","Reefin","Tidalor"], [
  ["#4a7ae0","#1e44a0","#9ad0ff","#6ab8f8","#e0eeff",AU,WE,"#2a5ac0"],
  ["#3a6ad0","#1a3a8a","#8ac8ff","#f2c030","#dcecff",AU,WE,"#c89018"],
  ["#2e58c0","#162e78","#7ab8f8","#ffd23a","#d4e6ff",AU,WE,"#d09a18"]]);
reiheAnlegen(18, "brambleox",  "pflanze", 0, 2.6, ["Thorncalf","Brambleheart","Verdantaur"], [
  ["#7a5838","#3e2a1a","#b08a60","#5aa034","#9a7a58",AU,WE,"#e8dcc0"],
  ["#6a4a2e","#3a2818","#a08058","#529a30","#8a6a48",AU,WE,"#e8dcc0"],
  ["#5a3e26","#2e1e12","#9a7650","#4a8a2a","#7a5e40",AU,WE,"#ece2c8"]]);
reiheAnlegen(19, "solstrider", "normal",  4, 4.8, ["Dawnfoal","Sunstride","Solareign"], [
  ["#f6f2e8","#bcae90","#ffffff","#eab838","#fffaf0",AU,WE,"#c08820"],
  ["#f4f0e6","#b8a888","#ffffff","#e8b830","#fffaf0",AU,WE,"#b8801a"],
  ["#f8f4ea","#b4a080","#ffffff","#f0c030","#fffcf4",AU,WE,"#c0861a"]]);
reiheAnlegen(20, "nullspire",  "unlicht", 8, 3.2, ["Nulbud","Spirewretch","Oblivyx"], [
  ["#342a3e","#18121e","#54466a","#9a4af0","#443852",AU,"#e0a0ff","#d080ff"],
  ["#2a2230","#120e18","#4a3a5a","#9a4af0","#3a2e44",AU,"#e0a0ff","#d080ff"],
  ["#221a28","#0c0910","#403250","#a050ff","#322640",AU,"#e8b0ff","#d890ff"]]);

function hexFarbe(h){ return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]; }
/* ---------- Die Bälle als Pixelbilder ----------
   Jeder Ball ist ein Kreis aus 20 × 20 Pixeln, genau wie auf seiner
   Rezeptkarte: eine gemusterte Schale, ein Band um die Mitte und ein
   leuchtender Knopf. Die Muster sind feste Zufallsflecken - derselbe
   Ball sieht darum jedes Mal gleich aus.                               */
const BALL_PIXEL = 20;
function ballFleck(x, y, saat){                     // fester Zufall 0..1 je Pixel
  const n = Math.sin(x*127.1 + y*311.7 + saat*74.7) * 43758.5453;
  return n - Math.floor(n);
}
function ballMischung(liste, x, y, saat){
  return liste[Math.floor(ballFleck(x, y, saat) * liste.length) % liste.length];
}
/* Jede Form bekommt u, v (Mitte 0, Rand ±1), den Abstand d zur Mitte
   und die Pixelkoordinaten. Sie gibt eine Farbe zurück oder null.     */
const BALL_MUSTER = {
  normal: (u, v, d, x, y) => {
    if(Math.abs(v) < 0.12 || d < 0.3) return d < 0.19 ? (d < 0.1 ? "#ffffff" : "#e8e8e8") : "#161616";
    return v < 0 ? (u < -0.35 && v < -0.45 ? "#ff8a8f" : "#e8404a") : (d > 0.85 ? "#c9c9c9" : "#f2f2f2");
  },
  super: (u, v, d, x, y) => {
    if(Math.abs(v) < 0.12 || d < 0.3) return d < 0.19 ? (d < 0.1 ? "#ffffff" : "#e8e8e8") : "#161616";
    if(v < 0) return (Math.abs(u) > 0.45 && v > -0.55) ? "#e8404a" : (u < -0.3 && v < -0.5 ? "#8fb8ff" : "#2f6fe0");
    return d > 0.85 ? "#c9c9c9" : "#f2f2f2";
  },
  hyper: (u, v, d, x, y) => {
    if(Math.abs(v) < 0.12 || d < 0.3) return d < 0.19 ? (d < 0.1 ? "#ffffff" : "#e8e8e8") : "#161616";
    if(v < 0) return (Math.abs(Math.abs(u) - 0.38) < 0.11 && v > -0.75) ? "#f2c230" : "#262626";
    return d > 0.85 ? "#c9c9c9" : "#f2f2f2";
  },
  aurora: (u, v, d, x, y) => {
    if(d < 0.3) return d < 0.16 ? "#ffffff" : (d < 0.22 ? "#cfd6e0" : "#101018");
    if(Math.abs(v) < 0.12) return Math.abs(u) > 0.5 ? "#e6e8ee" : "#101018";
    const farben = v < 0 ? ["#2fd6e8","#4c6ff0","#7b3cf0","#1b2a8c","#39b9f0"]
                         : ["#1b2a8c","#2c3fae","#2fd6e8","#6a36d8","#15206e"];
    return d > 0.88 ? "#101540" : ballMischung(farben, Math.floor(x/2), Math.floor(y/2), 3);
  },
  chrono: (u, v, d, x, y) => {
    if(d < 0.3) return d < 0.13 ? "#fff6c0" : (d < 0.22 ? "#ffcf3a" : "#1a1408");
    if(Math.abs(v) < 0.12) return Math.abs(v) > 0.07 ? "#d9a52a" : "#1a1408";
    if(Math.abs(u) < 0.09 || Math.abs(Math.abs(v) - 0.55) < 0.08) return "#d9a52a";
    return d > 0.88 ? "#b8b2a0" : ((x + y) % 2 ? "#f4f1e8" : "#dcd7c8");
  },
  terra: (u, v, d, x, y) => {
    if(d < 0.3) return d < 0.12 ? "#caffd2" : (d < 0.2 ? "#3cf06a" : "#141414");
    if(Math.abs(v) < 0.12) return ballMischung(["#c9a15a","#b58c45","#d8b26a"], x, 1, 9);
    const stein = ballFleck(Math.floor(x/3), Math.floor(y/3), 21) > 0.72;
    if(stein) return ballMischung(["#8a8a8a","#6f6f6f","#a0a0a0"], x, y, 5);
    return d > 0.88 ? "#1f4d18" : ballMischung(["#3f8f2f","#5fb83a","#2d6b22","#4aa334"], x, y, 7);
  },
  lumi: (u, v, d, x, y) => {
    if(d < 0.3) return d < 0.12 ? "#ffffff" : (d < 0.21 ? "#3aa3ff" : "#0e1830");
    if(Math.abs(v) < 0.07) return "#0e1830";
    const zelle = (Math.floor(x/2) + Math.floor(y/2)) % 2;
    const farben = zelle ? ["#ffffff","#d8e2ff","#e9dfff"] : ["#a8b8f5","#b9a8f0","#c6d2ff"];
    return d > 0.9 ? "#8e9ad8" : ballMischung(farben, x, y, 11);
  },
  schatten: (u, v, d, x, y) => {
    if(d < 0.3) return d < 0.12 ? "#f0dcff" : (d < 0.21 ? "#b35cff" : "#0a0712");
    if(Math.abs(v) < 0.11) return Math.abs(u) > 0.55 ? "#d8d4e0" : "#0a0712";
    const glanz = ballFleck(Math.floor(x/2), Math.floor(y/2), 13) > 0.8 || (u < -0.3 && v < -0.4 && ballFleck(x,y,2) > 0.4);
    return glanz ? "#9a3ff0" : ballMischung(["#151020","#2a1f3d","#1e162e","#3a2a55"], x, y, 17);
  },
  aqua: (u, v, d, x, y) => {
    if(d < 0.3) return d < 0.14 ? "#ffffff" : (d < 0.22 ? "#dfe6f0" : "#0b1426");
    if(Math.abs(v) < 0.12) return (Math.abs(v) < 0.05 && Math.abs(u) > 0.35) ? "#f2f6ff" : "#0b1426";
    const farben = v < 0 ? ["#3a8cf0","#79d8f0","#1e5fd0","#5ab0f5"] : ["#1e5fd0","#0e3a8a","#3a8cf0","#2a6ad8"];
    return d > 0.88 ? "#0a2a66" : ballMischung(farben, Math.floor(x/2), Math.floor(y/2), 19);
  },
  nexus: (u, v, d, x, y) => {
    if(d < 0.3) return d < 0.15 ? "#ffffff" : (d < 0.22 ? "#c8f6ff" : "#08070f");
    if(Math.abs(v) < 0.1) return u < 0 ? "#35e0f0" : "#d040f0";
    // Zwei breite Bögen: türkis oben links, violett unten rechts - wie auf der Karte
    const bogenA = Math.abs(Math.sqrt((u+0.15)*(u+0.15) + (v+0.05)*(v+0.05)) - 0.62) < 0.11 && v < 0.05 && u < 0.35;
    const bogenB = Math.abs(Math.sqrt((u-0.15)*(u-0.15) + (v-0.05)*(v-0.05)) - 0.62) < 0.11 && v > -0.05 && u > -0.35;
    if(bogenA) return (x + y) % 3 ? "#35e0f0" : "#8ff4ff";
    if(bogenB) return (x + y) % 3 ? "#c040f0" : "#e690ff";
    if(d > 0.9) return v < 0 ? "#2a3a8a" : "#3a1a60";
    return ballMischung(["#0d0b1a","#161230","#1d1740","#0a0916"], x, y, 23);
  },
  zen: (u, v, d, x, y) => {
    if(d < 0.3) return d < 0.13 ? "#ffffff" : (d < 0.22 ? "#ffe39a" : "#e2b640");
    if(Math.abs(v) < 0.12) return Math.abs(v) > 0.06 ? "#e2b640" : "#7a5a18";
    if(Math.abs(u) < 0.07) return "#e2b640";
    return d > 0.9 ? "#c9c3b0" : ballMischung(["#f4f2ec","#ffffff","#e6e2d6"], x, y, 29);
  }
};
const ballBildSpeicher = {};
function ballBild(id, groesse){
  const g0 = groesse || 60;
  const schluessel = id + "|" + g0;
  if(ballBildSpeicher[schluessel]) return ballBildSpeicher[schluessel];
  const muster = BALL_MUSTER[id] || BALL_MUSTER.normal;
  const N = BALL_PIXEL, c = document.createElement("canvas");
  c.width = c.height = g0;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const px = g0 / N, r = N/2 - 0.5;
  for(let y = 0; y < N; y++) for(let x = 0; x < N; x++){
    const u = (x - r)/r, v = (y - r)/r, d = Math.sqrt(u*u + v*v);
    if(d > 1.02) continue;
    const farbe = muster(u, v, d, x, y);
    if(!farbe) continue;
    g.fillStyle = farbe;
    g.fillRect(Math.floor(x*px), Math.floor(y*px), Math.ceil(px), Math.ceil(px));
  }
  // Ein heller Glanzfleck oben links und ein dunkler Rand unten rechts
  g.fillStyle = "rgba(255,255,255,.22)";
  g.fillRect(Math.floor(5*px), Math.floor(3*px), Math.ceil(2*px), Math.ceil(px));
  g.fillRect(Math.floor(4*px), Math.floor(4*px), Math.ceil(px), Math.ceil(2*px));
  ballBildSpeicher[schluessel] = c.toDataURL();
  return ballBildSpeicher[schluessel];
}
