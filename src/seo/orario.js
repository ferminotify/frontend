// SEO data of the /orario pages.

/**
 * Classes known at build time reads from the timetable API
 * @type {{key: string, name: string}[]}
 */
// eslint-disable-next-line no-undef
export const BUILD_CLASSES = typeof __ORARIO_CLASSES__ !== 'undefined' ? __ORARIO_CLASSES__ : []

export function classesByYear(classes = BUILD_CLASSES) {
  const groups = new Map()
  for (const c of classes) {
    const year = /^[1-5]/.test(c.key) ? c.key[0] : 'Altro'
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year).push(c)
  }
  return [...groups].map(([year, items]) => ({
    year,
    label: year === 'Altro' ? 'Altre' : `${year}ª`,
    items,
  }))
}

const KIND = { classe: 'classe', aula: 'aula', docente: 'docente' }

export function orarioPageSeo(type, ref, entityName) {
  if (!ref) return null
  const kind = KIND[type] || 'classe'
  const code = String(ref).toUpperCase()
  if (kind === 'docente') {
    const name = entityName || code
    return { title: `Orario prof. ${name} · Fermi Notify`, heading: `Orario prof. ${name}`, robots: 'noindex,nofollow' }
  }
  const label = kind === 'classe' ? `classe ${code}` : entityName || `aula ${code}`
  return {
    title: `Orario ${label} · IS Fermi Mantova | Fermi Notify`,
    heading: `Orario ${label}`,
    description:
      `Orario settimanale ${kind === 'classe' ? 'della' : 'dell’'} ${label} dell'IS E. Fermi di Mantova con sostituzioni, ` +
      'cambi aula, uscite anticipate e variazioni del calendario giornaliero già applicate.',
    breadcrumb: [
      { name: 'Orario', path: '/orario' },
      { name: label.charAt(0).toUpperCase() + label.slice(1), path: `/orario/${kind}/${String(ref).toLowerCase()}` },
    ],
  }
}
