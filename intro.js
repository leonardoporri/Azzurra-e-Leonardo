/* ANIMAZIONE DI APERTURA: l'aeroplanino di carta scende da sopra le nuvole,
   il sito si avvicina, l'aereo fa il giro della morte intorno ai nomi ed esce
   dal bordo destro; poi parte la pioggia di petali.
   Regole: parte a ogni apertura e a ogni ricarica, si salta con un tocco o
   con Esc, non parte con "riduci movimento". Se si arriva da un link a una
   sezione (#...), alla fine porta a quella sezione.
   Quando finisce manda l'evento 'intro-finita' (lo usano i suoni della band
   per scaricarsi dopo, senza rallentare l'animazione). */
(function () {
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ---------- disegni pre-calcolati (si fanno una volta sola) ----------
  function cloudSprite(w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    const puffs = [];
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
      puffs.push({ x: w / 2 + Math.cos(a) * d * w * .3, y: h * .56 + Math.sin(a) * d * h * .16 - rnd() * h * .1, r: h * (.16 + rnd() * .2) });
    }
    // ombra sotto (grigio-azzurro caldo), poi luce sopra
    for (const p of puffs) {
      const gr = g.createRadialGradient(p.x, p.y + p.r * .25, 0, p.x, p.y + p.r * .25, p.r);
      gr.addColorStop(0, 'rgba(196,204,214,.55)'); gr.addColorStop(1, 'rgba(196,204,214,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y + p.r * .25, p.r, 0, 7); g.fill();
    }
    for (const p of puffs) {
      const gr = g.createRadialGradient(p.x - p.r * .2, p.y - p.r * .3, 0, p.x, p.y, p.r);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(255,252,247,.85)'); gr.addColorStop(1, 'rgba(255,250,244,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
    }
    return c;
  }

  const PLANE_SVG = '<svg viewBox="0 0 48 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M46 16 L2 2 L14 16 Z" fill="#fcfaf5" stroke="#5e8760" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<path d="M46 16 L14 16 L2 30 Z" fill="#edd5cc" stroke="#5e8760" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<path d="M46 16 L14 16 L18 22 Z" fill="#dfb5a6" stroke="#5e8760" stroke-width=".9" stroke-linejoin="round"/></svg>';

  // ---------- scena comune: tela a tutto schermo + zoom sul sito ----------
  function makeStage() {
    const ov = document.createElement('div');
    ov.id = 'intro-overlay';
    ov.setAttribute('aria-hidden', 'true');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;overflow:hidden;cursor:pointer;-webkit-tap-highlight-color:transparent;pointer-events:auto';
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;will-change:transform';
    ov.appendChild(cv);
    document.documentElement.appendChild(ov); // fuori dal body: il body viene "zoomato"
    // Nuvole e cielo sono sfumati: basta meta' dei pixel (la tela viene poi
    // allargata a tutto schermo). Il telefono lavora 4 volte meno a ogni
    // fotogramma e l'aereo (disegnato a parte, nitido) non scatta piu'.
    const dpr = .5;
    const W = innerWidth, H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ov, cv, g, W, H };
  }

  // Zoom e sfocatura solo sulla copertina e sulla barra in alto (cio' che si
  // vede): prima toccava tutta la pagina, molto piu' lunga e pesante da ridisegnare.
  let zoomEls = null;
  function setSiteZoom(scale, ox, oy, blur) {
    if (scale >= .999 && !blur) {
      if (zoomEls) zoomEls.forEach(z => { z.el.style.transform = ''; z.el.style.transformOrigin = ''; z.el.style.filter = ''; z.el.style.willChange = ''; });
      zoomEls = null; document.documentElement.style.background = ''; document.body.style.background = '';
      return;
    }
    if (!zoomEls) {
      zoomEls = [document.getElementById('hero'), document.querySelector('header')].filter(Boolean)
        .map(el => { const r = el.getBoundingClientRect(); el.style.willChange = 'transform'; return { el, l: r.left, t: r.top }; });
      document.documentElement.style.background = '#9dbf9e'; document.body.style.background = '#9dbf9e';
    }
    zoomEls.forEach(z => {
      z.el.style.transformOrigin = (ox - z.l) + 'px ' + (oy - z.t) + 'px';
      z.el.style.transform = 'scale(' + scale.toFixed(4) + ')';
      z.el.style.filter = blur ? 'blur(' + blur.toFixed(2) + 'px)' : '';
    });
  }

  function namesTarget() {
    const n = document.getElementById('hero-names');
    if (!n) return { x: innerWidth / 2, y: innerHeight * .4, el: null, w: 200 };
    const r = n.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, el: n, w: r.width, top: r.top, right: r.right };
  }

  // ---------- A. AEROPLANINO DA SOPRA LE NUVOLE ----------
  function introA(st, done) {
    const { ov, g, W, H } = st;
    seed = 11;
    const sprites = [cloudSprite(420, 220), cloudSprite(420, 220), cloudSprite(420, 220)];
    const target = namesTarget();

    // nuvole nello spazio: x,y in "schermi", z = distanza
    const clouds = [];
    for (let i = 0; i < 46; i++) {
      const z = 1.2 + i * 0.13 + rnd() * .1;
      let x = (rnd() - .5) * 3.2, y = (rnd() - .35) * 2.2;
      if (z > 3.5 && Math.abs(x) < .35) x += x < 0 ? -.45 : .45; // le ultime lasciano un varco al centro
      clouds.push({ x, y, z, s: sprites[i % 3], w: .9 + rnd() * .9 });
    }
    clouds.sort((a, b) => b.z - a.z);

    const plane = document.createElement('div');
    plane.innerHTML = PLANE_SVG;
    plane.style.cssText = 'position:absolute;left:0;top:0;width:48px;height:32px;will-change:transform;filter:drop-shadow(0 6px 6px rgba(43,63,44,.28))';
    ov.appendChild(plane);

    const T_CAM = 1900;
    const CAM_END = 1.2 + 46 * .13 + .3;
    let t0 = null; // il tempo parte dal primo fotogramma vero: niente salto iniziale se il telefono e' ancora occupato
    let raf;

    // ---- il volo: una linea disegnata a punti, che finisce fuori dal bordo destro ----
    const tx = target.x, ty = target.y, EXIT = { x: W + 140, y: target.top - 6 };
    const pts = [];
    const add = (x, y) => pts.push({ x, y });
    const bz = (a, b, c, d, n) => { for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; add(u*u*u*a.x + 3*u*u*t*b.x + 3*u*t*t*c.x + t*t*t*d.x, u*u*u*a.y + 3*u*u*t*b.y + 3*u*t*t*c.y + t*t*t*d.y); } };
    let T_FLY = 3000, profile = t => t;
    {                               // GIRO DELLA MORTE: arriva, fa un giro completo sopra i nomi, esce     // GIRO DELLA MORTE: arriva, fa un giro completo sopra i nomi, esce
      // sul telefono resta com'e'; sugli schermi larghi il giro si adatta all'altezza
      // della finestra, cosi' l'aereo non esce mai dall'alto
      let R = W * .26, RX = R;
      if (W >= 768) { R = Math.min(R, Math.max(60, (ty + H * .1 - 56) / 2)); RX = Math.min(W * .26, R * 1.5); }
      const cx = tx, cy = ty + H * .1 - R;
      const start = { x: cx, y: cy + R };
      bz({ x: -W * .2, y: H * .05 }, { x: W * .2, y: H * .1 }, { x: cx - W * .45, y: start.y }, start, 100);
      for (let i = 1; i <= 160; i++) { const th = Math.PI / 2 - (i / 160) * Math.PI * 2; add(cx + RX * Math.cos(th), cy + R * Math.sin(th)); }
      bz(start, { x: start.x + W * .25, y: start.y }, { x: W * .8, y: EXIT.y + 6 }, EXIT, 80);
      profile = t => t - .12 * Math.sin(2 * Math.PI * t) / (2 * Math.PI);
      T_FLY = 3300;
    }
    // misura della linea: la velocita' segue la lunghezza vera, non i punti
    const LEN = [0];
    for (let i = 1; i < pts.length; i++) LEN.push(LEN[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const TOTAL = LEN[LEN.length - 1] || 1;
    function at(d) {
      d = clamp(d, 0, TOTAL);
      let lo = 0, hi = LEN.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (LEN[m] < d) lo = m; else hi = m; }
      const f = (d - LEN[lo]) / Math.max(1e-6, LEN[hi] - LEN[lo]);
      return { x: lerp(pts[lo].x, pts[hi].x, f), y: lerp(pts[lo].y, pts[hi].y, f) };
    }
    function where(t) { return at(profile(clamp(t, 0, 1)) * TOTAL); }
    function dirAt(t) { const a = where(t - .006), b = where(t + .006); return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI; }
    let angU = null, bank = 0, lastNow = null;

    function frame(now) {
      if (t0 === null) t0 = now;
      const ms = now - t0;
      // passo di tempo reale: inclinazione uguale a 60 o 120 fotogrammi al secondo
      const dt = lastNow === null ? 16.7 : clamp(now - lastNow, 1, 50); lastNow = now;
      const tc = easeInOut(clamp(ms / T_CAM, 0, 1));
      const camZ = tc * CAM_END;
      g.clearRect(0, 0, W, H);

      // cielo: azzurro chiaro in alto, crema e cipria verso l'orizzonte
      const skyA = 1 - smooth(span(ms, T_CAM * .38, T_CAM * .72));
      if (skyA > 0) {
        g.globalAlpha = skyA;
        const sky = g.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#9fc0d6'); sky.addColorStop(.55, '#d9e4e6'); sky.addColorStop(.85, '#f4ece1'); sky.addColorStop(1, '#edd5cc');
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        // sole velato
        const sun = g.createRadialGradient(W * .78, H * .16, 0, W * .78, H * .16, W * .55);
        sun.addColorStop(0, 'rgba(255,248,225,.95)'); sun.addColorStop(.3, 'rgba(255,240,205,.35)'); sun.addColorStop(1, 'rgba(255,240,205,0)');
        g.fillStyle = sun; g.fillRect(0, 0, W, H);
        g.globalAlpha = 1;
      }

      // sito: lontano e piccolo, poi a grandezza vera
      const ts = span(ms, T_CAM * .3, T_CAM * 1.05);
      const scale = lerp(.45, 1, easeInOut(ts));
      setSiteZoom(scale, W / 2, target.y, (1 - ts) * 4);

      // nuvole in prospettiva: quelle vicine escono dai bordi
      const F = Math.min(W, 520) * .9;
      for (const c of clouds) {
        const dz = c.z - camZ;
        if (dz < .12) continue;
        const k = 1 / dz;
        const cw = c.s.width * c.w * k * F / 420, ch = c.s.height * c.w * k * F / 420;
        const sx = W / 2 + c.x * W * .5 * k * 1.1, sy = H * .48 + c.y * H * .5 * k;
        let a = clamp((dz - .12) / .5, 0, 1) * clamp((7 - dz) / 1.5, 0, 1);
        if (a <= 0 || sx + cw / 2 < 0 || sx - cw / 2 > W || sy + ch / 2 < 0 || sy - ch / 2 > H) continue;
        g.globalAlpha = a;
        g.drawImage(c.s, sx - cw / 2, sy - ch / 2, cw, ch);
      }
      g.globalAlpha = 1;

      // aeroplanino
      const tp = clamp(ms / T_FLY, 0, 1);
      const p = where(tp);
      let a = dirAt(tp);
      if (angU === null) angU = a;
      let dd = a - angU; while (dd > 180) dd -= 360; while (dd < -180) dd += 360; angU += dd;
      let turn = dirAt(tp + .02) - dirAt(tp - .02); while (turn > 180) turn -= 360; while (turn < -180) turn += 360;
      bank += (clamp(turn * 1.2, -50, 50) - bank) * (1 - Math.pow(.85, dt / 16.7));   // si inclina in virata
      const size = lerp(5.2, 1.1, easeOut(clamp(tp / .7, 0, 1))); // grande vicino a noi, piccolo sul sito
      plane.style.transform = `translate(${p.x - 24}px,${p.y - 16}px) rotate(${angU}deg) scale(${size}) scaleY(${Math.cos(bank * Math.PI / 180).toFixed(3)})`;
      // uscito dal bordo destro: sparisce, e partono i petali del sito
      if (tp >= 1 || (tp > .6 && p.x - 24 * size > W + 4)) {
        done(300);
        if (target.el) setTimeout(() => target.el.dispatchEvent(new MouseEvent('click', { bubbles: true })), 120);
        return;
      }
      if (window.togliCopertura) { window.togliCopertura(); window.togliCopertura = null; } // il cielo vero e' disegnato: via la copertura
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }

  // ---------- comune ----------
  function playIntro(opts) {
    opts = opts || {};
    const old = document.getElementById('intro-overlay'); if (old) old.remove();
    setSiteZoom(1);
    if (reduce() && !opts.ignoreReduce) { if (window.togliCopertura) window.togliCopertura(); if (opts.onEnd) opts.onEnd('ridotto'); return; }
    window.scrollTo(0, 0);
    const st = makeStage();
    let finished = false, cancel = () => {};
    function done(fade) {
      if (finished) return; finished = true; cancel();
      if (window.togliCopertura) window.togliCopertura();
      setSiteZoom(1);
      const end = () => { st.ov.remove(); if (opts.onEnd) opts.onEnd('fine'); };
      if (!fade) return end();
      st.ov.style.pointerEvents = 'none';
      st.ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fade, easing: 'ease-out', fill: 'forwards' }).onfinish = end;
    }
    st.ov.addEventListener('pointerdown', () => done(180)); // salta con un tocco
    const onKey = e => { if (e.key === 'Escape') { done(180); removeEventListener('keydown', onKey); } };
    addEventListener('keydown', onKey);
    cancel = introA(st, done);
  }

  // ---------- avvio: a ogni apertura e ricarica ----------
  window.introAttiva = true;
  const hash = location.hash;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  playIntro({
    ignoreReduce: false,
    onEnd: () => {
      window.introAttiva = false;
      // se si era arrivati con un link a una sezione, ci si va adesso
      if (hash && hash.length > 1) { const t = document.getElementById(decodeURIComponent(hash.slice(1))); if (t) t.scrollIntoView(); }
      window.dispatchEvent(new Event('intro-finita'));
    }
  });
})();
