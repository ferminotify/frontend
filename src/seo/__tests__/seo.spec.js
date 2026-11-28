import { describe, it, expect } from 'vitest'
import { absoluteUrl, jsonLdScript, siteGraph } from '../site'
import { classesByYear, orarioPageSeo } from '../orario'
import { faqJsonLd, markdownFile, pageMarkdown, sitemapXml } from '../../../scripts/seo-build.js'

describe('site', () => {
  it('builds absolute URLs without trailing slash on pages', () => {
    expect(absoluteUrl('/')).toBe('https://fn.lkev.in/')
    expect(absoluteUrl('/faq')).toBe('https://fn.lkev.in/faq')
  })

  it('links the page to its breadcrumb in the graph', () => {
    const graph = siteGraph({ path: '/faq', title: 'FAQ', description: 'd', type: 'FAQPage', breadcrumb: [{ name: 'FAQ', path: '/faq' }] })
    const page = graph['@graph'].find((n) => n['@id'] === 'https://fn.lkev.in/faq#webpage')
    const crumbs = graph['@graph'].find((n) => n['@type'] === 'BreadcrumbList')
    expect(page['@type']).toBe('FAQPage')
    expect(page.breadcrumb['@id']).toBe(crumbs['@id'])
    expect(crumbs.itemListElement.map((i) => i.item)).toEqual(['https://fn.lkev.in/', 'https://fn.lkev.in/faq'])
  })

  it('has no breadcrumb on the home page', () => {
    const graph = siteGraph({ path: '/', title: 't', description: 'd' })
    expect(graph['@graph'].some((n) => n['@type'] === 'BreadcrumbList')).toBe(false)
  })

  it('escapes "<" in JSON-LD so it cannot close the script', () => {
    const { innerHTML } = jsonLdScript('k', { name: '</script><b>' })
    expect(innerHTML).not.toContain('<')
    expect(JSON.parse(innerHTML).name).toBe('</script><b>')
  })
})

describe('orario', () => {
  it('describes a class page from the URL', () => {
    const seo = orarioPageSeo('classe', '4ciin')
    expect(seo.title).toBe('Orario classe 4CIIN · IS Fermi Mantova | Fermi Notify')
    expect(seo.heading).toBe('Orario classe 4CIIN')
    expect(seo.robots).toBeUndefined()
    expect(seo.breadcrumb.at(-1)).toEqual({ name: 'Classe 4CIIN', path: '/orario/classe/4ciin' })
  })

  it('keeps teacher pages out of the index', () => {
    expect(orarioPageSeo('docente', 'rossi', 'ROSSI').robots).toBe('noindex,nofollow')
  })

  it('returns null on /orario', () => {
    expect(orarioPageSeo(undefined, undefined)).toBeNull()
  })

  it('groups classes by year', () => {
    const groups = classesByYear([
      { key: '1A', name: '1A' },
      { key: '2B', name: '2B' },
      { key: '1C', name: '1C' },
      { key: 'X', name: 'X' },
    ])
    expect(groups.map((g) => [g.year, g.items.map((c) => c.key)])).toEqual([
      ['1', ['1A', '1C']],
      ['2', ['2B']],
      ['Altro', ['X']],
    ])
  })
})

describe('build helpers', () => {
  it('names Markdown copies per llmstxt.org', () => {
    expect(markdownFile('/')).toBe('index.html.md')
    expect(markdownFile('/faq')).toBe('faq.md')
  })

  it('writes one <url> per page', () => {
    const xml = sitemapXml([{ path: '/' }, { path: '/orario/classe/1a' }])
    expect(xml.match(/<url>/g)).toHaveLength(2)
    expect(xml).toContain('<loc>https://fn.lkev.in/orario/classe/1a</loc>')
  })

  it('extracts FAQ questions and answers, skipping the privacy policy', () => {
    const html = `<html><head></head><body>
      <div id="generaliContainer"><div class="question"><h3>1. Cos'è?</h3><p class="answer">Un servizio.</p>
        <ul><li>uno</li><li>due</li></ul></div></div>
      <div id="privacyContainer"><div class="question"><h3>Privacy</h3><p>Testo</p></div></div>
    </body></html>`
    const faq = faqJsonLd(html)
    expect(faq.mainEntity).toHaveLength(1)
    expect(faq.mainEntity[0].name).toBe("Cos'è?")
    expect(faq.mainEntity[0].acceptedAnswer.text).toBe('Un servizio.\n• uno\n• due')
  })

  it('turns a page into Markdown without icons or controls', () => {
    const html = `<html><head><title>T</title><meta name="description" content="D"></head><body><main>
      <h1>Titolo</h1><p>Testo <a href="/faq">FAQ</a> <span class="material-symbols-outlined">search</span></p>
      <button>Clic</button></main></body></html>`
    const md = pageMarkdown(html, '/x')
    expect(md).toContain('# T\n\n> D\n\nURL: https://fn.lkev.in/x')
    expect(md).toContain('## Titolo')
    expect(md).toContain('[FAQ](https://fn.lkev.in/faq)')
    expect(md).not.toContain('search')
    expect(md).not.toContain('Clic')
  })
})

describe('preview images', async () => {
  const { ogImageFor } = await import('../pages')
  const { backgroundChanges } = await import('../../../scripts/og/render.js')
  const classes = [{ key: '4CIIN', name: '4Ciin' }]

  it('uses the page image for prerendered pages and classes', () => {
    expect(ogImageFor('/faq', classes).url).toBe('https://fn.lkev.in/og/faq.png')
    expect(ogImageFor('/', classes).url).toBe('https://fn.lkev.in/og/home.png')
    expect(ogImageFor('/orario/classe/4ciin', classes).url).toBe('https://fn.lkev.in/og/orario-classe-4ciin.png')
  })

  it('falls back to the generic image elsewhere', () => {
    expect(ogImageFor('/orario/classe/9zz', classes).url).toBe('https://fn.lkev.in/og-image.png')
    expect(ogImageFor('/orario/aula/aula13', classes).url).toBe('https://fn.lkev.in/og-image.png')
    expect(ogImageFor('/login', classes).url).toBe('https://fn.lkev.in/og-image.png')
  })

  it('drops background lines of classes that no longer exist', () => {
    const lines = backgroundChanges(classes)
    expect(lines).toContain('CLASSE 4CIIN - ENTRATA POSTICIPATA')
    expect(lines).toContain('TRIENNIO - SPORTELLO')
    expect(lines.some((l) => l.startsWith('CLASSE 5BMME'))).toBe(false)
    // Without a class list (API down at build time) all lines stay.
    expect(backgroundChanges([]).length).toBeGreaterThan(lines.length)
  })
})
