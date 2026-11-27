// Manichini del dress code: figure ad acquerello in giardino che si «vestono»
// con i colori scelti nel combinatore. Si aggancia alla barra #combo-swatch-bar
// e si ridisegna da solo quando cambia. Non tocca il resto del sito.
(function () {
  const bar = document.getElementById('combo-swatch-bar');
  if (!bar) return;
  const NAMES = {   // pastello dal chiaro al verde, poi i classici
    '#f4ece1': 'Avorio Caldo', '#faedcd': 'Giallo Vaniglia', '#e8dcc4': 'Sabbia Dorata', '#d4c5b9': 'Tortora Chiaro',
    '#dfb76c': 'Tocchi Dorati', '#fed1b2': 'Albicocca Chiaro', '#ffccd5': 'Pesca Tenero', '#dfb5a6': 'Rosa Cipria',
    '#d8b4e2': 'Lilla Lavanda', '#cbb4d4': 'Malva Polveroso', '#e0f4f7': 'Celeste Ghiaccio', '#b8d4e3': 'Azzurro Polvere',
    '#a8dadc': 'Verde Eucalipto', '#bfe5d0': 'Verde Menta', '#9dbf9e': 'Verde Salvia',
    '#fbfaf7': 'Bianco', '#c19a6b': 'Cammello', '#d1a33a': 'Senape', '#c0622f': 'Arancio Bruciato',
    '#b85f45': 'Terracotta', '#7b2d3b': 'Rosso Bordeaux', '#6b4a33': 'Marrone', '#5f7a61': 'Verde Salvia Scuro',
    '#2f4f3a': 'Verde Bosco', '#26344f': 'Blu Navy', '#45474b': 'Grigio Antracite', '#2b2b2d': 'Nero'
  };
  const NEUTRO = '#e4dbd0';
  const BIANCO = '#fbfaf7';

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
  // o = { st:'freddo'|'caldo', <pezzo>: colore, ... }
  const CAMICIA_BIANCA = '#fdfbf7';
  const scarpe = (d, col) => `<path d="${d}" fill="${col}" class="mk-china-s"/>`;
  const fiorellino = (x, y, r, col) => `<g class="mk-china-s"><circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/><circle cx="${x + r * 1.2}" cy="${y + r * .9}" r="${r}" fill="${col}"/><circle cx="${x - r * .25}" cy="${y + r * 1.4}" r="${r}" fill="${col}"/></g><circle cx="${x + r * .3}" cy="${y + r * .75}" r="${r * .45}" fill="${shade(col, -0.3)}"/>`;
  let CLIP = 0;
  // braccia e gambe sottili: contorno a china sotto, pelle sopra
  const arto = d => `<path d="${d}" class="mk-braccio-c"/><path d="${d}" class="mk-braccio-b"/>`;
  const cravatta = col => `<path d="M58 53 L62 53 L61.3 57.5 L58.7 57.5 Z M58.7 57.5 L61.3 57.5 L63 79 L60 83 L57 79 Z" fill="${col}" class="mk-china"/>`;

  function B_uomo(o) {
    const f = o.st === 'freddo';
    const pant = 'M42 128 L78 128 L75 284 L64 284 L60.5 152 L57 284 L46 284 Z';
    const maniche = f ? o.giacca : o.camicia;
    let s = `<svg viewBox="0 0 120 300" aria-hidden="true">
      <ellipse cx="60" cy="291" rx="26" ry="3.5" class="mk-ombra"/>
      ${capo(pant, o.pantaloni)}
      <path d="M51 140 L51.5 282 M69 140 L68.5 282" class="mk-piega"/>
      ${scarpe('M43 288.5 Q43.5 282 51 282 Q58 282 59.5 288.5 Z M61 288.5 Q62 282 69 282 Q76.5 282 77.5 288.5 Z', o.scarpe)}
      ${capo('M43 54 Q35 57 33 88 Q31.5 108 31 124 L39.5 124.5 Q40 108 41.5 90 Z', maniche)}
      ${capo('M77 54 Q85 57 87 88 Q88.5 108 89 124 L80.5 124.5 Q80 108 78.5 90 Z', maniche)}
      <path d="M56 36 Q60 44 64 36 L64 50 Q60 53 56 50 Z" class="mk-pelle"/>`;
    if (f) {
      s += `${capo('M41 54 Q60 47 79 54 L82 132 Q70 136 61 130 L60 122 L59 130 Q50 136 38 132 Z', o.giacca)}
      <clipPath id="mk-v${++CLIP}"><path d="M54 50 L60 84 L66 50 Q60 47 54 50 Z"/></clipPath>
      <path d="M54 50 L60 84 L66 50 Q60 47 54 50 Z" fill="${CAMICIA_BIANCA}"/>
      <g clip-path="url(#mk-v${CLIP})">${cravatta(o.cravatta).replace('L63 79 L60 83 L57 79', 'L63.6 92 L60 96 L56.4 92')}</g>
      <path d="M54 50 L60 84 L66 50" class="mk-china"/>
      <path d="M50 51 L60 96 L70 51" class="mk-china"/>
      <circle cx="60" cy="108" r="1.2" class="mk-bottone"/><circle cx="60" cy="118" r="1.2" class="mk-bottone"/>
      ${fiorellino(49.5, 62, 2.2, o.fiore)}`;
    } else {
      s += `${capo('M41 54 Q60 47 79 54 L79 129 L41 129 Z', o.camicia)}
      <path d="M41.5 125 L78.5 125 L78.5 131.5 L41.5 131.5 Z" fill="${o.cintura}" class="mk-china"/>
      <rect x="57.3" y="125.6" width="5.4" height="5.3" rx="1" fill="none" class="mk-china"/>
      ${cravatta(o.cravatta)}
      ${capo('M40.5 55 L53 51 L60 83 L67 51 L79.5 55 L80 124 L62 128.5 L60 123.5 L58 128.5 L40 124 Z', o.gilet)}
      <path d="M53.5 49 L60 55 L56 60 Z M66.5 49 L60 55 L64 60 Z" fill="${o.camicia}" class="mk-china"/>
      <circle cx="60" cy="96" r="1.1" class="mk-bottone"/><circle cx="60" cy="105" r="1.1" class="mk-bottone"/><circle cx="60" cy="114" r="1.1" class="mk-bottone"/>`;
    }
    return s + `<ellipse cx="35.2" cy="129" rx="3.3" ry="4.6" class="mk-pelle"/><ellipse cx="84.8" cy="129" rx="3.3" ry="4.6" class="mk-pelle"/>
      <ellipse cx="60" cy="25" rx="9.5" ry="12" transform="rotate(-4 60 25)" class="mk-pelle mk-china-s"/>
      <path d="M50.5 22 Q50 9 61 9 Q71 9 70 21 Q66 14 58 15 Q53 16 50.5 22 Z" class="mk-capelli"/>
    </svg>`;
  }

  function B_donna(o) {
    const f = o.st === 'freddo';
    const busto = 'M48 58 Q54 54 60 58 Q66 54 72 58 L68 100 Q60 103 52 100 Z';
    const gonna = 'M52 99 Q61 102 68 99 Q80 170 104 282 Q86 292 62 286 Q40 293 20 284 Q44 176 52 99 Z';
    return `<svg viewBox="0 0 120 300" aria-hidden="true">
      <ellipse cx="62" cy="293" rx="36" ry="3.5" class="mk-ombra"/>
      <path d="M58 46 L58 57 M64 46 L64 57" class="mk-china"/>
      ${arto('M48 59 Q38 82 41 104 Q43 118 39 128')}
      ${arto('M72 59 Q86 76 80 94 Q76 100 69 99')}
      <path d="M47 59 Q45 52 52 52 L70 52 Q76 52 73 59 Z" class="mk-pelle"/>
      ${scarpe('M47 294 Q47.5 287.5 53.5 287.5 Q59 287.5 59.5 294 Z M63 294 Q63.5 287.5 69.5 287.5 Q75 287.5 75.5 294 Z', o.scarpe)}
      ${capo(gonna, o.abito)}
      <path d="M58 108 Q52 200 44 286 M63 108 Q70 200 80 286 M60 120 Q62 200 62 286" class="mk-piega"/>
      ${capo(busto, o.abito)}
      <path d="M51 96 Q60 100 69 96 L69 102 Q60 106 51 102 Z" fill="${o.cintura}" class="mk-china"/>
      <path d="M69 99 q6 3 3 9 q-4 -4 -6 -7 z" fill="${o.cintura}" class="mk-china"/>
      ${f ? capo('M46 56 Q35 80 37.5 104 Q38.5 111 37.8 117 L44.6 117.5 Q45.5 110 44.5 103 Q42 84 50.5 62 Z', o.coprispalle) + capo('M70 56 Q88 70 84 94 Q81 100 75 101.5 L74 95 Q77 93 77 90 Q79 78 69.5 64 Z', o.coprispalle)
        + capo('M46 55 Q52 51 57.5 54 Q56 78 55.5 100 L56.5 123 Q49.5 125.5 42.5 121 Q45 100 45.5 78 Z', o.coprispalle)
        + capo('M74 55 Q68 51 62.5 54 Q64 78 64.5 100 L63.5 123 Q70.5 125.5 77.5 121 Q75 100 74.5 78 Z', o.coprispalle)
        + '<circle cx="56.3" cy="92" r=".9" class="mk-bottone"/><circle cx="56.3" cy="104" r=".9" class="mk-bottone"/>' : ''}
      <rect x="31" y="124" width="14" height="10" rx="2.5" fill="${o.borsa}" filter="url(#mk-acq)" class="mk-china-s"/>
      <path d="M33.5 124 Q38 117 42.5 124" class="mk-china"/>
      <ellipse cx="61" cy="34" rx="8.5" ry="11" transform="rotate(6 61 34)" class="mk-pelle mk-china-s"/>
      <path d="M53 34 Q50 16 62 18 Q74 18 71 34 Q70 26 64 24 Q58 26 53 34 Z" class="mk-capelli"/>
      <path d="M70 26 Q82 34 76 50 Q74 40 69 34" class="mk-capelli"/>
      <circle cx="66" cy="18" r="5.5" class="mk-capelli"/>
      ${fiorellino(55, 20, 2.6, o.fiore)}
    </svg>`;
  }

  // bimba e bimbo stanno nelle stesse coordinate (y 140-292) dentro un viewBox 120x300
  function B_bimba(o) {
    const f = o.st === 'freddo';
    const busto = 'M51 184 Q60 180 69 184 L67 205 L53 205 Z';
    const gonna = 'M53 204 L67 204 Q82 222 92 248 Q76 257 60 252 Q44 257 28 248 Q38 222 53 204 Z';
    return `
      <ellipse cx="60" cy="291" rx="22" ry="3" class="mk-ombra"/>
      ${arto('M55 252 L54 282 M65 252 L66 282')}
      ${scarpe('M48 287.5 Q49 281.5 54 281.5 Q59 281.5 59.5 287.5 Z M61 287.5 Q61.5 281.5 66.5 281.5 Q71.5 281.5 72 287.5 Z', o.scarpe)}
      ${arto('M52 186 Q41 194 34 206')}
      ${arto('M68 186 Q79 194 86 206')}
      <path d="M57 170 L57 182 L63 182 L63 170 Z" class="mk-pelle"/>
      ${capo(gonna, o.abito)}
      <path d="M58 210 Q50 232 42 252 M62 210 Q70 232 78 252" class="mk-piega"/>
      ${capo(busto, o.abito)}
      <path d="M52.6 201 L67.4 201 L67 206.5 L53 206.5 Z" fill="${o.cintura}" class="mk-china"/>
      ${f ? capo('M51 183.5 Q41 189 35.5 200 L40 203.5 Q45 194 53 189 Z', o.coprispalle) + capo('M69 183.5 Q79 189 84.5 200 L80 203.5 Q75 194 67 189 Z', o.coprispalle)
        + capo('M49.5 184 Q54.5 181 58.3 183 Q57.2 197 57 212.5 Q52 214 46.5 211.5 Q48.5 198 49.5 184 Z', o.coprispalle)
        + capo('M70.5 184 Q65.5 181 61.7 183 Q62.8 197 63 212.5 Q68 214 73.5 211.5 Q71.5 198 70.5 184 Z', o.coprispalle) : ''}
      <ellipse cx="60" cy="160" rx="11" ry="12" class="mk-pelle mk-china-s"/>
      <path d="M49 160 Q47 146 60 146 Q73 146 71 160 Q66 152 60 152 Q54 152 49 160 Z" class="mk-capelli"/>
      <path d="M49 156 Q40 160 42 172 M71 156 Q80 160 78 172" class="mk-capelli-s"/>
      <path d="M60 147 L51 142 L52 152 Z M60 147 L69 142 L68 152 Z" fill="${o.fiocco}" class="mk-china"/>`;
  }

  function B_bimbo(o) {
    const f = o.st === 'freddo';
    const pant = 'M51.5 214 L68.5 214 L67.5 283 L61.5 283 L60 230 L58.5 283 L52.5 283 Z';
    const maniche = f ? o.giacca : o.camicia;
    let s = `
      <ellipse cx="60" cy="291" rx="20" ry="3" class="mk-ombra"/>
      ${capo(pant, o.pantaloni)}
      ${scarpe('M50 288 Q50.5 282 55.5 282 Q60 282 60.5 288 Z M60.5 288 Q61 282 65.5 282 Q70.5 282 71 288 Z', o.scarpe)}
      ${capo('M51 185 L44 211 L48.5 213 L55 193 Z', maniche)}
      ${capo('M69 185 L76 211 L71.5 213 L65 193 Z', maniche)}
      <ellipse cx="46" cy="216" rx="2.8" ry="3.6" class="mk-pelle"/><ellipse cx="74" cy="216" rx="2.8" ry="3.6" class="mk-pelle"/>
      <path d="M57 170 L57 182 L63 182 L63 170 Z" class="mk-pelle"/>`;
    if (f) {
      s += `${capo('M51 184 Q60 180 69 184 L69 216 L51 216 Z', CAMICIA_BIANCA)}
      ${capo('M51 185 L56.5 183 L60 200 L63.5 183 L69 185 L70 220 Q60 223.5 50 220 Z', o.giacca)}
      <path d="M56.5 183 L57.5 193 L59 194 M63.5 183 L62.5 193 L61 194" class="mk-china"/>
      <circle cx="60" cy="207" r=".9" class="mk-bottone"/><circle cx="60" cy="214" r=".9" class="mk-bottone"/>
      ${fiorellino(53.2, 193.5, 1.35, o.fiore)}`;
    } else {
      s += `${capo('M51 184 Q60 180 69 184 L69.5 216 L50.5 216 Z', o.camicia)}
      <path d="M51 211.5 L69 211.5 L69 216.5 L51 216.5 Z" fill="${o.cintura}" class="mk-china"/>
      <rect x="58.2" y="211.8" width="3.6" height="4.4" rx=".8" fill="none" class="mk-china"/>
      <circle cx="60" cy="196" r=".9" class="mk-bottone"/><circle cx="60" cy="203" r=".9" class="mk-bottone"/>`;
    }
    return s + `<path d="M60 187 L53.5 183.5 L53.5 190.5 Z M60 187 L66.5 183.5 L66.5 190.5 Z" fill="${o.papillon}" class="mk-china"/>
      <ellipse cx="60" cy="160" rx="11" ry="12" class="mk-pelle mk-china-s"/>
      <path d="M49 158 Q48 145 60 145 Q72 145 71 158 Q68 151 61 151 Q53 151 49 158 Z" class="mk-capelli"/>`;
  }
  function B_piccoli(lei, lui) {
    return `<svg viewBox="0 0 170 300" aria-hidden="true"><g transform="translate(-12 0)">${B_bimba(lei)}</g><g transform="translate(62 0)">${B_bimbo(lui)}</g></svg>`;
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
  #mk-box,.mk-scope{--ink:#4a3b2c;--tratto:#4a3b2c;--pelle:#efe5d8;--capelli:#6b5643}
  #mk-box{position:relative;overflow:hidden;margin:0 -18px 20px;padding:14px 8px 12px;border-radius:18px;
    border:1px solid #c5d8c5;text-align:center;background-color:#fbf7ee;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .38 0 0 0 0 .3 0 0 0 .09 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23f)'/%3E%3C/svg%3E")}
  body.night-mode #mk-box,body.night-mode .mk-scope{--ink:#d6e5da;--tratto:#17120c;--pelle:#bfb2a2;--capelli:#8f7b67}
  body.night-mode #mk-box{background-color:rgba(16,34,22,.95);border-color:rgba(94,135,96,.38)}
  .mk-scope .mk-tit{position:relative;z-index:1;font:700 10px/1.2 'Plus Jakarta Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);opacity:.65;margin-bottom:6px}
  .mk-scope .mk-row{position:relative;display:flex;justify-content:center;align-items:flex-end}
  .mk-scope figure{position:relative;z-index:1;flex:1 1 0;margin:0;min-width:0}
  .mk-scope figure.mk-due{flex:1.42 1 0}
  .mk-scope figure svg{display:block;width:100%;height:230px}
  .mk-scope figcaption{font-family:'Alex Brush',cursive;font-size:22px;line-height:1;color:var(--ink);margin-top:2px}
  .mk-scope .mk-sfondo{position:absolute;left:-8px;top:0;width:calc(100% + 16px);height:236px;z-index:0;pointer-events:none}
  .mk-scope .mk-leg{position:relative;z-index:1;font:500 11px/1.45 'Plus Jakarta Sans',sans-serif;color:var(--ink);opacity:.8;margin-top:8px;padding:0 6px}
  .mk-scope .mk-leg b{font-weight:700}
  .mk-scope .mk-pelle{fill:var(--pelle);stroke:var(--tratto);stroke-opacity:.4;stroke-width:1}
  .mk-scope .mk-capelli{fill:var(--capelli);filter:url(#wc1)}
  .mk-scope .mk-capelli-s{fill:none;stroke:var(--capelli);stroke-width:4;stroke-linecap:round}
  .mk-scope .mk-scarpe{fill:var(--ink);opacity:.75}
  .mk-scope .mk-ombra{fill:var(--ink);opacity:.12}
  .mk-scope .mk-braccio-b{fill:none;stroke:var(--pelle);stroke-width:4.2;stroke-linecap:round}
  .mk-scope .mk-china:not([fill]){fill:none}
  .mk-scope .mk-china{stroke:var(--tratto);stroke-width:1.05;stroke-linejoin:round;stroke-linecap:round;opacity:.85}
  .mk-scope .mk-china-s{stroke:var(--tratto);stroke-width:.8;stroke-opacity:.8}
  .mk-scope .mk-piega{fill:none;stroke:var(--tratto);stroke-width:.6;opacity:.35;stroke-linecap:round}
  .mk-scope .mk-china,.mk-scope .mk-china-s,.mk-scope .mk-piega{filter:url(#ink1)}
  .mk-scope .mk-pelle{filter:none}
  .mk-scope .mk-bottone{fill:var(--tratto);opacity:.6}
  .mk-scope .mk-base{opacity:.9}
  .mk-scope .mk-tratt{opacity:.22}
  body.night-mode .mk-scope .mk-base{opacity:.92}
  body.night-mode .mk-scope .mk-tratt{opacity:0}
  .mk-scope .mk-braccio-c{fill:none;stroke:var(--tratto);stroke-width:5.9;stroke-linecap:round;opacity:.7}
  body.night-mode .mk-scope .mk-china{opacity:1;stroke-width:1.25}
  body.night-mode .mk-scope .mk-china-s{stroke-opacity:1;stroke-width:1}
  body.night-mode .mk-scope .mk-pelle{stroke-opacity:.7}
  body.night-mode .mk-scope .mk-piega{opacity:.5}

  .mk-scope figure.mk-tocca{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .2s}
  .mk-scope figure.mk-tocca:active{transform:scale(.97)}
  #mk-box .mk-hint{position:relative;z-index:1;font:600 11px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--ink);opacity:.75;margin-top:6px}
  #mk-box .mk-hint span{display:inline-block;padding:4px 10px;border-radius:999px;border:1px dashed currentColor}
  #mk-pers{position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;background:rgba(43,33,24,.45);opacity:0;pointer-events:none;transition:opacity .25s}
  #mk-pers.aperto{opacity:1;pointer-events:auto}
  #mk-pers .mk-foglio{width:100%;max-width:480px;max-height:92vh;overflow:auto;border-radius:22px 22px 0 0;padding:14px 16px 18px;background-color:#fbf7ee;box-shadow:0 -10px 40px rgba(0,0,0,.25);transform:translateY(30px);transition:transform .3s}
  #mk-pers.aperto .mk-foglio{transform:none}
  body.night-mode #mk-pers .mk-foglio{background:#13241a}
  #mk-pers .mk-testa{display:flex;align-items:center;justify-content:space-between}
  #mk-pers .mk-testa h4{margin:0;font-family:'Alex Brush',cursive;font-size:30px;font-weight:400;color:var(--ink)}
  #mk-pers .mk-x{width:36px;height:36px;border-radius:50%;border:1px solid rgba(74,59,44,.25);background:transparent;color:var(--ink);font-size:18px;line-height:1}
  #mk-pers .mk-grande{display:flex;justify-content:center;margin:2px 0 8px;border-radius:16px;background:linear-gradient(180deg,rgba(157,191,158,.08),rgba(157,191,158,.25))}
  #mk-pers .mk-grande svg{height:250px;width:auto;display:block}
  #mk-pers .mk-pezzi{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:10px}
  #mk-pers .mk-pezzo{font:600 12px 'Plus Jakarta Sans',sans-serif;padding:7px 12px;border-radius:999px;border:1px solid rgba(74,59,44,.25);background:transparent;color:var(--ink);display:inline-flex;align-items:center;gap:6px}
  #mk-pers .mk-pezzo i{width:12px;height:12px;border-radius:50%;border:1px solid rgba(0,0,0,.15);display:inline-block}
  #mk-pers .mk-pezzo.attivo{background:#4c6f4e;border-color:#4c6f4e;color:#fff}
  #mk-pers .mk-tavolozza{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;justify-items:center}
  #mk-pers .mk-tav{width:38px;height:38px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.18);position:relative}
  #mk-pers .mk-tav.scelto{outline:3px solid #4c6f4e;outline-offset:2px}
  #mk-pers .mk-nome{font:600 12px 'Plus Jakarta Sans',sans-serif;text-align:center;color:var(--ink);opacity:.8;margin:10px 0 4px;min-height:16px}
  #mk-pers .mk-azioni{display:flex;gap:8px;margin-top:12px}
  #mk-pers .mk-azioni button{flex:1;font:700 13px 'Plus Jakarta Sans',sans-serif;padding:11px;border-radius:14px;border:1px solid #4c6f4e;background:transparent;color:var(--ink)}
  #mk-pers .mk-azioni .mk-ok{background:#4c6f4e;color:#fff}
  .mk-scope .mk-stag{position:relative;z-index:2;display:flex;justify-content:center;gap:6px;margin:0 0 6px}
  .mk-scope .mk-stag button{font:600 11.5px 'Plus Jakarta Sans',sans-serif;padding:6px 11px;border-radius:999px;border:1px solid rgba(74,59,44,.28);background:rgba(255,255,255,.55);color:var(--ink);cursor:pointer}
  .mk-scope .mk-stag button[aria-pressed="true"]{background:#4c6f4e;border-color:#4c6f4e;color:#fff}
  body.night-mode .mk-scope .mk-stag button{background:rgba(255,255,255,.06);border-color:rgba(214,229,218,.3)}
  body.night-mode .mk-scope .mk-stag button[aria-pressed="true"]{background:#5e8760;border-color:#5e8760}
  #mk-pers .mk-stag{margin:6px 0 8px}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- riquadro sotto la barra ----------
  const box = document.createElement('div');
  box.id = 'mk-box';
  box.setAttribute('aria-live', 'polite');
  bar.insertAdjacentElement('afterend', box);


  // ---------- chi indossa cosa ----------
  // principali = vestiti del colore principale (1° colore per lui e il bimbo, 2° per lei e la bimba)
  // dettagli   = presi a turno dagli altri colori, così due dettagli vicini cambiano colore
  // divisibili = (camicia), pantaloni: si staccano solo quando i colori sono più dei dettagli
  const SCHEMA = {
    uomo:  { nome: 'Lui',   prim: 0,
      freddo: { principali: ['giacca', 'pantaloni'], dettagli: ['cravatta', 'fiore', 'scarpe'], ordine: ['giacca', 'pantaloni', 'cravatta', 'fiore', 'scarpe'] },
      caldo:  { principali: ['gilet', 'camicia', 'pantaloni'], dettagli: ['cravatta', 'cintura', 'scarpe'], divisibili: ['camicia', 'pantaloni'], ordine: ['camicia', 'gilet', 'cravatta', 'cintura', 'pantaloni', 'scarpe'] } },
    donna: { nome: 'Lei',   prim: 1,
      freddo: { principali: ['abito'], dettagli: ['coprispalle', 'cintura', 'borsa', 'fiore', 'scarpe'], ordine: ['abito', 'coprispalle', 'cintura', 'borsa', 'fiore', 'scarpe'] },
      caldo:  { principali: ['abito'], dettagli: ['cintura', 'borsa', 'fiore', 'scarpe'], ordine: ['abito', 'cintura', 'borsa', 'fiore', 'scarpe'] } },
    bimba: { nome: 'Bimba', prim: 1,
      freddo: { principali: ['abito'], dettagli: ['coprispalle', 'cintura', 'fiocco', 'scarpe'], ordine: ['abito', 'coprispalle', 'cintura', 'fiocco', 'scarpe'] },
      caldo:  { principali: ['abito'], dettagli: ['cintura', 'fiocco', 'scarpe'], ordine: ['abito', 'cintura', 'fiocco', 'scarpe'] } },
    bimbo: { nome: 'Bimbo', prim: 0,
      freddo: { principali: ['giacca', 'pantaloni'], dettagli: ['papillon', 'fiore', 'scarpe'], ordine: ['giacca', 'pantaloni', 'papillon', 'fiore', 'scarpe'] },
      caldo:  { principali: ['camicia', 'pantaloni'], dettagli: ['papillon', 'cintura', 'scarpe'], ordine: ['camicia', 'papillon', 'cintura', 'pantaloni', 'scarpe'] } }
  };
  const CHI = ['uomo', 'donna', 'bimba', 'bimbo'];
  const ETICHETTA = { giacca: 'Giacca', pantaloni: 'Pantaloni', cravatta: 'Cravatta', scarpe: 'Scarpe', gilet: 'Gilet', camicia: 'Camicia',
    cintura: 'Cintura', abito: 'Abito', coprispalle: 'Coprispalle', borsa: 'Borsa', fiocco: 'Fiocco', papillon: 'Papillon' };
  const etichetta = (chi, k) => k === 'fiore' ? (chi === 'uomo' || chi === 'bimbo' ? 'Fiore all\'occhiello' : 'Fiore nei capelli') : ETICHETTA[k];

  let STAG = 'freddo';                                        // scelta per tutti
  let OVR = { uomo: {}, donna: {}, bimba: {}, bimbo: {} };    // ritocchi a mano: colori per pezzo e "st"
  let ultimiColori = '';

  // inizio del giro dei dettagli per ciascuno: calcolato sulla scelta per tutti (STAG),
  // così se cambi freddo/caldo a una sola persona gli altri non cambiano colori
  // pezzi principali che prendono un colore loro quando i dettagli sono finiti
  const divisibili = S => S.divisibili || (S.principali.includes('pantaloni') ? ['pantaloni'] : []);
  function assegna(cols, st) {
    const N = cols.length, V = {}, inizio = {};
    let q = 0;
    const prossimo = p => { if (N < 2) return cols[0]; do { q = (q + 1) % N; } while (q === p); return cols[q]; };
    if (N) CHI.forEach(chi => {
      const S = SCHEMA[chi][STAG], p = SCHEMA[chi].prim % N;
      inizio[chi] = q;
      S.dettagli.forEach(() => prossimo(p));
      divisibili(S).forEach((k, i) => { if (N > S.dettagli.length + 1 + i) prossimo(p); });
    });
    CHI.forEach(chi => {
      const S = SCHEMA[chi][st[chi]], o = { st: st[chi] };
      q = inizio[chi] || 0;
      if (!N) { S.ordine.forEach(k => { o[k] = NEUTRO; }); V[chi] = o; return; }
      const p = SCHEMA[chi].prim % N;
      S.principali.forEach(k => { o[k] = cols[p]; });
      S.dettagli.forEach(k => { o[k] = prossimo(p); });
      divisibili(S).forEach((k, i) => { if (N > S.dettagli.length + 1 + i) o[k] = prossimo(p); });
      if (chi === 'uomo' && N <= 2 && o.camicia) o.camicia = BIANCO;
      V[chi] = o;
    });
    return V;
  }

  function vestiti() {
    const cols = [...bar.children].map(el => rgb2hex(el.style.backgroundColor)).filter(Boolean);
    if (cols.join() !== ultimiColori) {          // colori cambiati: via i ritocchi di colore, resta freddo/caldo
      CHI.forEach(k => { OVR[k] = OVR[k].st ? { st: OVR[k].st } : {}; });
      ultimiColori = cols.join();
    }
    const st = {}; CHI.forEach(k => { st[k] = OVR[k].st || STAG; });
    const V = assegna(cols, st);
    CHI.forEach(k => { Object.assign(V[k], OVR[k]); });
    return { V, cols, vuoto: cols.length === 0 };
  }

  const n = h => NAMES[h] || 'neutro';
  function riassunto(chi, o) {
    const g = new Map();
    SCHEMA[chi][o.st].ordine.forEach(k => { if (!g.has(o[k])) g.set(o[k], []); g.get(o[k]).push(etichetta(chi, k).toLowerCase()); });
    return [...g].map(([h, ks]) => (ks.length > 1 ? ks.slice(0, -1).join(', ') + ' e ' + ks[ks.length - 1] : ks[0]) + ' ' + n(h)).join(', ');
  }
  const bottoniStag = (attuale, perChi) => `<div class="mk-stag" role="group" aria-label="Che tempo fa">
      <button type="button" data-st="freddo"${perChi ? ` data-chi="${perChi}"` : ''} aria-pressed="${attuale === 'freddo'}">🧥 Se fa freddo</button>
      <button type="button" data-st="caldo"${perChi ? ` data-chi="${perChi}"` : ''} aria-pressed="${attuale === 'caldo'}">☀️ Se fa caldo</button></div>`;

  function svgDi(chi, o) {
    SEME = 0;
    if (chi === 'uomo') return B_uomo(o);
    if (chi === 'donna') return B_donna(o);
    return `<svg viewBox="10 132 100 162" aria-hidden="true">${chi === 'bimba' ? B_bimba(o) : B_bimbo(o)}</svg>`;
  }

  function draw() {
    const { V, cols, vuoto } = vestiti();
    SEME = 0;
    const uomo = B_uomo(V.uomo), donna = B_donna(V.donna), piccoli = B_piccoli(V.bimba, V.bimbo);
    const ritocchi = CHI.some(k => Object.keys(OVR[k]).some(x => x !== 'st'));
    let leg = '';
    if (cols.length === 1 && !ritocchi) {
      leg = `<div class="mk-leg">Tutta la famiglia in <b>${n(cols[0])}</b>: aggiungi altri colori per abbinarli.</div>`;
    } else if (!vuoto) {
      leg = `<div class="mk-leg">${CHI.map(k => `<b>${SCHEMA[k].nome}:</b> ${riassunto(k, V[k])}`).join('<br>')}</div>`;
    }
    box.innerHTML = `
      <div class="mk-tit">${vuoto ? 'Scegli i colori e i manichini si vestono' : 'Un\'idea per vestirsi così'}</div>
      ${bottoniStag(STAG)}
      <div class="mk-row">${SFONDO}
        <figure class="mk-tocca" data-chi="uomo" role="button" tabindex="0" aria-label="Vesti Lui">${uomo}<figcaption>Lui</figcaption></figure>
        <figure class="mk-tocca" data-chi="donna" role="button" tabindex="0" aria-label="Vesti Lei">${donna}<figcaption>Lei</figcaption></figure>
        <figure class="mk-tocca mk-due" data-chi="piccoli" role="button" tabindex="0" aria-label="Vesti i piccoli">${piccoli}<figcaption>Piccoli</figcaption></figure>
      </div>
      <div class="mk-hint"><span>👆 Tocca un manichino per vestirlo come vuoi</span></div>${leg}`;
  }

  // ---------- pannello «Vesti …» ----------
  const pers = document.createElement('div');
  pers.id = 'mk-pers'; pers.className = 'mk-scope';
  pers.setAttribute('role', 'dialog'); pers.setAttribute('aria-modal', 'true');
  document.body.appendChild(pers);
  let aperto = null, pezzoAttivo = null;
  function disegnaPannello() {
    const { V } = vestiti();
    const o = V[aperto], ordine = SCHEMA[aperto][o.st].ordine;
    if (!ordine.includes(pezzoAttivo)) pezzoAttivo = ordine[0];
    const corrente = o[pezzoAttivo];
    pers.setAttribute('aria-label', 'Vesti ' + SCHEMA[aperto].nome);
    pers.innerHTML = `<div class="mk-foglio">
      <div class="mk-testa"><h4>Vesti ${SCHEMA[aperto].nome}</h4><button type="button" class="mk-x" aria-label="Chiudi">✕</button></div>
      ${bottoniStag(o.st, aperto)}
      <div class="mk-grande">${svgDi(aperto, o)}</div>
      <div class="mk-pezzi">${ordine.map(k => `<button type="button" class="mk-pezzo${k === pezzoAttivo ? ' attivo' : ''}" data-k="${k}"><i style="background:${o[k]}"></i>${etichetta(aperto, k)}</button>`).join('')}</div>
      <div class="mk-tavolozza">${PALETTE.map(h => `<button type="button" class="mk-tav${h === corrente ? ' scelto' : ''}" data-h="${h}" style="background:${h}" aria-label="${NAMES[h]}"></button>`).join('')}</div>
      <div class="mk-nome">${etichetta(aperto, pezzoAttivo)}: ${n(corrente)}</div>
      <div class="mk-azioni"><button type="button" class="mk-reset">Rimetti i miei colori</button><button type="button" class="mk-ok">Fatto</button></div>
    </div>`;
  }
  const PALETTE = Object.keys(NAMES);
  function apri(chi) { aperto = chi; pezzoAttivo = null; disegnaPannello(); pers.classList.add('aperto'); }
  function chiudi() { pers.classList.remove('aperto'); aperto = null; }
  box.addEventListener('click', e => {
    const b = e.target.closest('.mk-stag button');
    if (b) { STAG = b.dataset.st; CHI.forEach(k => { delete OVR[k].st; }); return draw(); }
    const f = e.target.closest('figure.mk-tocca'); if (!f) return;
    let chi = f.dataset.chi;
    if (chi === 'piccoli') { const r = f.getBoundingClientRect(); chi = (e.clientX - r.left) < r.width / 2 ? 'bimba' : 'bimbo'; }
    apri(chi);
  });
  box.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('figure.mk-tocca')) { e.preventDefault(); apri(e.target.dataset.chi === 'piccoli' ? 'bimba' : e.target.dataset.chi); } });
  pers.addEventListener('click', e => {
    if (e.target === pers || e.target.closest('.mk-x') || e.target.closest('.mk-ok')) return chiudi();
    const b = e.target.closest('.mk-stag button'); if (b) { OVR[aperto].st = b.dataset.st; draw(); return disegnaPannello(); }
    const pz = e.target.closest('.mk-pezzo'); if (pz) { pezzoAttivo = pz.dataset.k; return disegnaPannello(); }
    const t = e.target.closest('.mk-tav'); if (t) { OVR[aperto][pezzoAttivo] = t.dataset.h; draw(); return disegnaPannello(); }
    if (e.target.closest('.mk-reset')) { OVR[aperto] = OVR[aperto].st ? { st: OVR[aperto].st } : {}; draw(); return disegnaPannello(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && aperto) chiudi(); });
  box.classList.add('mk-scope');
  new MutationObserver(draw).observe(bar, { childList: true });
  draw();
})();
