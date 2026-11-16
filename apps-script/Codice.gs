/**
 * Matrimonio Azzurra & Leonardo - collegamento tra il sito e il foglio Google
 *
 * Questo codice va incollato nell'editor Apps Script collegato al foglio
 * Google (Estensioni > Apps Script). Istruzioni complete in FOGLIO-GOOGLE.md
 * nella cartella principale del repository.
 *
 * CONFERMA PRESENZA: scrive ogni risposta come nuova riga nella scheda
 * "Risposte" e dice al sito {"ok": true} solo se la riga e' salvata davvero.
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

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var dati = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Campo trappola per i robot: le persone non lo vedono e lo lasciano vuoto.
    if (dati._gotcha) {
      return risposta_({ ok: true });
    }

    return salvaConferma_(dati);
  } catch (err) {
    return risposta_({ ok: false, errore: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Aprendo l'indirizzo dello script nel browser si vede se e' attivo.
function doGet() {
  return risposta_({ ok: true, messaggio: 'Collegamento attivo' });
}

// ---------- Conferma presenza ----------

function salvaConferma_(dati) {
  var nome = pulisci_(dati.Nome_e_Cognome);
  var email = pulisci_(dati.Email);
  var presenza = pulisci_(dati.Presenza);
  if (!nome || !email || !presenza) {
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
    pulisci_(dati.Telefono),
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
