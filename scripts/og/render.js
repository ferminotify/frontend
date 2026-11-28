// Social preview images
import { readFileSync } from 'node:fs'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

const here = (p) => new URL(p, import.meta.url)
const WIDTH = 1200
const HEIGHT = 630
const COLORS = { surface: '#141314', text: '#ececec', muted: '#9b999b', pattern: '#232123' }

const fonts = [
  { name: 'Montserrat', data: readFileSync(here('./fonts/montserrat-latin-800-normal.woff')), weight: 800, style: 'normal' },
  { name: 'Source Code Pro', data: readFileSync(here('./fonts/source-code-pro-latin-600-normal.woff')), weight: 600, style: 'normal' },
]

const RESVG_OPTIONS = { fitTo: { mode: 'width', value: WIDTH }, font: { loadSystemFonts: false } }

const svgUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
const wordmark = svgUri(
  readFileSync(here('../../src/assets/icons/logo-long.svg'), 'utf8')
    .replace(/ class="[^"]*"/g, '')
    .replaceAll('fill="#fff"', `fill="${COLORS.text}"`),
)
const mark = svgUri(readFileSync(here('./mark.svg'), 'utf8').replace('<svg ', `<svg fill="${COLORS.text}" `))

/**
 * Background text
 */
const CHANGES = [
  'CLASSE 4CIIN - ENTRATA POSTICIPATA',
  'CLASSE 5BMME - USCITA ANTICIPATA',
  'CLASSI QUARTE - ASSEMBLEA DI ISTITUTO',
  'CLASSE 2CME - AULA 619',
  'CLASSE 3AIIN - STUDIO INDIVIDUALE',
  'CLASSE 1D - USCITA DIDATTICA',
  'CLASSE 4EAU - LABORATORIO 609',
  'CLASSE 5ITEL - ENTRATA POSTICIPATA',
  'TRIENNIO - SPORTELLO',
  'CLASSE 3BBIO - AULA MAGNA',
  'CLASSE 2AIN - MENSA',
  "CLASSE 5SIIN - VIAGGIO D'ISTRUZIONE",
  'CLASSE 4AMME - USCITA ANTICIPATA',
  'CLASSE 1BCH - AULA 13',
]

export function backgroundChanges(classes = []) {
  const known = new Set(classes.map((c) => c.key))
  return CHANGES.filter((line) => {
    const code = line.match(/^CLASSE (\w+)/)?.[1]
    return !code || !known.size || known.has(code)
  })
}

function patternRows(changes, rows = 40) {
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  return Array.from({ length: rows }, () => {
    const row = [...changes]
    for (let i = row.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[row[i], row[j]] = [row[j], row[i]]
    }
    return row.join('; ').slice(0, 150)
  })
}

const el = (type, style, children) => ({ type, props: { style, children } })
const img = (src, style) => ({ type: 'img', props: { src, style } })

// The background is the same on every image of a build
const patternCache = new Map()
async function patternPng(classes) {
  const changes = backgroundChanges(classes)
  const key = changes.join('|')
  if (!patternCache.has(key)) {
    const rows = patternRows(changes).map((row) => el('div', { display: 'flex', whiteSpace: 'nowrap' }, row))
    const layer = el('div', { width: WIDTH, height: HEIGHT, display: 'flex', position: 'relative', overflow: 'hidden', backgroundColor: COLORS.surface }, [
      el(
        'div',
        {
          position: 'absolute',
          left: -700,
          top: -1000,
          width: 2600,
          display: 'flex',
          flexDirection: 'column',
          transform: 'rotate(-45deg)',
          fontFamily: 'Source Code Pro',
          fontWeight: 600,
          fontSize: 30,
          lineHeight: '52px',
          letterSpacing: 1,
          color: COLORS.pattern,
        },
        rows,
      ),
    ])
    const svg = await satori(layer, { width: WIDTH, height: HEIGHT, fonts })
    const png = new Resvg(svg, RESVG_OPTIONS).render().asPng()
    patternCache.set(key, `data:image/png;base64,${png.toString('base64')}`)
  }
  return patternCache.get(key)
}

/**
 * @param {{title: string, code?: string, classes?: {key: string}[]}} opts
 *   title: the line of text; code: a class code shown big under it (class pages).
 * @returns {Promise<Buffer>} PNG
 */
export async function renderOgImage({ title, code, classes = [] }) {
  const pattern = img(await patternPng(classes), { position: 'absolute', left: 0, top: 0, width: WIDTH, height: HEIGHT })

  const text = code
    ? el('div', { display: 'flex', flexDirection: 'column' }, [
        el('div', { fontSize: 56, lineHeight: 1.1, color: COLORS.muted }, title),
        el('div', { fontSize: Math.min(128, Math.floor(640 / (code.length * 0.72))), lineHeight: 1, letterSpacing: -3 }, code),
      ])
    : el('div', { fontSize: 60, lineHeight: 1.06, letterSpacing: -1.5 }, title)

  const root = el(
    'div',
    {
      width: WIDTH,
      height: HEIGHT,
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: COLORS.surface,
      color: COLORS.text,
      fontFamily: 'Montserrat',
      fontWeight: 800,
    },
    [
      pattern,
      img(wordmark, { position: 'absolute', left: 80, top: 72, width: 250, height: 44 }),
      img(mark, { position: 'absolute', right: 90, top: 165, width: 300, height: 313 }),
      el('div', { position: 'absolute', left: 80, bottom: 150, width: 640, display: 'flex' }, [text]),
      el('div', { position: 'absolute', left: 80, bottom: 72, fontSize: 24, color: COLORS.muted }, 'fn.lkev.in'),
    ],
  )

  const svg = await satori(root, { width: WIDTH, height: HEIGHT, fonts })
  return new Resvg(svg, RESVG_OPTIONS).render().asPng()
}
