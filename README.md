# Matrimonio Azzurra & Leonardo — sito per gli invitati

Sito statico (nessun database), pubblicato gratis con GitHub Pages.

## File principali

- `index.html` — la pagina del sito (testi, sezioni, modulo di conferma presenza).
- `styles.css` — lo stile del sito, **generato automaticamente**. Non modificarlo a mano.
- `tailwind.config.js`, `src/input.css`, `package.json` — servono solo per rigenerare `styles.css`.

## Come pubblicare (una volta sola)

1. Su GitHub apri il repository → **Settings** → **Pages**.
2. In "Build and deployment" scegli **Source: Deploy from a branch**.
3. Branch: **main**, cartella **/ (root)** → **Save**.
4. Dopo 1-2 minuti il sito è online su `https://leonardoporri.github.io/Matrimonio/`.

Ogni modifica unita al ramo `main` viene pubblicata da sola in pochi minuti.

## Se cambi le classi grafiche in `index.html`

Se aggiungi classi Tailwind nuove (es. `bg-salvia-100`), rigenera lo stile:

```
npm install
npm run build:css
```

Se cambi solo testi, non serve.
