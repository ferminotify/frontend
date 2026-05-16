# vite-ssg Migration Design

**Date:** 2026-05-16  
**Goal:** Generate static HTML per route at build time so crawlers and social bots receive correct meta tags instead of an empty SPA shell.  
**Deploy target:** Cloudflare Pages (serves `faq/index.html` for `/faq` natively).

---

## Problem

Current app is a Vue 3 SPA. Crawlers (Bing, social preview bots for Telegram/WhatsApp) receive `<div id="app"></div>` and the static `index.html` meta tags — not per-route meta. Google uses two-wave crawling (slow). Social share previews always show homepage meta regardless of route.

---

## Approach

**vite-ssg full refactor (Approach A).**

vite-ssg runs the Vue app in Node.js at build time, renders each route to static HTML, and outputs one `index.html` per route directory. The JS bundle still ships — hydration makes the app fully interactive after load. PWA service worker and push notifications are unaffected (browser-only, execute after hydration).

Rejected alternatives:
- Wrapper entry point (B): duplicates app bootstrap logic, fragile.
- vite-plugin-prerender (C): requires Puppeteer in CI, heavier, less reliable.

---

## Changes Required

### 1. Package

Add `vite-ssg` to `devDependencies`.  
Update build script: `"build": "vite-ssg build"`.

### 2. `vite.config.js`

Add `ssgOptions` to configure which routes to prerender and output format:

```js
ssgOptions: {
  script: 'async',
  formatting: 'minify',
  includedRoutes(paths, routes) {
    return [
      '/',
      '/faq',
      '/app',
      '/team',
      '/supporters',
      '/archive',
    ]
  },
}
```

`script: 'async'` defers JS loading without blocking HTML parse.

### 3. `src/router/index.js`

- Export `routes` array as named export (vite-ssg needs it separately).
- Remove `createRouter` call from this file — vite-ssg creates the router instance.
- Keep `beforeEach` and `afterEach` hooks but move them into a `setupRouter(router)` function that is called from `main.js` after the router is created.
- The meta-tag update logic (`upsertMetaByName`, `upsertMetaByProperty`, `upsertCanonical`) and auth guard stay exactly as-is, just relocated.

### 4. `src/main.js`

Replace the `createApp` / `mount` pattern with `ViteSSG`:

```js
import { ViteSSG } from 'vite-ssg'
import { routes, setupRouter } from './router'

export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL },
  ({ app, router, isClient }) => {
    const pinia = createPinia()
    app.use(pinia)
    app.component('font-awesome-icon', FontAwesomeIcon)

    setupRouter(router) // registers beforeEach + afterEach

    if (isClient) {
      // fetchProfile, SW registration, push subscription — all browser-only
      const store = useUserStore(pinia)
      if (store.token) {
        store.fetchProfile().catch(() => store.logout())
      }
      registerServiceWorker() // extracted helper
    }
  }
)
```

All browser globals (`navigator`, `localStorage`, `window`) must be inside the `isClient` block or inside `onMounted` in components. The `if ('serviceWorker' in navigator)` block currently in `main.js` moves to a `registerServiceWorker()` helper called only when `isClient`.

### 5. Routes to Prerender

Prerender (public, indexable):
- `/` — home / event search
- `/faq`
- `/app` — PWA install page
- `/team`
- `/supporters`
- `/archive`

Excluded (auth-gated, noindex, or redirect):
- `/login`, `/register`, `/dashboard`, `/password_reset`, `/password-otp`
- `/test`, `/feedback`
- `/ig`, `/gh` (external redirects — `beforeEnter` uses `window.location`; guard these callbacks with `if (typeof window !== 'undefined')` to prevent SSG crash if vite-ssg traverses them)
- `/user/auth/register/confirmation/:code` (dynamic segment)

### 6. PWA

No changes to `service-worker.js`, `manifest.webmanifest`, or push logic. vite-ssg generates static HTML shells; the JS bundle hydrates them normally. SW registration and push subscription execute after hydration via the `isClient` guard.

---

## Data Flow

```
Build time (Node.js):
  ViteSSG renders each public route → static HTML with correct <title>, meta, OG, canonical

Client (browser):
  1. Cloudflare Pages serves route-specific index.html
  2. Async JS bundle loads → Vue hydrates → app becomes interactive
  3. isClient block runs: fetchProfile, SW registration, push subscription
  4. Router afterEach updates meta on subsequent SPA navigation
```

---

## Out of Scope

- Server-side rendering (SSR) of live event data — events are dynamic API data, not useful to index.
- Sitemap or robots.txt changes — already correct.
- Component-level changes — no view files need modification.
