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

/**
 * End time of a cell: its own end for an event with real times, else when its last lesson ends.
 * Lessons last 55 minutes (08:05–09:00, 09:00–09:55, 13:00–13:55, …), evening ones 50
 * (18:15–19:05, …): the school site gives only the start times.
 * (`times` and `extraTimes` are kept for the callers; the end no longer depends on them.)
 */
// eslint-disable-next-line no-unused-vars -- kept for the callers (see above)
export function cellEnd(cell, times, extraTimes = []) {
  if (cell.end) return cell.end
  const [h, m] = cell.slots[cell.slots.length - 1].split(':').map(Number)
  const t = h * 60 + m + (h >= 18 ? 50 : 55)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

const minutes = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/**
 * Where an overlay (a variation with real times over the lessons) sits on the rows of its
 * slots: from the first to the last slot, inset at the top and bottom in proportion to the
 * minutes (10:30–11:30 over 10:05–12:05 → 21% from the top, 29% from the bottom).
 * @returns {{ from: string, to: string, top: number, bottom: number }} top/bottom in %
 */
export function overlayBox(overlay, times, extraTimes = []) {
  const from = overlay.slots[0]
  const last = overlay.slots[overlay.slots.length - 1]
  const to = cellEnd({ slots: [last] }, times, extraTimes)
  const a = minutes(from)
  const len = Math.max(1, minutes(to) - a)
  const clamp = (x) => Math.min(45, Math.max(0, Math.round((x / len) * 100)))
  return { from, to: last, top: clamp(minutes(overlay.start) - a), bottom: clamp(minutes(to) - minutes(overlay.end)) }
}

// Names only, like the timetable's own teachers (no "Prof."/"Proff.").
const teachersLine = (v) => (v.teachers?.length ? v.teachers.join(', ') : null)
// Teachers of the timetable itself (logged-in school accounts only).
const cellTeachers = (cell) => (cell.teachers?.length ? cell.teachers.join(', ') : null)
const absentLine = (v) => (v.absent?.length ? `Assente: ${v.absent.join(', ')}` : null)
// "(ALUNNI IRC)" in the event: only part of the class is concerned.
const groupLine = (v) => (v.group ? `Solo ${v.group}` : null)

const roomKey = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
const ROOM_KIND_WORDS = ['AULA', 'LAB', 'LABORATORIO', 'SALA', 'PALESTRA']
const roomWords = (s) =>
  String(s || '')
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter((w) => w.length > 1 && !ROOM_KIND_WORDS.includes(w))
/** Calendar room ("Aula Debate", "Aula 46") vs school site room ("Aula 1-3 Debate"). Same rule as the backend. */
const sameRoom = (calendar, site) => {
  const num = String(calendar || '').match(/\d+/)?.[0]
  if (num) return num === String(site || '').match(/\d+/)?.[0]
  const words = roomWords(calendar)
  if (!words.length) return roomKey(calendar) === roomKey(site)
  const siteWords = roomWords(site)
  return words.every((w) => siteWords.includes(w))
}

// "Bonesi" (calendar, surname only) among "Bonesi Marco, Rossi Anna" (timetable)?
const nameWords = (s) => String(s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^A-Z0-9]+/).filter(Boolean)
const mentions = (names, full) => {
  const f = nameWords(full)
  return names.some((n) => {
    const w = nameWords(n)
    return w.length > 0 && w.every((x) => f.includes(x))
  })
}
/** Timetable teachers replaced by the event's ones (a substitute): shown struck through. */
const replacedTeachers = (cell, v) => {
  if (!v.teachers?.length || !cell.teachers?.length || v.absent?.length) return null // absent ones written: only them
  const gone = cell.teachers.filter((t) => !mentions(v.teachers, t))
  return gone.length === cell.teachers.length ? gone.join(', ') : null
}

// Teachers with the absent ones struck after them: "Morselli ~~Golfrè~~"; only absent: "~~Rossi~~".
function withAbsent(v, replaced) {
  const absent = (v.absent || []).filter((a) => !(v.teachers || []).includes(a))
  const gone = [...new Set([replaced, ...absent].filter(Boolean))]
  const was = gone.length ? gone.join(', ') : null
  return { text: teachersLine(v), was, list: true, ...(v.teachers?.length ? {} : { wasFirst: true }) }
}

// Who is substituted: the lesson's teachers (logged-in timetable) or the absent ones in the event.
const substitutedTeachers = (cell, vs) => {
  const named = vs.flatMap((v) => v.teachers || [])
  const own = (cell.teachers || []).filter((t) => !mentions(named, t))
  if (own.length) return own.join(', ')
  const absent = [...new Set(vs.flatMap((v) => v.absent || []))]
  return absent.length ? absent.join(', ') : null
}

/**
 * Several events often hit the same lesson: the office writes one for the absent teacher
 * ("CLASSE 3A - AULA 42 (PROF. ROSSI ASSENTE)") and, when the room changes too, another one
 * ("CLASSE 3A - SALA EROS"). Read together: the room is the one that differs from the
 * timetable's, teachers and absences add up.
 * @param {string|null} originalRoom  the lesson's room on the timetable, if any
 */
function combine(vs, main, originalRoom) {
  if (vs.length < 2) return main
  const uniq = (list) => [...new Set(list)]
  const absent = uniq(vs.flatMap((v) => v.absent || []))
  const moved = originalRoom ? vs.find((v) => v.room && !sameRoom(v.room, originalRoom)) : null
  return {
    ...main,
    room: moved?.room || main.room || vs.find((v) => v.room)?.room || null,
    teachers: uniq(vs.flatMap((v) => v.teachers || [])).filter((t) => !absent.includes(t)),
    absent,
    label: main.label || vs.find((v) => v.label)?.label || null,
    activity: main.activity || vs.find((v) => v.activity)?.activity || null,
    group: main.group || vs.find((v) => v.group)?.group || null,
  }
}

/**
 * What to render in a cell, independent of layout.
 * @returns {{ badge: string|null, title: string, lines: {text: string, was: string|null}[], original: string|null, tone: string }}
 *   tone: regular | changed | cancelled | freed | added
 *   lines[].was: what the line replaces (room before the move, teacher before the substitution), struck through
 *   original: the whole lesson the cell replaces, struck through
 * @param {'class'|'room'|'teacher'} entityType
 */
// Kinds that take the class away from its lessons (late entry, early exit, trip, suspended lesson).
const CANCELLING = ['entry', 'exit', 'trip', 'off']

export function describeCell(cell, entityType) {
  // "Possible": an event names this class/room/teacher but could not be read as a change of
  // this lesson. The lesson as it is, flagged to check (its text is in the cell / menu).
  if (cell.status === 'maybe') {
    if (cell.subject) {
      const plain = describeCell({ ...cell, status: 'regular', variations: [] }, entityType)
      return { ...plain, badge: 'Variazione', tone: 'maybe' }
    }
    // A free hour: what the event says (activity, room, teachers).
    const v = (cell.variations || [])[0] || {}
    const lines = [v.room, teachersLine(v)].filter(Boolean).map((text) => ({ text, was: null }))
    const title = v.label || v.activity || v.classes?.join(', ') || v.summary?.split(' - ')[0] || 'Evento'
    return { badge: 'Variazione', title, lines, original: null, tone: 'maybe', plain: true }
  }
  const view = entityType === 'teacher' ? describeTeacherCell(cell) : describeLessonCell(cell, entityType)
  // An hour of the joint class, taught with the other part (3MENE with 3ITEL).
  if (cell.jointWith) view.lines.push(`Con ${cell.jointWith}`)
  // Real times, not the lesson hours (e.g. 10:30–11:30 over two lessons): said in the cell.
  // Not for an extra row (cell.end, not an overlay): its row already shows them.
  const real = (!cell.end || cell.overlay) && (cell.variations || []).find((v) => v.offGrid && v.start && v.end)
  if (real) view.lines.unshift(`Dalle ${real.start} alle ${real.end}`)
  const seen = new Set()
  view.lines = view.lines
    .filter(Boolean)
    .map((l) => (typeof l === 'string' ? { text: l, was: null } : { text: l.text || '', was: l.was || null, ...(l.wasFirst ? { wasFirst: true } : {}), ...(l.list && l.was && l.text ? { list: true } : {}) }))
    .filter((l) => (l.text || l.was) && !seen.has(`${l.text}|${l.was}`) && seen.add(`${l.text}|${l.was}`))
  return view
}

function describeLessonCell(cell, entityType) {
  const subject = prettySubject(cell.subject)
  const vs = cell.variations || []
  // The variation that decided the status (a cancelling one wins over a plain change).
  let main =
    vs.find((v) => cell.status === 'cancelled' && CANCELLING.includes(v.kind)) ||
    vs.find((v) => cell.occupant && v.classes?.join(', ') === cell.occupant) ||
    vs[vs.length - 1]

  if (cell.status === 'regular') {
    return { badge: null, title: subject, lines: [cell.detail, cellTeachers(cell)].filter(Boolean), original: null, tone: 'regular' }
  }

  if (entityType === 'room') {
    if (cell.status === 'freed') {
      // The class that normally uses the room, not every class named by the event (e.g. a trip).
      const who = cell.detail || main.classes?.join(', ')
      const away = vs.find((v) => CANCELLING.includes(v.kind)) || vs.find((v) => cell.movedTo && v.room === cell.movedTo) || main
      const why = away.label || (cell.movedTo || away.room ? `spostata in ${cell.movedTo || away.room}` : 'spostata')
      return {
        badge: 'Aula libera',
        title: subject,
        lines: [`${who ? `${who}: ` : ''}${why}`, groupLine(away)],
        original: null,
        tone: 'freed',
      }
    }
    if (cell.occupant) {
      return {
        badge: cell.status === 'added' ? 'Occupata' : 'Variazione',
        title: cell.occupant,
        lines: [main.label, main.activity, groupLine(main), teachersLine(main), absentLine(main)].filter(Boolean),
        plain: true, // the subject colour belongs to the original lesson, not to the occupant
        original: cell.subject ? [subject, cell.detail, cellTeachers(cell)].filter(Boolean).join(' · ') : null,
        tone: cell.status === 'added' ? 'added' : 'changed',
      }
    }
  }

  if (cell.status === 'cancelled') {
    return { badge: main.label || 'Annullata', title: subject, lines: [cellTeachers(cell)].filter(Boolean), original: null, tone: 'cancelled' }
  }

  // Room view: the class that normally is here stays, with a change (substitute, …).
  // Class view: substitution / room change / extra activity.
  // (In the room view the detail is the class, not a room: the room never "moves".)
  if (entityType === 'class' && cell.status !== 'added') main = combine(vs, main, cell.detail)
  const movedRoom = entityType === 'class' && main.room && !sameRoom(main.room, cell.detail) ? main.room : null
  // Room and teacher can both change: each new value carries the one it replaces.
  // Another teacher: a substitution, not that subject. ANTICIPA: the later lesson moved here.
  const role = cell.status === 'added' ? null : cell.role
  return {
    badge: cell.status === 'added' ? 'Aggiunta' : role === 'substitute' ? 'Supplenza' : role === 'early' ? 'Anticipata' : 'Variazione',
    title:
      cell.status === 'added'
        ? main.label || main.activity || 'Attività'
        : role === 'substitute'
          ? subject // struck through (titleStruck): not that lesson
          : role === 'early' && cell.roleSubject
            ? prettySubject(cell.roleSubject)
            : subject,
    titleStruck: role === 'substitute',
    lines: [
      // Anticipated lesson: the subject it takes the place of, struck under the new one.
      role === 'early' && cell.roleSubject && cell.roleSubject !== cell.subject && subject
        ? { text: '', was: subject, wasFirst: true }
        : null,
      main.label,
      cell.status === 'added' && !main.label ? null : main.activity,
      groupLine(main),
      movedRoom
        ? { text: movedRoom, was: cell.detail }
        : cell.status === 'added' && entityType === 'class' ? main.room : cell.detail,
      role === 'substitute'
        ? { text: teachersLine(main), was: substitutedTeachers(cell, vs), wasFirst: true } // no comma: one replaces the other // ~~Rossi~~ Verdi
        : withAbsent(main, cell.status === 'added' ? null : replacedTeachers(cell, main)),
    ],
    original: null,
    tone: cell.status === 'added' ? 'added' : 'changed',
  }
}


/** Teacher view: detail is "class · room"; events name the teacher as absent, substitute or on duty. */
function describeTeacherCell(cell) {
  const subject = prettySubject(cell.subject)
  const vs = cell.variations || []
  const [className, room] = String(cell.detail || '').split(' · ')

  if (cell.status === 'regular') {
    return { badge: null, title: subject, lines: [cell.detail].filter(Boolean), original: null, tone: 'regular' }
  }
  let main = vs.find((v) => cell.occupant && v.classes?.join(', ') === cell.occupant) || vs[vs.length - 1]

  if (cell.status === 'cancelled') {
    // Either the class is away (entry/exit/trip) or the teacher is absent.
    const classAway = vs.find((v) => CANCELLING.includes(v.kind))
    return {
      badge: classAway ? `${className || 'Classe'}: ${classAway.label}` : 'Assente',
      title: subject,
      lines: [cell.detail].filter(Boolean),
      original: null,
      tone: 'cancelled',
    }
  }

  if (cell.occupant) {
    // Busy elsewhere: substitution, trip duty, other activity.
    return {
      badge: main.kind === 'trip' ? main.label : cell.status === 'added' ? 'Supplenza' : 'Variazione',
      title: cell.occupant,
      lines: [main.label && main.kind !== 'trip' ? main.label : null, main.activity, main.room, absentLine(main)].filter(Boolean),
      plain: true,
      original: cell.subject ? `${subject} · ${cell.detail}` : null,
      // A substitution is a change to the timetable, not an extra lesson: same colour as "Variazione".
      tone: 'changed',
    }
  }

  // Own class, changed (room change, co-teacher absent, …).
  main = combine(vs, main, room)
  const movedRoom = main.room && !sameRoom(main.room, room) ? main.room : null
  return {
    badge: 'Variazione',
    title: subject,
    lines: [main.label, main.activity, className, movedRoom ? { text: movedRoom, was: room } : room, teachersLine(main), absentLine(main)],
    original: null,
    tone: 'changed',
  }
}

/** "1ª", "2ª", … for classes; "Aula", "Lab", "Palestra", … for rooms; initials for teachers. */
export function groupEntities(list, type) {
  const groups = new Map()
  for (const e of list) {
    const g =
      type === 'classe'
        ? /^[1-5]/.test(e.name) ? `Classi ${e.name[0]}ª` : 'Altro'
        : type === 'docente'
          ? /^[A-Z]{1,2}\d/i.test(e.name) ? 'Cattedre' : e.name[0].toUpperCase()
          : prettySubject(e.name.split(/\s+/)[0])
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g).push(e)
  }
  return [...groups].map(([label, items]) => ({ label, items }))
}

// Subject colours: distinct hues that read both as a dot and as a 16% tint, light and dark.
const SUBJECT_PALETTE = [
  '#e53935', // red
  '#fb8c00', // orange
  '#fdd835', // yellow
  '#7cb342', // green
  '#00897b', // teal
  '#039be5', // light blue
  '#3949ab', // indigo
  '#8e24aa', // purple
  '#d81b60', // pink
  '#6d4c41', // brown
  '#00acc1', // cyan
  '#c0ca33', // lime
]

const hashString = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * Gives every subject of the week one colour (cell.color), the same on every day, so that
 * two different subjects one after the other never share it. Each subject starts from a
 * colour picked by its name, so it usually keeps it from week to week; it moves to another
 * one only to stay apart from its neighbours (or, when possible, from every other subject).
 */
export function colorSubjects(week) {
  const neighbours = new Map() // subject -> Set of subjects right before/after it
  const add = (a, b) => {
    if (!neighbours.has(a)) neighbours.set(a, new Set())
    if (b && b !== a) neighbours.get(a).add(b)
  }
  for (const day of week.days) {
    const cells = day.cells.filter((c) => c.subject)
    cells.forEach((c, i) => {
      add(c.subject, cells[i - 1]?.subject)
      add(c.subject, cells[i + 1]?.subject)
    })
  }

  const n = SUBJECT_PALETTE.length
  const colorOf = new Map()
  const used = new Set()
  // Most constrained first, then by name for a stable result.
  const subjects = [...neighbours.keys()].sort((a, b) => neighbours.get(b).size - neighbours.get(a).size || a.localeCompare(b))
  for (const s of subjects) {
    const start = hashString(s) % n
    const order = Array.from({ length: n }, (_, k) => (start + k) % n)
    const taken = new Set([...neighbours.get(s)].map((x) => colorOf.get(x)))
    const pick =
      order.find((i) => !taken.has(i) && !used.has(i)) ?? order.find((i) => !taken.has(i)) ?? start
    colorOf.set(s, pick)
    used.add(pick)
  }

  for (const day of week.days) {
    for (const c of day.cells) {
      // An anticipated lesson takes the colour of the subject it brings forward.
      const shown = c.role === 'early' && c.roleSubject && colorOf.has(c.roleSubject) ? c.roleSubject : c.subject
      c.color = shown ? SUBJECT_PALETTE[colorOf.get(shown)] : null
    }
    // Overlays take the colour of the lesson they change (its subject is known).
    for (const o of day.overlays || []) o.color = o.subject && colorOf.has(o.subject) ? SUBJECT_PALETTE[colorOf.get(o.subject)] : null
  }
  return week
}

const ENTITY_LABEL = { class: 'Classe', room: 'Aula', teacher: 'Docente' }
const STATUS_LABEL = { regular: 'Normale', maybe: 'Variazione incerta', changed: 'Variazione', cancelled: 'Annullata', freed: 'Aula libera', added: 'Aggiunta' }

/** "9 ottobre 2026" */
export function longDate(date) {
  const [y, m, d] = parts(date)
  return `${d} ${MONTHS_LONG[m - 1]} ${y}`
}

/**
 * Query of the "Segnala un problema" page: what the user was looking at, prefilled.
 * `day`/`cell` are optional (report from the page, not from a lesson).
 */
export function reportQuery(week, day, cell, from) {
  const q = { da: from }
  if (week?.entity) q.chi = `${ENTITY_LABEL[week.entity.type] || ''} ${week.entity.name}`.trim()
  if (week?.days?.length && !day) q.giorno = `Settimana ${weekRangeLabel(week.days)}`
  if (day) q.giorno = `${weekdayLong(day.weekday)} ${longDate(day.date)}`
  if (cell) {
    const first = hourNumber(cell.slots[0])
    const last = hourNumber(cell.slots[cell.slots.length - 1])
    const hours = first ? (last && last !== first ? `${first}ª–${last}ª ora` : `${first}ª ora`) : null
    q.ora = [hours, `${cell.slots[0]}–${cellEnd(cell, week.times, week.extraTimes || [])}`].filter(Boolean).join(' · ')
    if (cell.subject) q.materia = prettySubject(cell.subject)
    if (cell.occupant) q.materia = [q.materia, `occupata da ${cell.occupant}`].filter(Boolean).join(' · ')
    if (cell.detail) q.dettaglio = cell.detail
    if (cell.teachers?.length) q.docenti = cell.teachers.join(', ')
    q.stato = STATUS_LABEL[cell.status] || cell.status
    if (cell.variations?.length) q.variazioni = cell.variations.map((v) => v.summary).join('\n')
  }
  return q
}

/**
 * Small notes on how sure the app is about a cell's variations, for the cell menu:
 * parser confidence.
 * @returns {{ title: string|null, items: { icon: string, text: string, tone: 'good'|'warn'|'muted' }[] }[]}
 */
export function readingInfo(cell) {
  const vs = cell.variations || []
  return vs.map((v) => {
    const items = []
    if (v.confidence != null) {
      items.push({
        icon: 'fact_check',
        text: `Lettura del testo: ${v.confidence}%`,
        tone: v.confidence >= 90 ? 'good' : v.confidence >= 60 ? 'warn' : 'bad',
      })
    }
    return { title: vs.length > 1 ? v.summary : null, items }
  })
}
