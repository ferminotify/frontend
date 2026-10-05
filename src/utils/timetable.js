// Presentation helpers for the timetable page (/orario).

const WEEKDAY_SHORT = ['', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const WEEKDAY_LONG = ['', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
const MONTHS_LONG = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']

const parts = (date) => date.split('-').map(Number) // [y, m, d]

export const weekdayShort = (wd) => WEEKDAY_SHORT[wd]
export const weekdayLong = (wd) => WEEKDAY_LONG[wd]
export const dayOfMonth = (date) => parts(date)[2]
export const shortDate = (date) => {
  const [, m, d] = parts(date)
  return `${d} ${MONTHS[m - 1]}`
}

/** "5 – 9 ottobre", "29 settembre – 3 ottobre" */
export function weekRangeLabel(days) {
  if (!days?.length) return ''
  const [, m1, d1] = parts(days[0].date)
  const [, m2, d2] = parts(days[days.length - 1].date)
  return m1 === m2
    ? `${d1} – ${d2} ${MONTHS_LONG[m2 - 1]}`
    : `${d1} ${MONTHS_LONG[m1 - 1]} – ${d2} ${MONTHS_LONG[m2 - 1]}`
}

/** "LINGUA E LETTERATURA ITALIANA" → "Lingua e letteratura italiana" */
export function prettySubject(s) {
  if (!s) return ''
  const lower = s.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

// Lesson start times (day and evening courses), to number hours as the school does.
const DAY_SLOTS = ['08:05', '09:00', '10:05', '11:00', '12:05', '13:00', '14:15', '15:10']
const EVENING_SLOTS = ['18:15', '19:05', '20:10', '21:00', '21:50']

/** 1-based hour number ("3" for 10:05), or null for an unknown time. */
export function hourNumber(time) {
  const i = DAY_SLOTS.indexOf(time)
  if (i !== -1) return i + 1
  const e = EVENING_SLOTS.indexOf(time)
  return e !== -1 ? e + 1 : null
}

/** End time of a cell: the next slot's start, or +55' for the last one. */
export function cellEnd(cell, times) {
  const last = cell.slots[cell.slots.length - 1]
  const next = times[times.indexOf(last) + 1]
  if (next) return next
  const [h, m] = last.split(':').map(Number)
  const t = h * 60 + m + 55
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

const teachersLine = (v) => (v.teachers?.length ? `${v.teachers.length > 1 ? 'Proff.' : 'Prof.'} ${v.teachers.join(', ')}` : null)
const absentLine = (v) => (v.absent?.length ? `Assente: ${v.absent.join(', ')}` : null)

const roomKey = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
const sameRoom = (a, b) => {
  const na = String(a || '').match(/\d+/)?.[0]
  const nb = String(b || '').match(/\d+/)?.[0]
  return na && nb ? na === nb : roomKey(a) === roomKey(b)
}

/**
 * What to render in a cell, independent of layout.
 * @returns {{ badge: string|null, title: string, lines: string[], original: string|null, tone: string }}
 *   tone: regular | changed | cancelled | freed | added
 */
export function describeCell(cell, entityType) {
  const subject = prettySubject(cell.subject)
  const vs = cell.variations || []
  // The variation that decided the status (a cancelling one wins over a plain change).
  const main =
    vs.find((v) => cell.status === 'cancelled' && ['entry', 'exit', 'trip'].includes(v.kind)) ||
    vs.find((v) => cell.occupant && v.classes?.join(', ') === cell.occupant) ||
    vs[vs.length - 1]

  if (cell.status === 'regular') {
    return { badge: null, title: subject, lines: [cell.detail].filter(Boolean), original: null, tone: 'regular' }
  }

  if (entityType === 'room') {
    if (cell.status === 'freed') {
      // The class that normally uses the room, not every class named by the event (e.g. a trip).
      const who = cell.detail || main.classes?.join(', ')
      const why = main.label || (main.room ? `spostata in ${main.room}` : 'spostata')
      return {
        badge: 'Aula libera',
        title: subject,
        lines: [`${who ? `${who}: ` : ''}${why}`],
        original: null,
        tone: 'freed',
      }
    }
    if (cell.occupant) {
      return {
        badge: cell.status === 'added' ? 'Occupata' : 'Variazione',
        title: cell.occupant,
        lines: [main.label, teachersLine(main), absentLine(main)].filter(Boolean),
        plain: true, // the subject colour belongs to the original lesson, not to the occupant
        original: cell.subject ? `${subject} · ${cell.detail}` : null,
        tone: cell.status === 'added' ? 'added' : 'changed',
      }
    }
  }

  if (cell.status === 'cancelled') {
    return { badge: main.label || 'Annullata', title: subject, lines: [], original: null, tone: 'cancelled' }
  }

  // Class view: substitution / room change / extra activity.
  const movedRoom = main.room && !sameRoom(main.room, cell.detail) ? main.room : null
  const lines = [
    main.label,
    movedRoom || (cell.status === 'added' ? main.room : cell.detail),
    teachersLine(main),
    absentLine(main),
  ].filter(Boolean)
  return {
    badge: cell.status === 'added' ? 'Aggiunta' : 'Variazione',
    title: cell.status === 'added' ? main.label || 'Attività' : subject,
    lines: [...new Set(lines)],
    original: movedRoom && cell.detail ? cell.detail : null,
    tone: cell.status === 'added' ? 'added' : 'changed',
  }
}

/** "1ª", "2ª", … for classes; "Aula", "Lab", "Palestra", … for rooms. */
export function groupEntities(list, type) {
  const groups = new Map()
  for (const e of list) {
    const g = type === 'classe'
      ? (/^[1-5]/.test(e.name) ? `Classi ${e.name[0]}ª` : 'Altro')
      : prettySubject(e.name.split(/\s+/)[0])
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g).push(e)
  }
  return [...groups].map(([label, items]) => ({ label, items }))
}
