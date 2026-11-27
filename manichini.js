// Manichini del dress code: figure ad acquerello in giardino che si «vestono»
// con i colori scelti nel combinatore. Si aggancia alla barra #combo-swatch-bar
// e si ridisegna da solo quando cambia. Non tocca il resto del sito.
(function () {
  const bar = document.getElementById('combo-swatch-bar');
  if (!bar) return;
  const NAMES = {
    '#9dbf9e': 'Verde Salvia', '#dfb5a6': 'Rosa Cipria', '#b8d4e3': 'Azzurro Polvere', '#faedcd': 'Giallo Vaniglia',
    '#d8b4e2': 'Lilla Lavanda', '#ffccd5': 'Pesca Tenero', '#f4ece1': 'Avorio Caldo', '#d4c5b9': 'Tortora Chiaro',
    '#e0f4f7': 'Celeste Ghiaccio', '#dfb76c': 'Tocchi Dorati', '#bfe5d0': 'Verde Menta', '#fed1b2': 'Albicocca Chiaro',
    '#cbb4d4': 'Malva Polveroso', '#a8dadc': 'Verde Eucalipto', '#e8dcc4': 'Sabbia Dorata'
  };
  const NEUTRO = '#e4dbd0';

  function rgb2hex(s) {
    const m = String(s).match(/\d+/g); if (!m) return null;
    return '#' + m.slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('');
  }
  function shade(hex, p) {
    const n = parseInt(hex.slice(1), 16);
    const f = c => Math.max(0, Math.min(255, Math.round(c + (p < 0 ? c : 255 - c) * p)));
    return '#' + [f(n >> 16 & 255), f(n >> 8 & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
  }


  // ---------- filtri: acquerello, china, tratteggio ----------
  const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <filter id="mk-acq" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="4"/>
    </filter></defs></svg>`;
  document.body.insertAdjacentHTML('beforeend', DEFS);
  const wcDef = (id, seed, freq) => `
    <filter id="${id}" x="-15%" y="-15%" width="130%" height="130%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="${seed}" result="n1"/>
      <feDisplacementMap in="SourceGraphic" in2="n1" scale="${freq}" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="${seed + 20}" result="n2"/>
      <feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.32" result="mask"/>
      <feComposite in="d" in2="mask" operator="in" result="macchie"/>
      <feMorphology in="d" operator="erode" radius="1.1" result="er"/>
      <feComposite in="d" in2="er" operator="out" result="bordo"/>
      <feColorMatrix in="bordo" type="matrix" values=".72 0 0 0 0  0 .72 0 0 0  0 0 .72 0 0  0 0 0 .75 0" result="bordoScuro"/>
      <feMerge><feMergeNode in="macchie"/><feMergeNode in="bordoScuro"/></feMerge>
    </filter>`;
  const DEFS3 = `<svg width="0" height="0" style="position:absolute"><defs>
    ${wcDef('wc0', 3, 5)}${wcDef('wc1', 8, 5)}${wcDef('wc2', 13, 5)}${wcDef('wc3', 21, 5)}
    ${wcDef('wcL0', 5, 10)}${wcDef('wcL1', 9, 10)}${wcDef('wcL2', 17, 10)}
    <filter id="ink1" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="4" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="1" seed="6" result="g"/>
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.7 1.25" result="gm"/>
      <feComposite in="d" in2="gm" operator="in"/>
    </filter>
    <pattern id="tratteggio" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <line x1="0" y1="0" x2="0" y2="3.2" stroke="#4a3b2c" stroke-width=".55"/>
    </pattern>
    <linearGradient id="grMaschera" x1="0" x2="1"><stop offset=".55" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
    <mask id="latoDestro" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#grMaschera)"/></mask>
  </defs></svg>`;
  document.body.insertAdjacentHTML('beforeend', DEFS3);

  // un capo: base, acquerello a macchie, tratteggio in ombra, contorno a china
  let SEME = 0;
  function capo(d, col) {
    const k = SEME++;
    return `<path d="${d}" fill="${col}" filter="url(#mk-acq)" class="mk-base"/>
      <path d="${d}" fill="${col}" filter="url(#wc${k % 4})" opacity=".95"/>
      <path d="${d}" fill="url(#tratteggio)" mask="url(#latoDestro)" class="mk-tratt"/>
      <path d="${d}" class="mk-china"/>`;
  }

  // ---------- figure (senza faccia) ----------
  function B_uomo(c) {
    const giacca = 'M41 54 Q60 47 79 54 L82 132 Q70 136 61 130 L60 122 L59 130 Q50 136 38 132 Z';
    const pant = 'M42 128 L78 128 L75 284 L64 284 L60.5 152 L57 284 L46 284 Z';
    return `<svg viewBox="0 0 120 300" aria-hidden="true">
      <ellipse cx="60" cy="291" rx="26" ry="3.5" class="mk-ombra"/>
      ${capo(pant, c.pant || shade(c.a, -0.14))}
      <path d="M51 140 L51.5 282 M69 140 L68.5 282" class="mk-piega"/>
      <path d="M44 287 q7 -6 15 0 z M62 287 q8 -6 15 0 z" class="mk-scarpe"/>
      <path d="M42 57 Q35 92 39 126" stroke="${c.a}" stroke-width="10" stroke-linecap="round" fill="none" filter="url(#mk-acq)"/>
      <path d="M78 57 Q87 92 85 124" stroke="${c.a}" stroke-width="10" stroke-linecap="round" fill="none" filter="url(#mk-acq)"/>
      <path d="M37 57 Q30 92 34 126 M83 57 Q92 92 90 124" class="mk-china"/>
      <ellipse cx="86" cy="132" rx="3.5" ry="5" class="mk-pelle"/>
      <path d="M56 36 Q60 44 64 36 L64 50 Q60 53 56 50 Z" class="mk-pelle"/>
      ${capo(giacca, c.a)}
      <path d="M54 50 L60 84 L66 50 Q60 47 54 50 Z" fill="#fdfbf7" class="mk-china"/>
      <path d="M50 51 L60 96 L70 51" class="mk-china"/>
      <path d="M60 56 L52 51 L52 61 Z M60 56 L68 51 L68 61 Z" fill="${c.b}" class="mk-china"/>
      <circle cx="60" cy="56" r="1.8" fill="${shade(c.b, -0.2)}"/>
      <path d="M69 72 L77 72 L74.5 66 L72.5 69.5 L70.5 66 Z" fill="${c.c}" class="mk-china"/>
      <circle cx="60" cy="108" r="1.2" class="mk-bottone"/><circle cx="60" cy="118" r="1.2" class="mk-bottone"/>
      ${c.fiore ? `<g class="mk-china-s"><circle cx="50" cy="62" r="2.2" fill="${c.fiore}"/><circle cx="52.6" cy="64" r="2.2" fill="${c.fiore}"/><circle cx="49.4" cy="65" r="2.2" fill="${c.fiore}"/></g><circle cx="50.7" cy="63.7" r="1" fill="${shade(c.fiore, -0.3)}"/>` : ''}
      <ellipse cx="60" cy="25" rx="9.5" ry="12" transform="rotate(-4 60 25)" class="mk-pelle mk-china-s"/>
      <path d="M50.5 22 Q50 9 61 9 Q71 9 70 21 Q66 14 58 15 Q53 16 50.5 22 Z" class="mk-capelli"/>
    </svg>`;
  }
  function B_donna(c) {
    const busto = 'M48 58 Q54 54 60 58 Q66 54 72 58 L68 100 Q60 103 52 100 Z';
    const gonna = 'M52 99 Q61 102 68 99 Q80 170 104 282 Q86 292 62 286 Q40 293 20 284 Q44 176 52 99 Z';
    return `<svg viewBox="0 0 120 300" aria-hidden="true">
      <ellipse cx="62" cy="292" rx="36" ry="3.5" class="mk-ombra"/>
      <path d="M58 46 L58 57 M64 46 L64 57" class="mk-china"/>
      <path d="M48 59 Q38 82 41 104 Q43 118 39 128" class="mk-braccio-b"/>
      <path d="M72 59 Q86 76 80 94 Q76 100 69 99" class="mk-braccio-b"/>
      <path d="M47 59 Q45 52 52 52 L70 52 Q76 52 73 59 Z" class="mk-pelle"/>
      ${capo(gonna, c.b)}
      <path d="M58 108 Q52 200 44 286 M63 108 Q70 200 80 286 M60 120 Q62 200 62 286" class="mk-piega"/>
      ${capo(busto, c.b)}
      <path d="M51 96 Q60 100 69 96 L69 102 Q60 106 51 102 Z" fill="${c.c}" class="mk-china"/>
      <path d="M69 99 q6 3 3 9 q-4 -4 -6 -7 z" fill="${c.c}" class="mk-china"/>
      <rect x="31" y="124" width="14" height="9" rx="2.5" fill="${c.a}" filter="url(#mk-acq)" class="mk-china-s"/>
      <ellipse cx="61" cy="34" rx="8.5" ry="11" transform="rotate(6 61 34)" class="mk-pelle mk-china-s"/>
      <path d="M53 34 Q50 16 62 18 Q74 18 71 34 Q70 26 64 24 Q58 26 53 34 Z" class="mk-capelli"/>
      <path d="M70 26 Q82 34 76 50 Q74 40 69 34" class="mk-capelli"/>
      <circle cx="66" cy="18" r="5.5" class="mk-capelli"/>
      ${c.fiore ? `<g class="mk-china-s"><circle cx="55" cy="20" r="2.6" fill="${c.fiore}"/><circle cx="58" cy="22" r="2.6" fill="${c.fiore}"/><circle cx="54.5" cy="23.6" r="2.6" fill="${c.fiore}"/></g><circle cx="55.8" cy="22" r="1.1" fill="${shade(c.fiore, -0.3)}"/>` : ''}
    </svg>`;
  }
  function B_bimbi(c) {
    const busto = 'M51 184 Q60 180 69 184 L67 205 L53 205 Z';
    const gonna = 'M53 204 L67 204 Q82 222 92 248 Q76 257 60 252 Q44 257 28 248 Q38 222 53 204 Z';
    return `<svg viewBox="0 0 120 300" aria-hidden="true">
      <ellipse cx="60" cy="291" rx="22" ry="3" class="mk-ombra"/>
      <path d="M55 252 L54 282 M65 252 L66 282" class="mk-braccio-b"/>
      <path d="M48 287 q5 -6 11 0 z M61 287 q5 -6 11 0 z" fill="${c.b}" class="mk-china-s"/>
      <path d="M52 186 Q41 194 34 206" class="mk-braccio-b"/>
      <path d="M68 186 Q79 194 86 206" class="mk-braccio-b"/>
      <path d="M57 170 L57 182 L63 182 L63 170 Z" class="mk-pelle"/>
      ${capo(gonna, c.c)}
      <path d="M58 210 Q50 232 42 252 M62 210 Q70 232 78 252" class="mk-piega"/>
      ${capo(busto, c.c)}
      <ellipse cx="60" cy="160" rx="11" ry="12" class="mk-pelle mk-china-s"/>
      <path d="M49 160 Q47 146 60 146 Q73 146 71 160 Q66 152 60 152 Q54 152 49 160 Z" class="mk-capelli"/>
      <path d="M49 156 Q40 160 42 172 M71 156 Q80 160 78 172" class="mk-capelli-s"/>
      <path d="M60 147 L51 142 L52 152 Z M60 147 L69 142 L68 152 Z" fill="${c.a}" class="mk-china"/>
    </svg>`;
  }

  function B_bimbo(c) {
    const pant = 'M51.5 214 L68.5 214 L67.5 283 L61.5 283 L60 230 L58.5 283 L52.5 283 Z';
    return `
      <ellipse cx="60" cy="291" rx="20" ry="3" class="mk-ombra"/>
      ${capo(pant, c.pant || shade(c.a, -0.14))}
      <path d="M50 287 q5 -6 11 0 z M60 287 q5 -6 11 0 z" class="mk-scarpe"/>
      ${capo('M51 185 L44 211 L48.5 213 L55 193 Z', '#fdfbf7')}
      ${capo('M69 185 L76 211 L71.5 213 L65 193 Z', '#fdfbf7')}
      <ellipse cx="46" cy="216" rx="2.8" ry="3.6" class="mk-pelle"/><ellipse cx="74" cy="216" rx="2.8" ry="3.6" class="mk-pelle"/>
      <path d="M57 170 L57 182 L63 182 L63 170 Z" class="mk-pelle"/>
      ${capo('M51 184 Q60 180 69 184 L69 216 L51 216 Z', '#fdfbf7')}
      ${capo('M51 186 L56 184 L60 200 L64 184 L69 186 L69 214 Q60 219 51 214 Z', c.c)}
      <circle cx="60" cy="205" r=".9" class="mk-bottone"/><circle cx="60" cy="211" r=".9" class="mk-bottone"/>
      <path d="M60 187 L53.5 183.5 L53.5 190.5 Z M60 187 L66.5 183.5 L66.5 190.5 Z" fill="${c.a}" class="mk-china"/>
      <ellipse cx="60" cy="160" rx="11" ry="12" class="mk-pelle mk-china-s"/>
      <path d="M49 158 Q48 145 60 145 Q72 145 71 158 Q68 151 61 151 Q53 151 49 158 Z" class="mk-capelli"/>`;
  }
  const RUOLI = ['giacca papà', 'abito mamma', 'vestitino bimba', 'gilet bimbo', 'papillon papà', 'cintura mamma', 'fiocco bimba', 'papillon bimbo', 'pochette papà', 'borsetta mamma', 'pantaloni bimbo', 'fiore nei capelli', 'scarpe bimba', 'fiore all\'occhiello', 'pantaloni papà'];
  function ruoli(c) {
    const L = c.L && c.L.length ? c.L : [c.a];
    const r = RUOLI.map((_, i) => L[i % L.length]);
    if (L.length < 15) r[14] = null;      // pantaloni papà = come la giacca
    if (L.length < 12) r[11] = null;      // fiore nei capelli solo con tanti colori
    if (L.length < 14) r[13] = null;      // fiore all'occhiello solo con tanti colori
    return r;
  }
  const R_uomo = c => { const r = ruoli(c); return { a: r[0], b: r[4], c: r[8], fiore: r[13], pant: r[14] }; };
  const R_donna = c => { const r = ruoli(c); return { a: r[9], b: r[1], c: r[5], fiore: r[11] }; };
  function B_piccoli(c) {
    if (c.L) { const r = ruoli(c); c = { lei: { a: r[6], b: r[12], c: r[2] }, lui: { a: r[7], c: r[3], pant: r[10] } }; }
    else c = { lei: c, lui: c };
    const lui = c.lui; const lei0 = c.lei; c = lei0;
    const lei = B_bimbi(c).replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    return `<svg viewBox="0 0 170 300" aria-hidden="true"><g transform="translate(-12 0)">${lei}</g><g transform="translate(62 0)">${B_bimbo(lui)}</g></svg>`;
  }
  const SFONDO = `<svg class="mk-sfondo" viewBox="0 0 360 330" preserveAspectRatio="none">
      <g filter="url(#wcL1)"><path d="M0 268 Q90 252 180 262 Q270 272 360 256 L360 330 L0 330 Z" fill="#b9d3b0" opacity=".55"/>
      <path d="M0 288 Q120 276 240 290 Q300 296 360 284 L360 330 L0 330 Z" fill="#9dbf9e" opacity=".5"/>
      <circle cx="352" cy="70" r="40" fill="#a9c7a3" opacity=".35"/><circle cx="330" cy="104" r="26" fill="#9dbf9e" opacity=".3"/>
      <path d="M350 110 L352 262 L358 262 L358 108" fill="#8a6f55" opacity=".35"/>
      <circle cx="8" cy="96" r="30" fill="#a9c7a3" opacity=".3"/></g>
      <g fill="#dfb5a6" opacity=".6"><ellipse cx="70" cy="120" rx="3" ry="1.6" transform="rotate(30 70 120)"/><ellipse cx="250" cy="70" rx="3" ry="1.6" transform="rotate(-20 250 70)"/><ellipse cx="180" cy="40" rx="3" ry="1.6"/></g></svg>`;

  // ---------- stile ----------
  const css = `
  #mk-box{--ink:#4a3b2c;--pelle:#efe5d8;--capelli:#6b5643;position:relative;overflow:hidden;margin:0 -18px 20px;padding:14px 8px 12px;border-radius:18px;
    border:1px solid #c5d8c5;text-align:center;background-color:#fbf7ee;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .38 0 0 0 0 .3 0 0 0 .09 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23f)'/%3E%3C/svg%3E")}
  body.night-mode #mk-box{--ink:#d6e5da;--pelle:#bfb2a2;--capelli:#8f7b67;background-color:rgba(16,34,22,.95);border-color:rgba(94,135,96,.38)}
  #mk-box .mk-tit{position:relative;z-index:1;font:700 10px/1.2 'Plus Jakarta Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);opacity:.65;margin-bottom:6px}
  #mk-box .mk-row{position:relative;display:flex;justify-content:center;align-items:flex-end}
  #mk-box figure{position:relative;z-index:1;flex:1 1 0;margin:0;min-width:0}
  #mk-box figure.mk-due{flex:1.42 1 0}
  #mk-box figure svg{display:block;width:100%;height:230px}
  #mk-box figcaption{font-family:'Alex Brush',cursive;font-size:22px;line-height:1;color:var(--ink);margin-top:2px}
  #mk-box .mk-sfondo{position:absolute;left:-8px;top:0;width:calc(100% + 16px);height:236px;z-index:0;pointer-events:none}
  #mk-box .mk-leg{position:relative;z-index:1;font:500 11px/1.45 'Plus Jakarta Sans',sans-serif;color:var(--ink);opacity:.8;margin-top:8px;padding:0 6px}
  #mk-box .mk-leg b{font-weight:700}
  #mk-box .mk-pelle{fill:var(--pelle);stroke:var(--ink);stroke-opacity:.4;stroke-width:1}
  #mk-box .mk-capelli{fill:var(--capelli);filter:url(#wc1)}
  #mk-box .mk-capelli-s{fill:none;stroke:var(--capelli);stroke-width:4;stroke-linecap:round}
  #mk-box .mk-scarpe{fill:var(--ink);opacity:.75}
  #mk-box .mk-ombra{fill:var(--ink);opacity:.12}
  #mk-box .mk-braccio-b{fill:none;stroke:var(--pelle);stroke-width:4.2;stroke-linecap:round}
  #mk-box .mk-china:not([fill]){fill:none}
  #mk-box .mk-china{stroke:var(--ink);stroke-width:1.05;stroke-linejoin:round;stroke-linecap:round;opacity:.85}
  #mk-box .mk-china-s{stroke:var(--ink);stroke-width:.8;stroke-opacity:.8}
  #mk-box .mk-piega{fill:none;stroke:var(--ink);stroke-width:.6;opacity:.35;stroke-linecap:round}
  #mk-box .mk-china,#mk-box .mk-china-s,#mk-box .mk-piega{filter:url(#ink1)}
  #mk-box .mk-pelle{filter:none}
  #mk-box .mk-bottone{fill:var(--ink);opacity:.6}
  #mk-box .mk-base{opacity:.6}
  #mk-box .mk-tratt{opacity:.22}
  body.night-mode #mk-box .mk-base{opacity:.92}
  body.night-mode #mk-box .mk-tratt{opacity:0}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- riquadro sotto la barra ----------
  const box = document.createElement('div');
  box.id = 'mk-box';
  box.setAttribute('aria-live', 'polite');
  bar.insertAdjacentElement('afterend', box);

  function draw() {
    const cols = [...bar.children].map(el => rgb2hex(el.style.backgroundColor)).filter(Boolean);
    const vuoto = cols.length === 0;
    const c = vuoto ? { a: NEUTRO, b: NEUTRO, c: NEUTRO } : { L: cols };
    const n = h => NAMES[h] || 'neutro';
    SEME = 0;
    const uomo = B_uomo(vuoto ? c : R_uomo(c));
    const donna = B_donna(vuoto ? c : R_donna(c));
    const piccoli = B_piccoli(c);
    let leg = '';
    if (cols.length === 1) {
      leg = `<div class="mk-leg">Tutta la famiglia in <b>${n(cols[0])}</b>: aggiungi altri colori per abbinarli.</div>`;
    } else if (!vuoto) {
      const r = ruoli(c), g = i => n(r[i]);
      leg = `<div class="mk-leg"><b>Lui:</b> giacca ${g(0)}${r[14] ? ', pantaloni ' + g(14) : ''}, papillon ${g(4)}, pochette ${g(8)}${r[13] ? ', fiore all\'occhiello ' + g(13) : ''}<br>
        <b>Lei:</b> abito ${g(1)}, cintura ${g(5)}, borsetta ${g(9)}${r[11] ? ', fiore nei capelli ' + g(11) : ''}<br>
        <b>Piccoli:</b> vestitino ${g(2)}, fiocco ${g(6)}, scarpe ${g(12)}; gilet ${g(3)}, papillon ${g(7)}, pantaloni ${g(10)}</div>`;
    }
    box.innerHTML = `
      <div class="mk-tit">${vuoto ? 'Scegli i colori e i manichini si vestono' : 'Un\'idea per vestirsi così'}</div>
      <div class="mk-row" aria-hidden="true">${SFONDO}
        <figure>${uomo}<figcaption>Lui</figcaption></figure>
        <figure>${donna}<figcaption>Lei</figcaption></figure>
        <figure class="mk-due">${piccoli}<figcaption>Piccoli</figcaption></figure>
      </div>${leg}`;
  }
  new MutationObserver(draw).observe(bar, { childList: true });
  draw();
})();
