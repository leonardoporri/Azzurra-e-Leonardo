# Attivare conferma presenza e voto canzoni (circa 10 minuti, una volta sola)

Un solo foglio Google raccoglie due cose:

- **Conferma presenza** → scheda `Risposte`, una riga per risposta. Il sito
  mostra "Grazie di cuore!" **solo** se la riga è stata salvata davvero. Se
  qualcosa va storto, l'invitato vede un errore e può riprovare.
- **Voto canzoni** → scheda `Voti canzoni`, una riga per telefono. Il voto è
  anonimo: nella riga c'è solo un codice casuale, non il nome. La classifica
  sul sito si calcola da queste righe.

Le due schede si creano da sole al primo invio.

Finché non completi questi passi, il sito dice "non ancora attivo" e non
finge di salvare.

## 1. Crea il foglio

1. Vai su <https://sheets.new> con il tuo account Google.
2. Dagli un nome, ad esempio `Conferme matrimonio`.

## 2. Incolla il codice

1. Nel foglio: menu **Estensioni → Apps Script**.
2. Cancella tutto quello che c'è nell'editor.
3. Incolla tutto il contenuto del file [`apps-script/Codice.gs`](apps-script/Codice.gs).
4. Premi l'icona del dischetto (**Salva**).

## 3. Pubblica lo script

1. In alto a destra: **Esegui il deployment → Nuovo deployment**.
2. Rotellina accanto a "Seleziona tipo" → **App web**.
3. **Esegui come:** Io. **Chi ha accesso:** Chiunque.
4. Premi **Esegui il deployment** e poi **Autorizza accesso**.
5. Google mostrerà l'avviso "Google non ha verificato questa app".
   È normale: l'app sei tu. Premi **Avanzate → Vai a … (non sicuro)** → **Consenti**.
6. Copia l'**URL dell'app web** (finisce con `/exec`).

Controllo: apri quell'indirizzo nel browser. Deve comparire
`{"ok":true,"messaggio":"Collegamento attivo"}`.

## 4. Collega il sito

Mandami l'indirizzo `/exec` e lo inserisco io. Oppure, in `index.html`, cerca
questa riga e metti l'indirizzo tra gli apici:

```js
const FOGLIO_GOOGLE_URL = '';
```

## 5. Prova

Dal sito pubblicato, dal telefono:

1. Invia una conferma finta. Deve comparire una riga nella scheda `Risposte`.
2. Vota una canzone finta. Deve comparire una riga in `Voti canzoni` e la
   canzone deve apparire in classifica.

Poi cancella le righe di prova. Sul telefono resterà scritto "Hai votato…":
è normale, al prossimo voto vero verrà sostituito.

## Da sapere

- **Email a ogni risposta:** nel codice metti `var INVIA_EMAIL = true;`, salva
  e ripubblica (vedi sotto). Google chiederà un permesso in più.
- **Se modifichi il codice** devi ripubblicare: **Esegui il deployment →
  Gestisci deployment → matita → Versione: Nuova versione → Esegui il deployment**.
  Così l'indirizzo `/exec` resta lo stesso. Un "Nuovo deployment" invece crea
  un indirizzo nuovo, che andrebbe rimesso nel sito.
- **L'indirizzo `/exec` è pubblico** (è scritto nel sito). Chiunque lo trovi
  può aggiungere righe al foglio, ma non può leggerlo. C'è un filtro semplice
  contro i robot. Se arriva spazzatura, si cancellano le righe.
- **Doppioni nella conferma:** se un invitato invia due volte, vedrai due
  righe. Tieni l'ultima.
- **Voto canzoni, un voto per telefono:** il telefono ricorda il suo codice.
  Se si vota di nuovo, la riga viene aggiornata (si cambia voto). È un blocco
  debole: chi cancella i dati del browser, o usa un altro telefono, può votare
  ancora. Se vedi voti strani (es. tante righe uguali nello stesso minuto),
  cancella le righe: la classifica si aggiorna da sola.
- **Canzoni scritte in modo diverso:** "volare" e "Volare" contano come la
  stessa canzone (maiuscole, spazi e trattini non contano). Errori di battitura
  diversi invece contano come canzoni diverse: puoi correggerli nel foglio.
