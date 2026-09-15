// 3D creature viewer for the website and the pitch. Needs creatures.js.
/* ---------------- Building the models ---------------- */
const netze = {};
function modell(art){
  if(netze[art.id]) return netze[art.id];
  const aus = [];
  const m = {beinY:9, fluegelY:12.5, schweben:0, skala:[0.9, 1.0, 1.2][art.rs]};
  REIHEN[art.reihe]((x, y, z, w, h, d, f, teil, bauch, dreh) => artKasten(aus, x, y, z, w, h, d, f, teil, bauch, dreh), art.rs, m);
  // Quads: every face is 6 vertices of 7 numbers
  const flaechen = [];
  let minY = 1e9, maxY = -1e9, maxR = 0;
  for(let i = 0; i < aus.length; i += 42){
    const p = [0, 7, 14, 35].map(o => [aus[i+o]*16, aus[i+o+1]*16 + m.schweben, aus[i+o+2]*16]);
    const uv = [aus[i+3], aus[i+4]];
    for(const q of p){ minY = Math.min(minY, q[1]); maxY = Math.max(maxY, q[1]); maxR = Math.max(maxR, Math.hypot(q[0], q[2])); }
    flaechen.push({p, farbe: Math.floor(uv[0]*4) + Math.floor(uv[1]*2)*4, licht: aus[i+5], teil: aus[i+6]});
  }
  const pal = art.farben.map(hexFarbe);
  netze[art.id] = {flaechen, pal, m, minY, maxY, maxR};
  return netze[art.id];
}

/* Draws a model on a 2D canvas: turned, tilted a bit, back faces first. */
function malen(g, art, dreh, zeit, cx, cy, groesse, laufen){
  const n = modell(art);
  const co = Math.cos(dreh), si = Math.sin(dreh), neig = 0.32, cn = Math.cos(neig), sn = Math.sin(neig);
  const takt = laufen ? Math.sin(zeit*7) * 0.5 : 0;
  const schlag = n.m.schweben ? Math.sin(zeit*9) * 0.45 : Math.sin(zeit*3) * 0.15;
  const schwebe = n.m.schweben ? Math.sin(zeit*2.4) * 0.8 : 0;
  const hoehe = Math.max(18, n.maxY - Math.min(0, n.minY), n.maxR*1.25);
  const S = groesse / hoehe;
  const liste = [];
  for(const f of n.flaechen){
    const q = f.p.map(([x, y, z]) => {
      if(f.teil === 1 || f.teil === 2){
        const a = f.teil === 1 ? takt : -takt, dy = y - n.m.beinY;
        const ny = n.m.beinY + dy*Math.cos(a) - z*Math.sin(a); z = dy*Math.sin(a) + z*Math.cos(a); y = ny;
      } else if(f.teil === 3 || f.teil === 4){
        const a = f.teil === 3 ? schlag : -schlag, dy = y - n.m.fluegelY;
        const ny = n.m.fluegelY + dy*Math.cos(a) - x*Math.sin(a); x = dy*Math.sin(a) + x*Math.cos(a); y = ny;
      }
      y += schwebe;
      const x1 = x*co + z*si, z1 = -x*si + z*co;
      const y2 = y*cn + z1*sn, z2 = z1*cn - y*sn;
      return [cx + x1*S, cy - (y2 - hoehe*0.45)*S, z2];
    });
    liste.push({q, t:(q[0][2]+q[1][2]+q[2][2]+q[3][2])/4, f});
  }
  liste.sort((a, b) => b.t - a.t);
  // Shadow
  g.fillStyle = "rgba(0,0,0,.22)";
  g.beginPath(); g.ellipse(cx, cy + hoehe*0.45*S*cn, n.maxR*S*0.55, n.maxR*S*0.16, 0, 0, Math.PI*2); g.fill();
  for(const {q, f} of liste){
    const c = n.pal[f.farbe] || [200,200,200], L = f.licht;
    g.fillStyle = "rgb(" + (c[0]*L|0) + "," + (c[1]*L|0) + "," + (c[2]*L|0) + ")";
    g.strokeStyle = g.fillStyle; g.lineWidth = 1;
    g.beginPath(); g.moveTo(q[0][0], q[0][1]);
    for(let i = 1; i < 4; i++) g.lineTo(q[i][0], q[i][1]);
    g.closePath(); g.fill(); g.stroke();
  }
}

/* A canvas that fits its box and can be turned with the mouse or a finger */
function buehne(el, zeichne){
  const zustand = {dreh:-0.6, ziehen:false, x:0, zuletzt:0};
  const g = el.getContext("2d");
  const passen = () => { const r = el.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    el.width = Math.round(r.width*d); el.height = Math.round(r.height*d); };
  new ResizeObserver(passen).observe(el); passen();
  el.addEventListener("pointerdown", e => { zustand.ziehen = true; zustand.x = e.clientX; el.style.cursor = "grabbing"; });
  addEventListener("pointerup", () => { zustand.ziehen = false; el.style.cursor = ""; zustand.zuletzt = performance.now(); });
  addEventListener("pointermove", e => { if(!zustand.ziehen) return; zustand.dreh += (e.clientX - zustand.x)*0.012; zustand.x = e.clientX; });
  let sichtbar = true;
  new IntersectionObserver(e => sichtbar = e[0].isIntersecting).observe(el);
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let vorher = performance.now();
  (function schleife(jetzt){
    const dt = Math.min(0.05, (jetzt - vorher)/1000); vorher = jetzt;
    if(sichtbar){
      if(!zustand.ziehen && !ruhig && jetzt - zustand.zuletzt > 1500) zustand.dreh += dt*0.5;
      g.setTransform(1,0,0,1,0,0); g.clearRect(0, 0, el.width, el.height);
      zeichne(g, el.width, el.height, zustand.dreh, ruhig ? 0 : jetzt/1000);
    }
    requestAnimationFrame(schleife);
  })(vorher);
}

const art = id => REIHEN_ARTEN.find(a => a.id === id);
