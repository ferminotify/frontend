import { ref } from 'vue'
import { API_URL } from '@/utils/config'

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

// Public endpoints, plain fetch. The Moodle ticket, when there is one, adds teachers;
// an expired one (or an account the school does not let see them) is dropped and the
// request retried without it, so the page never breaks because of it.
async function get(path) {
  const send = () =>
    fetch(`${API_URL}${path}`, {
      credentials: 'omit',
      headers: schoolTicket.value ? { 'X-School-Ticket': schoolTicket.value } : {},
    })

  let res = await send()
  if (res.status === 401 && schoolTicket.value) {
    const body = await res.clone().json().catch(() => ({}))
    if (TICKET_ERRORS.includes(body.code)) {
      setTicket(null)
      res = await send()
    }
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error || `Errore ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

/** { classes, rooms: [{key,name}], teachers: [{key,name}] | null, schoolSession: boolean } */
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
 * Event search ("Cerca eventi", dashboard): the same endpoint and rules as the notifier
 * (class codes as "5°CIIN" or "5 CIIN", joint classes, whole years, teachers, rooms).
 * No keywords: every upcoming event. Public request (no token): at most 20 keywords.
 * @param {string[]} [keywords]
 * @returns {Promise<{ events: {uid, summary, date, start, end, allDay}[],
 *   matches: {[kw: string]: string[]}, optional: {[kw: string]: {[cat: string]: string[]}}, source: string }>}
 */
export async function searchEvents(keywords = []) {
  const res = await fetch(`${API_URL}/timetable/search`, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords }),
  })
  if (!res.ok) throw new Error(`Errore ${res.status}`)
  return res.json()
}

/** The school session of the account's Moodle login (see stores/user.js). */
export const setSchoolTicket = (ticket) => setTicket(ticket)

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
