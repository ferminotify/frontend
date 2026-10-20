import { ref } from 'vue'
import { API_URL } from '@/utils/config'
import { useUserStore } from '@/stores/user'

// "Accedi con Moodle": opaque ticket for the user's session on fermimn.edu.it, issued by
// the backend (the password only goes to the backend, which forwards it to the school).
const TICKET_KEY = 'schoolTicket'
const readTicket = () => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(TICKET_KEY)
  } catch {
    return null
  }
}
export const schoolTicket = ref(readTicket())
function setTicket(ticket) {
  schoolTicket.value = ticket || null
  try {
    if (ticket) localStorage.setItem(TICKET_KEY, ticket)
    else localStorage.removeItem(TICKET_KEY)
  } catch {
    // private mode: keep it in memory only
  }
}

const TICKET_ERRORS = ['school_ticket_invalid', 'school_session_expired']

// Public endpoints, plain fetch. When logged in the token is sent too: school accounts
// (@fermimn.edu.it) get teachers. An expired token is refreshed once; if that fails the
// request is retried anonymously, so the page never breaks because of auth.
// An expired Moodle ticket is dropped and the request retried without it.
async function get(path) {
  const store = useUserStore()
  const send = (token) =>
    fetch(`${API_URL}${path}`, {
      credentials: 'omit',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(schoolTicket.value ? { 'X-School-Ticket': schoolTicket.value } : {}),
      },
    })

  let res = await send(store.token)
  if (res.status === 401 && schoolTicket.value) {
    const body = await res.clone().json().catch(() => ({}))
    if (TICKET_ERRORS.includes(body.code)) {
      setTicket(null)
      res = await send(store.token)
    }
  }
  if (res.status === 401 && store.token) {
    let token = null
    try {
      await store.refreshAccessToken()
      token = store.token
    } catch {
      // refresh token gone: continue as anonymous
    }
    res = await send(token)
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error || `Errore ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

/** { classes, rooms: [{key,name}], teachers: [{key,name}] | null, schoolUser, schoolSession: boolean } */
export const fetchTimetableIndex = () => get('/timetable')

/**
 * Week timetable with variations applied.
 * @param {'classe'|'aula'|'docente'} type
 * @param {string} ref class/room/teacher key, e.g. "3f", "aula94"
 * @param {string} [date] any YYYY-MM-DD in the wanted week
 */
export const fetchTimetableWeek = (type, ref, date) =>
  get(`/timetable/${type}/${encodeURIComponent(ref)}${date ? `?date=${date}` : ''}`)

/**
 * Test page: how an event title is read and what it changes.
 * @param {{summary:string, date:string, start?:string, end?:string, allDay?:boolean}} ev
 */
export function fetchTimetableTest({ summary, date, start, end, allDay }) {
  const q = new URLSearchParams({ summary, date })
  if (!allDay && start) {
    q.set('start', start)
    q.set('end', end || start)
  } else q.set('allDay', '1')
  return get(`/timetable/test?${q}`)
}

/** Test page: a few random events from the calendar to try. */
export function fetchTimetableExamples() {
  return get('/timetable/test/examples')
}

/**
 * "Cerca eventi": calendar events from today on, as published.
 * Plain public request (no token), so browsers and proxies may cache it.
 * @returns {Promise<{ events: {uid, summary, date, start, end, allDay}[], source: string }>}
 */
export async function fetchUpcomingEvents() {
  const res = await fetch(`${API_URL}/timetable/events`, { credentials: 'omit' })
  if (!res.ok) throw new Error(`Errore ${res.status}`)
  return res.json()
}

async function post(path, body) {
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...(schoolTicket.value ? { 'X-School-Ticket': schoolTicket.value } : {}),
    },
    body: JSON.stringify(body),
  })
}

/** Logs in on fermimn.edu.it with the school (Moodle) credentials. Throws with a user-facing message. */
export async function schoolLogin(username, password) {
  let res
  try {
    res = await post('/timetable/school-login', { username, password })
  } catch {
    throw new Error('Connessione non riuscita, riprova.')
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.ticket) throw new Error(body.error || `Errore ${res.status}`)
  setTicket(body.ticket)
}

/** Keeps the school session from the Moodle account login (see stores/user.js). */
export const setSchoolTicket = (ticket) => setTicket(ticket)

/** Ends the Moodle session (also on the school site). */
export async function schoolLogout() {
  const req = schoolTicket.value ? post('/timetable/school-logout', {}).catch(() => {}) : null
  setTicket(null)
  await req
}

/**
 * "Segnala un problema" on the timetable: emailed to the admins.
 * @param {{context:object, description:string, expected?:string, email?:string,
 *          screenshot?:{data:string}|null, website?:string}} report
 */
export async function sendTimetableReport(report) {
  const res = await fetch(`${API_URL}/report/timetable`, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  })
  if (res.ok) return
  const data = await res.json().catch(() => ({}))
  const err = new Error(data.error || 'Invio non riuscito, riprova più tardi')
  err.status = res.status
  throw err
}
