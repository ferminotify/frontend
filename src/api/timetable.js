import { API_URL } from '@/utils/config'

// Public endpoints: plain fetch, no auth header/refresh logic needed.
async function get(path) {
  const res = await fetch(`${API_URL}${path}`, { credentials: 'omit' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error || `Errore ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

/** { classes: [{key,name}], rooms: [{key,name}] } */
export const fetchTimetableIndex = () => get('/timetable')

/**
 * Week timetable with variations applied.
 * @param {'classe'|'aula'} type
 * @param {string} ref class/room key, e.g. "3f", "aula94"
 * @param {string} [date] any YYYY-MM-DD in the wanted week
 */
export const fetchTimetableWeek = (type, ref, date) =>
  get(`/timetable/${type}/${encodeURIComponent(ref)}${date ? `?date=${date}` : ''}`)
