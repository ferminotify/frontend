import { computed, ref } from 'vue'
import { fetchTimetableIndex } from '@/api/timetable'

// Keyword suggestions (dashboard keywords, Cerca eventi): classes from the school timetable,
// teachers too when the backend shows them (@fermimn.edu.it accounts). One shared index,
// loaded on the first focus of any field.
const index = ref(null) // { classes: [{key,name}], teachers: [{key,name}] | null }
let indexLoading = null
const MAX_SUGGESTIONS = 6

function loadIndex() {
  indexLoading ||= fetchTimetableIndex()
    .then((data) => (index.value = data))
    .catch((err) => {
      console.warn('Keyword suggestions unavailable', err)
      indexLoading = null // retry on the next focus
    })
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
