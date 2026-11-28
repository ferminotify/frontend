// Site-wide SEO facts and the schema.org (JSON-LD) graph shared by every page

export const SITE_URL = 'https://fn.lkev.in'
export const SITE_NAME = 'Fermi Notify'
export const LOCALE = 'it_IT'
export const LANGUAGE = 'it-IT'
export const CONTACT_EMAIL = 'mail@fn.lkev.in'
export const THEME_COLOR = '#141314'

export const DEFAULT_TITLE = 'Fermi Notify · Variazioni orario IS Fermi Mantova'
export const DEFAULT_DESCRIPTION =
  "Variazioni dell'orario dell'IS E. Fermi di Mantova in tempo reale: cerca sostituzioni, cambi aula e uscite anticipate e ricevi notifiche via email, Telegram o push. Gratis, creato dagli studenti."
export const DEFAULT_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'

export const OG_IMAGE = {
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: "Fermi Notify: sostituzioni, cambi aula e uscite anticipate dell'IS E. Fermi di Mantova",
}
export const LOGO_URL = `${SITE_URL}/icons/icon-512.png`

export const SOCIAL = {
  instagram: 'https://www.instagram.com/ferminotify/',
  github: 'https://github.com/ferminotify',
}
export const SOURCE_CODE_URL = 'https://github.com/ferminotify/frontend'
export const STATUS_URL = 'https://status.fn.lkev.in'
export const LICENSE_URL = 'https://www.gnu.org/licenses/agpl-3.0.html'

export const SCHOOL = {
  name: 'Istituto Superiore "Enrico Fermi" di Mantova',
  alternateName: ['IS E. Fermi Mantova', 'IIS Enrico Fermi Mantova', 'Fermi Mantova'],
  url: 'https://www.fermimn.edu.it/',
  timetableChangesUrl: 'https://www.fermimn.edu.it/variazioni-orario/',
}

export const absoluteUrl = (path = '/') => new URL(path, SITE_URL).toString()

const ids = {
  organization: `${SITE_URL}/#organization`,
  website: `${SITE_URL}/#website`,
  app: `${SITE_URL}/#app`,
  school: `${SCHOOL.url}#organization`,
  logo: `${SITE_URL}/#logo`,
}
export const SCHEMA_IDS = ids

const school = () => ({
  '@type': ['EducationalOrganization', 'HighSchool'],
  '@id': ids.school,
  name: SCHOOL.name,
  alternateName: SCHOOL.alternateName,
  url: SCHOOL.url,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Mantova',
    addressRegion: 'MN',
    addressCountry: 'IT',
  },
})

const organization = () => ({
  '@type': 'Organization',
  '@id': ids.organization,
  name: SITE_NAME,
  alternateName: 'FN',
  url: `${SITE_URL}/`,
  logo: {
    '@type': 'ImageObject',
    '@id': ids.logo,
    url: LOGO_URL,
    contentUrl: LOGO_URL,
    width: 512,
    height: 512,
    caption: SITE_NAME,
  },
  image: { '@id': ids.logo },
  description:
    "Progetto open source e senza scopo di lucro, sviluppato da studenti ed ex studenti dell'IS E. Fermi di Mantova. Non è un servizio ufficiale della scuola.",
  email: CONTACT_EMAIL,
  sameAs: [SOCIAL.instagram, SOCIAL.github],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: CONTACT_EMAIL,
    url: SOCIAL.instagram,
    availableLanguage: ['Italian'],
  },
  areaServed: { '@type': 'City', name: 'Mantova' },
  knowsAbout: ['Orario scolastico', 'Variazioni orario', 'Sostituzioni docenti', SCHOOL.name],
})

const website = () => ({
  '@type': 'WebSite',
  '@id': ids.website,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  alternateName: ['FN', 'Fermi Notify Mantova'],
  description: DEFAULT_DESCRIPTION,
  inLanguage: LANGUAGE,
  publisher: { '@id': ids.organization },
  about: { '@id': ids.school },
})

const app = () => ({
  '@type': 'WebApplication',
  '@id': ids.app,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  description: DEFAULT_DESCRIPTION,
  applicationCategory: 'EducationalApplication',
  applicationSubCategory: 'Orario scolastico e notifiche',
  operatingSystem: 'Web, Android, iOS, Windows, macOS, Linux',
  browserRequirements: 'Richiede JavaScript. Installabile come Progressive Web App.',
  installUrl: `${SITE_URL}/app`,
  inLanguage: LANGUAGE,
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  featureList: [
    "Ricerca delle variazioni dell'orario per classe, docente, aula o parola chiave",
    "Orario settimanale di classi e aule con le variazioni già applicate",
    'Notifiche via email, Telegram e push (Daily e Last Minute)',
    'Accesso con email, Google o Moodle',
    'Gratis, senza pubblicità e open source',
  ],
  screenshot: OG_IMAGE.url,
  image: LOGO_URL,
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: ['student', 'teacher'],
    audienceType: "Studenti e docenti dell'IS E. Fermi di Mantova",
  },
  about: { '@id': ids.school },
  author: { '@id': ids.organization },
  publisher: { '@id': ids.organization },
  license: LICENSE_URL,
  sameAs: [SOURCE_CODE_URL],
})

/**
 * The page's own nodes: WebPage (or a subtype) and its breadcrumb.
 * @param {{path: string, title: string, description: string, type?: string,
 *          breadcrumb?: {name: string, path: string}[]}} page
 *   breadcrumb: the trail after "Home", ending with this page; omitted on the home page.
 */
export function pageNodes({ path, title, description, type = 'WebPage', breadcrumb }) {
  const url = absoluteUrl(path)
  const nodes = [
    {
      '@type': type,
      '@id': `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: LANGUAGE,
      isPartOf: { '@id': ids.website },
      about: path === '/' ? { '@id': ids.app } : undefined,
      mainEntity: path === '/' ? { '@id': ids.app } : undefined,
      publisher: { '@id': ids.organization },
      primaryImageOfPage: { '@type': 'ImageObject', url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height },
      breadcrumb: breadcrumb?.length ? { '@id': `${url}#breadcrumb` } : undefined,
    },
  ]
  if (breadcrumb?.length) {
    const trail = [{ name: 'Home', path: '/' }, ...breadcrumb]
    nodes.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: trail.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: absoluteUrl(item.path),
      })),
    })
  }
  return nodes
}

export function siteGraph(page) {
  return {
    '@context': 'https://schema.org',
    '@graph': [organization(), website(), app(), school(), ...pageNodes(page)],
  }
}

export const jsonLdScript = (key, data) => ({
  key,
  type: 'application/ld+json',
  innerHTML: JSON.stringify(data).replace(/</g, '\\u003c'),
})
