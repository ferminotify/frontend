import { fileURLToPath, URL } from 'node:url'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import {
  faqJsonLd,
  fetchClasses,
  injectJsonLd,
  markdownFile,
  missingIcons,
  pageMarkdown,
  sitemapXml,
  writeOut,
} from './scripts/seo-build.js'
import { DEFAULT_DESCRIPTION, SITE_NAME, absoluteUrl } from './src/seo/site.js'
import { PAGES } from './src/seo/pages.js'
import { renderOgImage } from './scripts/og/render.js'

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Classes of the timetable: one prerendered page each (/orario/classe/4ain), also linked
  // from /orario. Not fetched under Vitest.
  const classes = process.env.VITEST ? [] : await fetchClasses(env.VITE_API_URL)
  const classPaths = classes.map((c) => `/orario/classe/${c.key.toLowerCase()}`)

  let outDir = 'dist'
  const markdown = new Map() // path -> Markdown of the prerendered page

  return {
    plugins: [
      vue(),
      vueDevTools(),
      {
        name: 'fermi-notify-seo',
        configResolved(config) {
          outDir = resolve(config.root, config.build.outDir)
        },
        buildStart() {
          // vite-ssg renders the head with its own @unhead/vue: a second copy (e.g. the app on
          // a newer major) makes every useHead a no-op in the prerendered HTML, silently.
          const root = fileURLToPath(new URL('.', import.meta.url))
          if (existsSync(resolve(root, 'node_modules/vite-ssg/node_modules/@unhead/vue'))) {
            this.error(
              '@unhead/vue is installed twice (app and vite-ssg): the prerendered pages would lose title, ' +
                "description and canonical. Install the version vite-ssg depends on: see `npm ls @unhead/vue`.",
            )
          }
          const missing = missingIcons(root)
          if (missing.length) {
            this.warn(
              `Icon names not in the icon font subset (they would show as text if used as icons): ${missing.join(', ')}. ` +
                'If you added icons, run: python3 scripts/subset-icons.py',
            )
          }
        },
      },
    ],
    define: {
      __ORARIO_CLASSES__: JSON.stringify(classes),
    },
    // Dev server behind a reverse proxy (staging): set VITE_ALLOWED_HOSTS / VITE_HMR_CLIENT_PORT.
    server: {
      allowedHosts: process.env.VITE_ALLOWED_HOSTS?.split(','),
      hmr: process.env.VITE_HMR_CLIENT_PORT ? { clientPort: Number(process.env.VITE_HMR_CLIENT_PORT) } : undefined,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    ssgOptions: {
      script: 'async',
      formatting: 'minify',
      // /faq -> faq.html, which Cloudflare serves at /faq itself (nested faq/index.html
      // answers at /faq/ and 308-redirects /faq there, away from the canonical URL).
      dirStyle: 'flat',
      includedRoutes() {
        return [...PAGES.map((p) => p.path), ...classPaths]
      },
      onPageRendered(route, html) {
        if (route === '/faq') {
          const faq = faqJsonLd(html)
          if (faq) html = injectJsonLd(html, faq)
        }
        if (!route.startsWith('/orario/')) {
          markdown.set(route, pageMarkdown(html, route))
          // Point agents to the Markdown copy of the page.
          html = html.replace('</head>', `<link rel="alternate" type="text/markdown" href="/${markdownFile(route)}"></head>`)
        }
        return html
      },
      async onFinished() {
        await writeOut(outDir, 'sitemap.xml', sitemapXml([...PAGES, ...classPaths.map((path) => ({ path }))]))

        // Markdown copy of every page (/faq.md, ...) and all of them in llms-full.txt.
        const pages = PAGES.filter((p) => markdown.has(p.path))
        for (const { path } of pages) await writeOut(outDir, markdownFile(path), markdown.get(path))
        const classList = classes.length
          ? `\n\n## Orario delle classi\n\n${classes.map((c) => `- [Orario classe ${c.key}](${absoluteUrl(`/orario/classe/${c.key.toLowerCase()}`)})`).join('\n')}\n`
          : ''
        await writeOut(
          outDir,
          'llms-full.txt',
          `# ${SITE_NAME}\n\n> ${DEFAULT_DESCRIPTION}\n\nContenuto completo delle pagine pubbliche di ${absoluteUrl('/')}, per LLM e agenti. ` +
            `Indice sintetico: ${absoluteUrl('/llms.txt')}\n\n` +
            pages.map(({ path }) => markdown.get(path).replace(/^# /, '## ').replace(/\n#(#+) /g, '\n##$1 ')).join('\n---\n\n') +
            classList,
        )

        // Social preview images: one per page and per class (src/seo/pages.js, ogImageFor).
        await writeOut(outDir, 'og-image.png', await renderOgImage({ title: PAGES[0].ogTitle, classes }))
        for (const page of PAGES) {
          await writeOut(outDir, `og/${page.og}.png`, await renderOgImage({ title: page.ogTitle, classes }))
        }
        for (const c of classes) {
          await writeOut(outDir, `og/orario-classe-${c.key.toLowerCase()}.png`, await renderOgImage({ title: 'Orario', code: c.key, classes }))
        }
        console.log(
          `[seo] sitemap.xml (${PAGES.length + classPaths.length} URLs), llms-full.txt, ${pages.length} Markdown pages ` +
            `and ${PAGES.length + classes.length + 1} preview images written`,
        )
      },
    },
  }
})
