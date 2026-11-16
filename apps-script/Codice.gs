/**
 * Conferma presenza - Matrimonio Azzurra & Leonardo
 *
 * Questo codice va incollato nell'editor Apps Script collegato al foglio
 * Google delle risposte (Estensioni > Apps Script). Istruzioni complete in
 * CONFERMA-PRESENZA.md nella cartella principale del repository.
 *
 * Riceve le risposte dal sito, le scrive come nuova riga nel foglio
 * "Risposte" e risponde al sito con {"ok": true} solo se la riga e' stata
 * salvata davvero. Cosi' il sito mostra "Grazie" solo quando e' vero.
 */

// Metti true se vuoi anche un'email per ogni risposta (all'indirizzo
// dell'account Google che pubblica lo script). Chiede un permesso in piu'.
var INVIA_EMAIL = false;

var NOME_FOGLIO = 'Risposte';
var INTESTAZIONI = [
  'Data e ora',
  'Nome e cognome',
  'Email',
  'Telefono',
  'Presenza',
  'Numero partecipanti',
  'Altri partecipanti',
  'Esigenze alimentari',
  'Canzone per la band',
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
      pulisci_(dati.Canzone_per_la_band),
      pulisci_(dati.Messaggio_per_gli_sposi)
    ];

    foglio_().appendRow(riga);

    if (INVIA_EMAIL) {
      try {
        var testo = INTESTAZIONI.map(function (t, k) { return t + ': ' + riga[k]; }).join('\n');
        MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
          'Nuova conferma presenza: ' + nome, testo);
      } catch (errEmail) {
        // L'email e' un di piu': se fallisce, la riga e' comunque salvata.
      }
    }

    return risposta_({ ok: true });
  } catch (err) {
    return risposta_({ ok: false, errore: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Aprendo l'indirizzo dello script nel browser si vede se e' attivo.
function doGet() {
  return risposta_({ ok: true, messaggio: 'Conferma presenza attiva' });
}

function foglio_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(NOME_FOGLIO) || ss.insertSheet(NOME_FOGLIO);
  if (sh.getLastRow() === 0) {
    sh.appendRow(INTESTAZIONI);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, INTESTAZIONI.length).setFontWeight('bold');
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
