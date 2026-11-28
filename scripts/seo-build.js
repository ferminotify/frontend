// Build-time SEO
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { JSDOM } from 'jsdom'
import { SITE_NAME, SITE_URL, absoluteUrl } from '../src/seo/site.js'

const PROD_API = 'https://api.fn.lkev.in'

/**
 * Classes of the timetable
 * @returns {Promise<{key: string, name: string}[]>}
 */
export async function fetchClasses(apiUrl) {
  const base = process.env.SSG_TIMETABLE_API || (apiUrl && !/localhost|127\.0\.0\.1/.test(apiUrl) ? apiUrl : PROD_API)
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/timetable`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { classes } = await res.json()
    return (classes || [])
      .filter((c) => c && /^[A-Za-z0-9]+$/.test(c.key))
      .map((c) => ({ key: String(c.key).toUpperCase(), name: String(c.name || c.key) }))
  } catch (err) {
    console.warn(`[seo] Timetable classes not available from ${base} (${err.message}): class pages not prerendered.`)
    return []
  }
}

function gitDate(files) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...files], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    return out.trim() || undefined
  } catch {
    return undefined
  }
}

/**
 * sitemap.xml
 * @param {{path: string, sources?: string[]}[]} pages sources: files whose last commit dates the page
 */
export function sitemapXml(pages) {
  const urls = pages.map(({ path, sources }) => {
    const lastmod = sources?.length ? gitDate(sources) : undefined
    return `  <url>\n    <loc>${absoluteUrl(path)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

const text = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim()

/** FAQ JSON-LD */
export function faqJsonLd(html) {
  const { document } = new JSDOM(html).window
  const questions = []
  for (const id of ['generaliContainer', 'configurazioneContainer']) {
    for (const q of document.querySelectorAll(`#${id} .question`)) {
      const name = text(q.querySelector('h3')).replace(/^\d+\.\s*/, '')
      const parts = [...q.children].filter((c) => c.tagName !== 'H3')
      const answer = parts
        .map((p) => (p.tagName === 'UL' || p.tagName === 'OL' ? [...p.querySelectorAll('li')].map((li) => `• ${text(li)}`).join('\n') : text(p)))
        .filter(Boolean)
        .join('\n')
      if (name && answer) questions.push({ name, answer })
    }
  }
  if (!questions.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${absoluteUrl('/faq')}#webpage`,
    inLanguage: 'it-IT',
    mainEntity: questions.map(({ name, answer }) => ({
      '@type': 'Question',
      name,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
}

export function injectJsonLd(html, data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return html.replace('</head>', `<script type="application/ld+json">${json}</script></head>`)
}

// Markdown copies of the pages for LLM

const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'VIDEO', 'IFRAME', 'TEMPLATE', 'FORM'])

function toMarkdown(node, ctx = { list: 0 }) {
  if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ')
  if (node.nodeType !== 1) return ''
  const el = node
  if (SKIP.has(el.tagName)) return ''
  if (el.classList.contains('material-symbols-outlined') || el.classList.contains('sr-only')) return ''
  if (el.getAttribute('aria-hidden') === 'true') return ''
  const inner = () => [...el.childNodes].map((c) => toMarkdown(c, ctx)).join('')
  switch (el.tagName) {
    case 'H1': case 'H2': case 'H3': case 'H4': {
      const t = inner().trim()
      return t ? `\n\n${'#'.repeat(Number(el.tagName[1]) + 1)} ${t}\n\n` : ''
    }
    case 'P': {
      const t = inner().trim()
      return t ? `\n\n${t}\n\n` : ''
    }
    case 'BR':
      return '\n'
    case 'UL': case 'OL': {
      ctx.list++
      const items = [...el.children]
        .filter((c) => c.tagName === 'LI')
        .map((li) => `${'  '.repeat(ctx.list - 1)}- ${toMarkdown(li, ctx).trim().replace(/\n{2,}/g, '\n')}`)
      ctx.list--
      return items.length ? `\n\n${items.join('\n')}\n\n` : ''
    }
    case 'A': {
      const t = inner().trim()
      const href = el.getAttribute('href')
      if (!t) return ''
      if (!href || href === '#' || href.startsWith('javascript:')) return t
      const url = href.startsWith('mailto:') ? href : new URL(href, SITE_URL).toString()
      return `[${t}](${url})`
    }
    case 'STRONG': case 'B': {
      const t = inner().trim()
      return t ? ` **${t}** ` : ''
    }
    case 'CODE':
      return `\`${inner().trim()}\``
    case 'IMG': {
      const alt = el.getAttribute('alt')
      return alt ? alt : ''
    }
    default: {
      const block = ['DIV', 'SECTION', 'ARTICLE', 'NAV', 'HEADER', 'FOOTER', 'MAIN', 'LI', 'DETAILS', 'SUMMARY'].includes(el.tagName)
      const t = inner()
      return block ? `\n${t}\n` : t
    }
  }
}

const tidy = (md) =>
  md
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

/** The page as Markdown: title, URL, description, then the content of <main>. */
export function pageMarkdown(html, path) {
  const { document } = new JSDOM(html).window
  const title = document.title || SITE_NAME
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
  const main = document.querySelector('main') || document.body
  // FAQ tabs and other collapsed parts are in the DOM already: keep them all.
  const body = tidy(toMarkdown(main))
  return `# ${title}\n\n> ${description}\n\nURL: ${absoluteUrl(path)}\n\n${body}\n`
}

/** Markdown file of a page: "/" -> index.html.md, "/faq" -> faq.md (llmstxt.org convention). */
export const markdownFile = (path) => (path === '/' ? 'index.html.md' : `${path.replace(/^\//, '')}.md`)

export async function writeOut(outDir, file, content) {
  const target = resolve(outDir, file)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, content)
}

// Icon font subset check

const SCAN_EXT = new Set(['.vue', '.js', '.css', '.html', '.json', '.webmanifest'])
const TOKEN = /[a-z0-9_]+/g

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (name !== '__tests__') walk(p, out)
    }
    else if (SCAN_EXT.has(extname(p))) out.push(p)
  }
  return out
}

export function missingIcons(root) {
  const allFile = join(root, 'scripts/material-symbols-names.json')
  const usedFile = join(root, 'src/assets/fonts/material-symbols-subset.json')
  if (!existsSync(allFile) || !existsSync(usedFile)) return []
  const all = new Set(JSON.parse(readFileSync(allFile, 'utf8')))
  const inSubset = new Set(JSON.parse(readFileSync(usedFile, 'utf8')))
  const files = [...walk(join(root, 'src')), ...walk(join(root, 'public')), join(root, 'index.html')]
  const missing = new Set()
  for (const f of files) {
    if (f === usedFile) continue
    for (const t of readFileSync(f, 'utf8').match(TOKEN) || []) {
      if (all.has(t) && !inSubset.has(t)) missing.add(t)
    }
  }
  return [...missing].sort()
}
