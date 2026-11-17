/**
 * Matrimonio Azzurra & Leonardo - collegamento tra il sito e il foglio Google
 *
 * Questo codice va incollato nell'editor Apps Script collegato al foglio
 * Google (Estensioni > Apps Script). Istruzioni complete in FOGLIO-GOOGLE.md
 * nella cartella principale del repository.
 *
 * Fa due cose:
 * 1. CONFERMA PRESENZA: scrive ogni risposta come nuova riga nella scheda
 *    "Risposte" e dice al sito {"ok": true} solo se la riga e' salvata davvero.
 * 2. VOTO CANZONI (anonimo): scrive i voti nella scheda "Voti canzoni", una
 *    riga per ogni canzone votata. Ogni telefono ha un codice casuale, che non
 *    dice chi e' la persona, e puo' votare fino a 3 canzoni diverse (una riga
 *    ciascuna). Puo' anche togliere un suo voto. La classifica si calcola
 *    contando le righe: se cancelli una riga (es. un voto spazzatura),
 *    sparisce dalla classifica. I voti gia' presenti restano validi.
 */

// Metti true se vuoi anche un'email per ogni conferma presenza (all'indirizzo
// dell'account Google che pubblica lo script). Chiede un permesso in piu'.
var INVIA_EMAIL = false;

var FOGLIO_RISPOSTE = 'Risposte';
var INTESTAZIONI_RISPOSTE = [
  'Data e ora',
  'Nome e cognome',
  'Email',
  'Telefono',
  'Presenza',
  'Numero partecipanti',
  'Altri partecipanti',
  'Esigenze alimentari',
  'Messaggio per gli sposi'
];

var FOGLIO_VOTI = 'Voti canzoni';
var INTESTAZIONI_VOTI = ['Data e ora', 'Codice votante', 'Canzone'];

// Quante canzoni mostrare al massimo nella classifica sul sito.
var MAX_CANZONI_CLASSIFICA = 30;

// Quante canzoni diverse puo' votare ogni telefono.
var MAX_VOTI_PER_TELEFONO = 3;

// Il sito controlla questo numero per sapere se lo script e' aggiornato.
var VERSIONE_SCRIPT = 2;

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var dati = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Campo trappola per i robot: le persone non lo vedono e lo lasciano vuoto.
    if (dati._gotcha) {
      return risposta_({ ok: true, classifica: [] });
    }

    if (dati.tipo === 'voto') {
      return salvaVoto_(dati);
    }
    if (dati.tipo === 'togli') {
      return togliVoto_(dati);
    }
    return salvaConferma_(dati);
  } catch (err) {
    return risposta_({ ok: false, errore: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// ?azione=classifica restituisce la classifica delle canzoni.
// Senza parametri serve solo a controllare che lo script sia attivo.
function doGet(e) {
  var azione = e && e.parameter && e.parameter.azione;
  if (azione === 'classifica') {
    var out = { ok: true, versione: VERSIONE_SCRIPT, max: MAX_VOTI_PER_TELEFONO, classifica: classifica_() };
    var votante = pulisci_(e.parameter.votante).slice(0, 80);
    if (votante.length >= 6) {
      var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FOGLIO_VOTI);
      out.mie = sh ? righeDelVotante_(sh, votante).map(function (r) { return r.canzone; }) : [];
    }
    return risposta_(out);
  }
  return risposta_({ ok: true, messaggio: 'Collegamento attivo' });
}

// ---------- Conferma presenza ----------

function salvaConferma_(dati) {
  var nome = pulisci_(dati.Nome_e_Cognome);
  var email = pulisci_(dati.Email);
  var presenza = pulisci_(dati.Presenza);
  // L'email non e' piu' obbligatoria: il sito non la chiede (manda '—').
  if (!nome || !presenza) {
    return risposta_({ ok: false, errore: 'Campi obbligatori mancanti' });
  }

  var altri = [];
  for (var i = 2; i <= 5; i++) {
    var n = pulisci_(dati['Nome_Ospite_' + i]);
    if (n) altri.push(n);
  }

  var viene = presenza.indexOf('Purtroppo') === -1;
  var riga = [
    new Date(),
    nome,
    email,
    comeTesto_(pulisci_(dati.Telefono)), // testo: non perde lo 0 iniziale
    presenza,
    viene ? pulisci_(dati.Numero_Ospiti) : '0',
    viene ? altri.join(', ') : '',
    viene ? pulisci_(dati.Esigenze_Alimentari) : '',
    pulisci_(dati.Messaggio_per_gli_sposi)
  ];

  foglio_(FOGLIO_RISPOSTE, INTESTAZIONI_RISPOSTE).appendRow(riga);

  if (INVIA_EMAIL) {
    try {
      var testo = INTESTAZIONI_RISPOSTE.map(function (t, k) { return t + ': ' + riga[k]; }).join('\n');
      MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
        'Nuova conferma presenza: ' + nome, testo);
    } catch (errEmail) {
      // L'email e' un di piu': se fallisce, la riga e' comunque salvata.
    }
  }

  return risposta_({ ok: true });
}

// ---------- Voto canzoni ----------

// "votante" oggi e' il codice casuale del telefono. Se un giorno il voto
// passa dentro la conferma presenza, basta passare qui l'email dell'invitato.
function salvaVoto_(dati) {
  var votante = pulisci_(dati.votante).slice(0, 80);
  var canzone = pulisci_(dati.canzone).slice(0, 120);
  if (votante.length < 6 || !canzone) {
    return risposta_({ ok: false, errore: 'Voto incompleto' });
  }

  var sh = foglio_(FOGLIO_VOTI, INTESTAZIONI_VOTI);
  var mie = righeDelVotante_(sh, votante);
  var k = chiave_(canzone);

  // Canzone gia' votata da questo telefono: niente doppioni.
  for (var i = 0; i < mie.length; i++) {
    if (chiave_(mie[i].canzone) === k) {
      return rispostaVoto_(sh, votante, { canzone: mie[i].canzone, giaVotata: true });
    }
  }

  // Limite di canzoni per telefono raggiunto.
  if (mie.length >= MAX_VOTI_PER_TELEFONO) {
    return rispostaVoto_(sh, votante, { ok: false, limite: true,
      errore: 'Hai gia\' votato ' + MAX_VOTI_PER_TELEFONO + ' canzoni' });
  }

  // Se la canzone e' gia' in classifica, usiamo la stessa scrittura,
  // cosi' "volare" e "Volare" contano come la stessa canzone.
  var canzoneEsistente = scritturaEsistente_(sh, canzone);
  if (canzoneEsistente) canzone = canzoneEsistente;

  sh.appendRow([new Date(), votante, comeTesto_(canzone)]);
  return rispostaVoto_(sh, votante, { canzone: testo_(canzone) });
}

// Toglie il voto di questo telefono a una canzone.
function togliVoto_(dati) {
  var votante = pulisci_(dati.votante).slice(0, 80);
  var canzone = pulisci_(dati.canzone).slice(0, 120);
  if (votante.length < 6 || !canzone) {
    return risposta_({ ok: false, errore: 'Richiesta incompleta' });
  }
  var sh = foglio_(FOGLIO_VOTI, INTESTAZIONI_VOTI);
  var k = chiave_(canzone);
  var mie = righeDelVotante_(sh, votante);
  // Dal basso verso l'alto, cosi' i numeri di riga restano giusti.
  for (var i = mie.length - 1; i >= 0; i--) {
    if (chiave_(mie[i].canzone) === k) sh.deleteRow(mie[i].riga);
  }
  return rispostaVoto_(sh, votante, {});
}

// Le righe (numero e canzone) votate da questo telefono.
function righeDelVotante_(sh, votante) {
  var ultima = sh.getLastRow();
  if (ultima < 2) return [];
  var chiaveVotante = chiave_(votante);
  var valori = sh.getRange(2, 2, ultima - 1, 2).getValues();
  var out = [];
  for (var i = 0; i < valori.length; i++) {
    if (chiave_(valori[i][0]) === chiaveVotante && testo_(valori[i][1])) {
      out.push({ riga: i + 2, canzone: testo_(valori[i][1]) });
    }
  }
  return out;
}

function rispostaVoto_(sh, votante, extra) {
  var out = {
    ok: true,
    versione: VERSIONE_SCRIPT,
    max: MAX_VOTI_PER_TELEFONO,
    classifica: classifica_(),
    mie: righeDelVotante_(sh, votante).map(function (r) { return r.canzone; })
  };
  for (var x in extra) out[x] = extra[x];
  return risposta_(out);
}

function classifica_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(FOGLIO_VOTI);
  if (!sh || sh.getLastRow() < 2) return [];

  var righe = sh.getRange(2, 3, sh.getLastRow() - 1, 1).getValues();
  var conteggi = {};
  var ordine = [];
  righe.forEach(function (r) {
    var titolo = testo_(r[0]);
    if (!titolo) return;
    var k = chiave_(titolo);
    if (!conteggi[k]) { conteggi[k] = { titolo: titolo, voti: 0 }; ordine.push(k); }
    conteggi[k].voti++;
  });

  return ordine
    .map(function (k) { return conteggi[k]; })
    .sort(function (a, b) { return b.voti - a.voti; })
    .slice(0, MAX_CANZONI_CLASSIFICA);
}

function scritturaEsistente_(sh, canzone) {
  if (sh.getLastRow() < 2) return '';
  var k = chiave_(canzone);
  var righe = sh.getRange(2, 3, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < righe.length; i++) {
    if (chiave_(righe[i][0]) === k) return righe[i][0];
  }
  return '';
}

// ---------- Utilita' ----------

function foglio_(nomeFoglio, intestazioni) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(nomeFoglio) || ss.insertSheet(nomeFoglio);
  if (sh.getLastRow() === 0) {
    sh.appendRow(intestazioni);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, intestazioni.length).setFontWeight('bold');
  }
  return sh;
}

// Confronto "largo": maiuscole, spazi e trattini non contano.
function chiave_(v) {
  return testo_(v).toLowerCase().replace(/[\s\-–—_.,'"!?]+/g, ' ').trim();
}

// Toglie l'apostrofo aggiunto da pulisci_ per mostrare il testo sul sito.
function testo_(v) {
  return String(v == null ? '' : v).replace(/^'/, '').trim();
}

// Forza il foglio a tenere il valore come testo (es. telefono 0333...
// o canzone "1999"): l'apostrofo iniziale non si vede nella cella.
function comeTesto_(s) {
  return s && s.charAt(0) !== "'" ? "'" + s : s;
}

function pulisci_(v) {
  var s = String(v == null ? '' : v).trim().slice(0, 1000);
  // Evita che un testo che inizia con = + - @ venga letto come formula.
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function risposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
