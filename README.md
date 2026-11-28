# Fermi Notify Frontend

Questa repository contiene la web app frontend di Fermi Notify, realizzata con Vue 3 e Vite.

L'app offre un'interfaccia per cercare gli eventi e le variazioni dell'orario dell'IS E. Fermi di Mantova, gestire l'accesso utente, configurare le notifiche e consultare le sezioni informative del progetto.

## Tecnologie

- Vue 3
- Vite
- Vue Router
- Pinia
- Axios

## Funzionalità principali

- Ricerca degli eventi e delle variazioni giornaliere.
- Autenticazione con login, registrazione e reset password.
- Dashboard utente per la gestione delle preferenze.
- Supporto alle notifiche push tramite service worker e VAPID.
- Installazione come PWA.
- Pagine informative dedicate a FAQ, team, sostenitori, archivio e feedback.

## Requisiti

- Node.js 20.19+ oppure 22.12+
- Un [backend API di Fermi Notify](https://github.com/ferminotify/backend)

## Configurazione

L'app legge le variabili d'ambiente Vite nel file `.env` locale.

Variabili usate direttamente dal frontend:

- `VITE_API_URL`: URL del backend. Se non è impostata, viene usato `http://localhost:3001`.
- `VITE_VAPID_PUBLIC_KEY`: chiave pubblica VAPID usata come fallback per le notifiche push se il backend non la espone.

Le notifiche push richiedono che l'utente sia autenticato e che il browser supporti `Service Worker` e `PushManager`.

## Avvio in locale

```bash
npm install
npm run dev
```

Di default l'app viene avviata in sviluppo con Vite.

## Script disponibili

- `npm run dev`: avvia il server di sviluppo.
- `npm run build`: crea la build di produzione.
- `npm run preview`: serve localmente la build di produzione.
- `npm run lint`: esegue ESLint con correzione automatica.
- `npm run format`: formatta i file in `src/` con Prettier.
- `npm run icons:subset`: rigenera il font delle icone con solo le icone usate (vedi sotto).
- `npm run seo:indexnow`: dopo un deploy, avvisa Bing e gli altri motori IndexNow che le pagine sono cambiate.

## Rotte principali

- `/`: homepage e ricerca eventi.
- `/login`: accesso.
- `/register`: registrazione.
- `/dashboard`: area personale.
- `/password_reset` e `/password-otp`: recupero password.
- `/faq`: domande frequenti.
- `/app`: pagina dedicata all'installazione della PWA.
- `/supporters`: sostenitori del progetto.
- `/team`: team del progetto.
- `/archive`: archivio.
- `/feedback`: feedback.
- `/test`: pagina interna di test.

## Development mode con Docker

### Prerequisiti

- Docker + Docker Compose v2
- La repo [backend](https://github.com/ferminotify/backend) avviata prima (crea la rete `ferminotify-dev` e il DB)

### Avvio

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

Il frontend è raggiungibile su `http://localhost:5173`.  
Il flag `--build` è necessario ogni volta che si modifica il codice sorgente.

### Variabili d'ambiente nel container

| Variabile | Default nel compose | Descrizione |
|-----------|---------------------|-------------|
| `VITE_API_URL` | `http://localhost:3001` | URL backend (lato browser) |

`VITE_API_URL` viene usata da Vite a runtime in dev mode — corrisponde all'indirizzo che il **browser** usa per raggiungere il backend, non quello interno Docker.

### Rete

Il container si aggancia alla rete Docker `ferminotify-dev` creata dal backend compose. Se il backend non è avviato, il frontend parte comunque ma tutte le chiamate API falliscono.

### Stop

```bash
docker compose -f docker-compose.dev.yml down
```

## Note tecniche

- L'app registra automaticamente il service worker al primo caricamento.
- Le subscription push vengono associate all'utente autenticato.
- Il router aggiorna titolo, descrizione, canonical e meta robots per ogni pagina (vedi SEO).
- L'app conserva un piccolo stato locale in `localStorage` per token, endpoint push, device id, preferenze UI e chiusura di alcuni avvisi.

## SEO e crawler AI

La build (`vite-ssg`) prerenderizza le pagine pubbliche in HTML statico con head completo: i crawler, anche quelli che non eseguono JavaScript (GPTBot, ClaudeBot, PerplexityBot...), ricevono contenuto e meta di ogni pagina.

- **Head**: `src/seo/site.js` (dati del sito e grafo JSON-LD: `Organization`, `WebSite`, `WebApplication`, la scuola, `WebPage`/`FAQPage`/`AboutPage` e breadcrumb) e `src/seo/usePageSeo.js` (title, description, robots, canonical, Open Graph, X). `App.vue` li applica dai `meta` delle rotte (`title`, `description`, `robots`, `schemaType`, `breadcrumb`); le viste possono raffinarli (es. `OrarioView`).
- **Pagine prerenderizzate**: `PAGES` in `src/seo/pages.js` più una pagina per classe (`/orario/classe/<codice>`), con l'elenco classi letto in build da `GET /timetable` (API di produzione se `VITE_API_URL` è locale; `SSG_TIMETABLE_API` per forzarla). Se l'API non risponde la build prosegue senza pagine classe.
- **Classi nuove (inizio anno)**: l'elenco è fissato al momento del build. Il backend rilancia il build da solo quando le classi sul sito della scuola cambiano (`CF_PAGES_DEPLOY_HOOK`, vedi README del backend); per un rebuild manuale: GitHub → Actions → "Rebuild sito" (secret `CF_PAGES_DEPLOY_HOOK` nel repo).
- **Output in `dist/` generato in build** (`scripts/seo-build.js`): `sitemap.xml` (con `lastmod` dall'ultimo commit dei file della pagina), JSON-LD `FAQPage` estratto da `/faq`, una copia Markdown di ogni pagina (`/faq.md`, `/index.html.md`, ...) e `llms-full.txt`. `public/llms.txt` è l'indice per LLM, scritto a mano.
- **URL**: `dirStyle: 'flat'` (`faq.html`): Cloudflare Pages serve `/faq` senza redirect, coerente con canonical e sitemap. Gli URL sconosciuti mostrano `NotFoundView` con `noindex`.
- `@unhead/vue` deve restare sulla stessa major usata da `vite-ssg` (oggi la 2): con due copie i meta spariscono dall'HTML prerenderizzato. La build si ferma se succede.
- **Immagini di anteprima** (Open Graph): una per pagina e una per classe, generate in build da `scripts/og/render.js` (satori + resvg, nessun browser) in `dist/og/`. Testi in `PAGES` (`src/seo/pages.js`), scelta dell'immagine in `ogImageFor`. Lo sfondo usa variazioni di esempio senza nomi di persona; le righe di classi non più esistenti vengono scartate. `public/og-image.png` è l'immagine generica per le altre pagine.
- `public/_headers`: cache lunga per `/assets/*` e content-type dei file per LLM; `public/robots.txt`: regole per motori e bot AI.

### Font delle icone

`material-icons.css` usa `src/assets/fonts/material-symbols-subset.woff2`: solo le icone (ligature) che compaiono nei sorgenti, con tutti gli assi variabili (~0,3 MB invece di ~15 MB). Se usi un'icona nuova, rigenera il font (serve Python con `pip install fonttools brotli`):

```bash
npm run icons:subset
```

La build avvisa quando nei sorgenti compare un nome di icona assente dal subset (anche parole comuni che coincidono con un'icona: in quel caso l'avviso è innocuo).

## Struttura sintetica

- `src/App.vue`: layout principale, barra laterale, loading screen e bootstrap PWA.
- `src/main.js`: bootstrap di Vue, Pinia, router, Font Awesome e service worker.
- `src/router/`: definizione delle rotte e dei meta tag SEO.
- `src/seo/`: head, Open Graph e JSON-LD delle pagine.
- `scripts/`: build SEO (sitemap, Markdown, FAQ), subset del font icone, IndexNow.
- `src/stores/`: stato applicativo, autenticazione e push notifications.
- `src/components/`: componenti riutilizzabili e sezioni della UI.
- `public/`: asset statici, manifest e service worker.

## Licenza

Questo progetto è concesso in licenza sotto la [GNU AFFERO GENERAL PUBLIC LICENSE](LICENSE).
