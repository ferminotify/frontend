
import { OG_IMAGE, SITE_NAME, absoluteUrl } from './site.js'
import { BUILD_CLASSES } from './orario.js'

/**
 * In sitemap order
 */
export const PAGES = [
  {
    path: '/',
    og: 'home',
    ogTitle: 'Sostituzioni, cambi aula e uscite anticipate del Fermi.',
    sources: ['src/views/HomeView.vue', 'src/components/CercaEventi.vue', 'src/components/common/CercaEventiCore.vue'],
  },
  {
    path: '/orario',
    og: 'orario',
    ogTitle: "L'orario con le variazioni.",
    sources: ['src/views/OrarioView.vue'],
  },
  {
    path: '/faq',
    og: 'faq',
    ogTitle: 'Domande frequenti su Fermi Notify.',
    sources: ['src/views/FaqView.vue', 'src/components/FaqSections.vue'],
  },
  {
    path: '/app',
    og: 'app',
    ogTitle: 'Fermi Notify sul tuo telefono.',
    sources: ['src/views/AppView.vue'],
  },
  {
    path: '/team',
    og: 'team',
    ogTitle: 'Fatto dagli studenti del Fermi.',
    sources: ['src/views/TeamView.vue', 'src/components/Team.vue', 'src/data/team.js'],
  },
  {
    path: '/supporters',
    og: 'supporters',
    ogTitle: 'Grazie a chi sostiene Fermi Notify.',
    sources: ['src/views/SupportersView.vue', 'src/components/Supporters.vue'],
  },
  {
    path: '/archive',
    og: 'archive',
    ogTitle: 'Poster e codice di Fermi Notify.',
    sources: ['src/views/ArchiveView.vue'],
  },
]

const CLASS_PATH = /^\/orario\/classe\/([a-z0-9]+)$/

/**
 * Social preview image
 * @returns {{url: string, alt: string}}
 */
export function ogImageFor(path, classes = BUILD_CLASSES) {
  const page = PAGES.find((p) => p.path === path)
  if (page) return { url: absoluteUrl(`/og/${page.og}.png`), alt: `${SITE_NAME}: ${page.ogTitle}` }
  const key = path.match(CLASS_PATH)?.[1]?.toUpperCase()
  if (key && classes.some((c) => c.key === key)) {
    return { url: absoluteUrl(`/og/orario-classe-${key.toLowerCase()}.png`), alt: `${SITE_NAME}: orario della classe ${key}` }
  }
  return { url: OG_IMAGE.url, alt: OG_IMAGE.alt }
}
