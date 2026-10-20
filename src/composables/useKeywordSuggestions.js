import { computed, ref } from 'vue'
import { fetchTimetableIndex } from '@/api/timetable'

// Keyword suggestions (dashboard keywords, Cerca eventi): classes from the school timetable,
// teachers too when the backend shows them (confirmed accounts, Moodle sessions). One shared index,
// loaded on the first focus of any field.
const index = ref(null) // { classes: [{key,name}], teachers: [{key,name}] | null }
let indexLoading = null
let indexFor = null // the login the index was loaded with: teachers depend on it
const MAX_SUGGESTIONS = 6

const currentLogin = () => {
  try {
    return localStorage.getItem('token') || ''
  } catch {
    return ''
  }
}

function loadIndex() {
  // Loaded before logging in (Cerca eventi, then the dashboard): load it again, with teachers.
  const login = currentLogin()
  if (indexLoading && indexFor !== login) indexLoading = null
  if (!indexLoading) {
    indexFor = login
    indexLoading = fetchTimetableIndex()
      .then((data) => {
        if (indexFor === login) index.value = data
      })
      .catch((err) => {
        console.warn('Keyword suggestions unavailable', err)
        if (indexFor === login) indexLoading = null // retry on the next focus
      })
  }
  return indexLoading
}

// The school lists teachers as "Surname Name": the calendar names them by surname
// ("PROF. ROSSI"). Two words → the first; a leading particle (De, Di, Della…) joins the next.
const PARTICLES = new Set(['DE', 'DI', 'DEL', 'DELLA', 'DELLE', 'DEGLI', 'DAL', 'DALLA', 'DA', 'LA', 'LO', 'LI', 'VAN', 'VON', "D'"])
function surnameOf(name) {
  const words = name.toUpperCase().split(/\s+/).filter(Boolean)
  if (words.length > 2 && PARTICLES.has(words[0])) return `${words[0]} ${words[1]}`
  return words[0] || ''
}

const candidates = computed(() => {
  if (!index.value) return []
  const classes = (index.value.classes || []).map((c) => ({ type: 'class', keyword: c.key.toUpperCase(), label: c.name }))
  const teachers = (index.value.teachers || [])
    .filter((t) => !/\d/.test(t.name)) // vacant posts ("A40 …")
    .map((t) => ({ type: 'teacher', keyword: surnameOf(t.name), label: t.name }))
  return [...classes, ...teachers]
})

/**
 * @param {{ input: import('vue').Ref<string>, exclude: () => string[],
 *           onPick: (s: {type, keyword, label}) => void, onEnter: () => void }} opts
 *   exclude: keywords already chosen (not suggested again).
 */
export function useKeywordSuggestions({ input, exclude, onPick, onEnter }) {
  const focused = ref(false)
  const activeIndex = ref(-1)

  const suggestions = computed(() => {
    const q = (input.value || '').trim().toUpperCase().replace(/\s+/g, ' ')
    if (!q) return []
    const have = new Set(exclude().map((k) => (k || '').toUpperCase()))
    const score = (c) => {
      const label = c.label.toUpperCase()
      if (c.keyword.startsWith(q)) return 0
      if (label.split(' ').some((w) => w.startsWith(q))) return 1
      if (c.keyword.includes(q) || label.includes(q)) return 2
      return -1
    }
    return candidates.value
      .filter((c) => !have.has(c.keyword) && !(c.keyword === q && c.type === 'class'))
      .map((c) => ({ c, rank: score(c) }))
      .filter((x) => x.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.c.keyword.localeCompare(b.c.keyword))
      .slice(0, MAX_SUGGESTIONS)
      .map((x) => x.c)
  })

  const showSuggestions = computed(() => focused.value && suggestions.value.length > 0)

  function pick(s) {
    activeIndex.value = -1
    onPick(s)
  }

  return {
    suggestions,
    showSuggestions,
    activeIndex,
    resetActive: () => (activeIndex.value = -1),
    onFocus() {
      focused.value = true
      loadIndex()
    },
    onBlur() {
      focused.value = false
      activeIndex.value = -1
    },
    onKeydown(e) {
      const n = suggestions.value.length
      if (e.key === 'ArrowDown' && n) {
        e.preventDefault()
        activeIndex.value = (activeIndex.value + 1) % n
      } else if (e.key === 'ArrowUp' && n) {
        e.preventDefault()
        activeIndex.value = (activeIndex.value - 1 + n) % n
      } else if (e.key === 'Escape') {
        activeIndex.value = -1
        focused.value = false
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (showSuggestions.value && activeIndex.value >= 0) pick(suggestions.value[activeIndex.value])
        else onEnter()
      }
    },
    pick,
  }
}

// ------- Class check: a keyword that looks like a class code but is no class -------
// "5IIN", "5CCIN", "4CBIOIN": the notifier then only finds that exact word in the titles.
// Same normalisation as the backend (utils/timetable/keywords.js keywordWords): no accents,
// ordinal marks, dots or spaces ("5ºCIIN", "5 CIIN", "4E." are classes).
const compact = (kw) =>
  String(kw || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')

// Joint classes as the calendar writes them (backend merge.js jointCalendarName):
// site "5EELEEET" (5EELE + 5EET) → "5EELEET".
function jointNames(keys) {
  const out = []
  for (const k of keys) {
    for (let i = 2; i < k.length - 1; i++) {
      const a = k.slice(0, i)
      const b = k[0] + k.slice(i)
      if (a !== k && keys.has(a) && keys.has(b)) out.push(a + b.slice(a[1] === b[1] ? 2 : 1))
    }
  }
  return out
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = cur
    }
  }
  return row[b.length]
}

const knownClasses = computed(() => {
  if (!index.value?.classes?.length) return null
  const keys = new Set(index.value.classes.map((c) => c.key.toUpperCase()))
  return new Set([...keys, ...jointNames(keys)])
})

/**
 * Keywords that look like a class and are none, with the closest classes (same year first).
 * The class list loads on first use; until then (or if it fails) nothing is flagged.
 */
export function useClassCheck() {
  loadIndex()
  /** @returns {{ keyword: string, suggestions: string[] } | null} */
  function check(kw) {
    const known = knownClasses.value
    const key = compact(kw)
    if (!known || !/^[1-5][A-Z]/.test(key) || known.has(key)) return null
    const suggestions = [...known]
      .map((c) => ({ c, d: editDistance(key, c) }))
      .filter((x) => x.d <= 2)
      .sort((x, y) => (y.c[0] === key[0]) - (x.c[0] === key[0]) || x.d - y.d || x.c.localeCompare(y.c))
      .slice(0, 3)
      .map((x) => x.c)
    return { keyword: kw, suggestions }
  }
  return { ready: computed(() => Boolean(knownClasses.value)), check, load: loadIndex }
}
