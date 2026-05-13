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

## Note tecniche

- L'app registra automaticamente il service worker al primo caricamento.
- Le subscription push vengono associate all'utente autenticato.
- Il router aggiorna titolo, descrizione, canonical e meta robots per ogni pagina.
- L'app conserva un piccolo stato locale in `localStorage` per token, endpoint push, device id, preferenze UI e chiusura di alcuni avvisi.

## Struttura sintetica

- `src/App.vue`: layout principale, barra laterale, loading screen e bootstrap PWA.
- `src/main.js`: bootstrap di Vue, Pinia, router, Font Awesome e service worker.
- `src/router/`: definizione delle rotte e dei meta tag SEO.
- `src/stores/`: stato applicativo, autenticazione e push notifications.
- `src/components/`: componenti riutilizzabili e sezioni della UI.
- `public/`: asset statici, manifest e service worker.

## Licenza

Questo progetto è concesso in licenza sotto la [GNU AFFERO GENERAL PUBLIC LICENSE](LICENSE).
