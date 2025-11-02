<script setup>
import { ref, defineEmits, nextTick, onMounted, computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import csv2json from '@/utils/csv2json.js'
import { generateAlert } from '@/utils/alertbanner.js'

// local state for the search query
const query = ref('')

// info panel state (replaces jQuery slideToggle + localStorage logic)
// Initialize from localStorage synchronously to avoid initial flash on first render
const storedClosed =
  typeof window !== 'undefined' ? localStorage.getItem('cercaEventiInfoClosed') : null
const showInfo = ref(storedClosed === 'true' ? false : true)
const showDetails = ref(false)
// opener link visibility; avoid showing while panel is animating out to prevent layout shift
const showOpener = ref(!showInfo.value)
// track if we're in the open flow initiated from the opener link
const isOpening = ref(false)

// ------- Filters (UI + logic) -------
const filtersOpen = ref(false)
const filterIcon = computed(() => (filtersOpen.value ? 'close' : 'tune'))
const filterLabels = [
  'Nascondi conclusi',
  'In corso',
  'Futuri',
  'Conclusi',
]
// activeFilter is one of filterLabels or '' (none)
const activeFilter = ref('')
// badge visibility (small circle near the filter toggle when a filter is active)
const filterBadgeVisible = computed(() => !!activeFilter.value)
// reset button visibility (animated separately)
const resetVisible = ref(false)

// animation state per filter button to mimic sequential fade-in/out
const filterBtnStates = ref(
  filterLabels.map(() => ({ hidden: true, fadeRight: false, fadeLeftOut: false })),
)

// emit a search event so parent can handle navigation/results
const emit = defineEmits(['search'])

function toUppercase(e) {
  // force uppercase as the user types
  query.value = (e?.target?.value || '').toUpperCase()
}

function cercaEventi() {
  // emit to parent; adjust to your actual search/navigation logic
  emit('search', query.value)
}

async function openInfo() {
  // Begin the two-step open: 1) slide up opener, 2) after it leaves, slide down panel
  isOpening.value = true
  showOpener.value = false
  // persist state immediately (matches original behavior)
  localStorage.setItem('cercaEventiInfoClosed', 'false')
}

function toggleDetails() {
  showDetails.value = !showDetails.value
}

function closeInfo() {
  showInfo.value = false
  localStorage.setItem('cercaEventiInfoClosed', 'true')
  // keep opener hidden until panel fully collapsed (set in after-leave)
  showOpener.value = false
}

// slideToggle-like transition hooks (height auto animation)
const DURATION = 300
function slideEnter(el) {
  el.style.overflow = 'hidden'
  el.style.height = '0'
  el.style.opacity = '0'
  // force reflow
  void el.offsetHeight
  el.style.transition = `height ${DURATION}ms ease, opacity ${DURATION}ms ease`
  el.style.height = el.scrollHeight + 'px'
  el.style.opacity = '1'
  // ensure opener is hidden during entering
  if (el.id === 'cercaEventiInfo') {
    showOpener.value = false
  }
}
function slideAfterEnter(el) {
  el.style.transition = ''
  el.style.height = 'auto'
  el.style.overflow = ''
}
function slideLeave(el) {
  el.style.overflow = 'hidden'
  el.style.height = el.scrollHeight + 'px'
  el.style.opacity = '1'
  // force reflow
  void el.offsetHeight
  el.style.transition = `height ${DURATION}ms ease, opacity ${DURATION}ms ease`
  el.style.height = '0'
  el.style.opacity = '0'
}
function slideAfterLeave(el) {
  el.style.transition = ''
  el.style.height = ''
  el.style.overflow = ''
  // now that the panel is gone, show the opener to avoid left-shift during animation
  if (el.id === 'cercaEventiInfo') {
    showOpener.value = true
  }
}

function onOpenerAfterLeave() {
  // Step 2: after the opener has slid away, open the info panel
  if (isOpening.value) {
    isOpening.value = false
    // next frame ensures DOM has removed opener before measuring panel
    nextTick(() => {
      showInfo.value = true
    })
  }
}

// ------- Events data (optimize section rendering) -------
const events = ref([])
const isLoading = ref(true)
const days = [0, 1, 2, 3]

// Date parsing helpers (usable both in setup and template)
function parseEnd(ev) {
  const raw = ev['end.dateTime'] ?? ev['end.date'] ?? ev.endDateTime ?? ev.endDate
  if (!raw || typeof raw !== 'string') return null
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return new Date(raw)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T00:00:00`)
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function parseStart(ev) {
  const raw = ev['start.dateTime'] ?? ev['start.date'] ?? ev.startDateTime ?? ev.startDate
  if (!raw || typeof raw !== 'string') return null
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return new Date(raw)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T00:00:00`)
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function dayOffsetFromToday(date) {
  if (!(date instanceof Date) || isNaN(date)) return null
  const startOfDay = (d) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
  }
  const today = startOfDay(new Date())
  const day = startOfDay(date)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((day.getTime() - today.getTime()) / msPerDay)
}

function getEventStartDate(ev) {
  return parseStart(ev) || parseEnd(ev)
}

// Determine event status relative to "now": 'past' | 'running' | 'future'
function eventStatus(ev) {
  const now = new Date()
  const hasDateTime =
    ev['start.dateTime'] != null || ev['end.dateTime'] != null || ev.startDateTime != null || ev.endDateTime != null

  let s = parseStart(ev)
  let e = parseEnd(ev) || s

  if (!s && !e) return 'future'

  // If same instant for datetime events, extend end by +1h (keeps parity with legacy handling)
  if (hasDateTime && s && e && s.getTime() === e.getTime()) {
    e = new Date(e)
    e.setHours(e.getHours() + 1)
  }

  // For all-day (date-only) events, treat end as end-of-day
  if (!hasDateTime && e) {
    e = new Date(e)
    e.setHours(23, 59, 59, 999)
  }

  // If start missing but end exists, assume start = end (so single moment/day)
  if (!s && e) s = new Date(e)

  if (e && now.getTime() > e.getTime()) return 'past'
  if (s && e && now.getTime() >= s.getTime() && now.getTime() <= e.getTime()) return 'running'
  return 'future'
}

function eventClasses(ev) {
  const st = eventStatus(ev)
  return {
    'event-running': st === 'running',
    'event-past': st === 'past',
  }
}

onMounted(async () => {
  try {
    const res = await fetch(
      'https://docs.google.com/spreadsheets/d/1ADaUVRQeYU078-suUxGk0u1aMj_GbcjsAzG11YlMp5g/export?format=csv&id=1ADaUVRQeYU078-suUxGk0u1aMj_GbcjsAzG11YlMp5g&gid=0',
    )
    const csv = await res.text()
    events.value = csv2json(csv)

    // Filter: keep events whose end is after the start of today.
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    events.value = (events.value || []).filter((ev) => {
      const end = parseEnd(ev)
      return end ? end.getTime() > todayStart.getTime() : false
    })

    // Sort: by start date ascending, then by end date ascending when starts are equal
    const compareEvents = (a, b) => {
      const as = parseStart(a)
      const bs = parseStart(b)
      if (as && bs) {
        const diff = as.getTime() - bs.getTime()
        if (diff !== 0) return diff
      } else if (as && !bs) return -1
      else if (!as && bs) return 1

      const ae = parseEnd(a)
      const be = parseEnd(b)
      if (ae && be) return ae.getTime() - be.getTime()
      else if (ae && !be) return -1
      else if (!ae && be) return 1
      return 0
    }

    events.value.sort(compareEvents)

    console.log(events.value)
  } catch (e) {
    console.error('Failed to fetch events', e)
    events.value = []
  } finally {
    isLoading.value = false
  }
})

// Group events into buckets by day offset (0 = today, 1, 2, 3)
const eventsByDay = computed(() => {
  const buckets = { 0: [], 1: [], 2: [], 3: [] }
  for (const ev of events.value || []) {
    const start = getEventStartDate(ev)
    const off = start ? dayOffsetFromToday(start) : null
    if (off != null && off >= 0 && off <= 3) buckets[off].push(ev)
  }
  return buckets
})

// Apply active filter to events per day
const filteredEventsByDay = computed(() => {
  const out = { 0: [], 1: [], 2: [], 3: [] }
  const filter = activeFilter.value
  const match = (ev) => {
    const st = eventStatus(ev)
    switch (filter) {
      case 'Nascondi conclusi':
        return st !== 'past'
      case 'In corso':
        return st === 'running'
      case 'Futuri':
        return st === 'future'
      case 'Conclusi':
        return st === 'past'
      default:
        return true
    }
  }
  for (const k of [0, 1, 2, 3]) {
    out[k] = (eventsByDay.value[k] || []).filter(match)
  }
  return out
})

function eventsForDay(dayIndex) {
  return filteredEventsByDay.value[dayIndex] || []
}

const hasAnyEvents = computed(() =>
  [0, 1, 2, 3].some((d) => (filteredEventsByDay.value?.[d]?.length || 0) > 0),
)

// ------- Dates header formatting -------
function getDateInfo(offset) {
  const base = new Date()
  // normalize to midday to avoid DST edge-cases when adding days
  base.setHours(12, 0, 0, 0)
  const d = new Date(base)
  d.setDate(base.getDate() + offset)

  const weekday = new Intl.DateTimeFormat('it-IT', { weekday: 'long' }).format(d)
  const day = new Intl.DateTimeFormat('it-IT', { day: '2-digit' }).format(d)
  const month = new Intl.DateTimeFormat('it-IT', { month: '2-digit' }).format(d)
  const year = new Intl.DateTimeFormat('it-IT', { year: 'numeric' }).format(d)

  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
  const weekdayCap = capitalize(weekday)

  const label =
    offset === 0
      ? 'Oggi'
      : offset === 1
        ? 'Domani'
        : offset === 2
          ? 'Dopodomani'
          : `Tra ${offset} giorni`
  const dateText = `${weekdayCap} ${day}/${month}/${year}`

  return { label, dateText }
}

// ------- Filters: behaviors -------
function toggleFilters() {
  filtersOpen.value = !filtersOpen.value

  const btns = filterBtnStates.value
  if (filtersOpen.value) {
    // opening: sequential fade in left->right
    btns.forEach((_, i) => {
      setTimeout(() => {
        btns[i].hidden = false
        btns[i].fadeLeftOut = false
        btns[i].fadeRight = true
      }, 150 * i)
    })
    // hide reset while opening; will be shown if active filter exists
    resetVisible.value = !!activeFilter.value
  } else {
    // closing: sequential fade out right->left
    for (let i = btns.length - 1; i >= 0; i--) {
      setTimeout(() => {
        btns[i].fadeRight = false
        btns[i].fadeLeftOut = true
      }, 150 * (btns.length - 1 - i))
    }
    // keep reset visibility depending on active filter
    resetVisible.value = !!activeFilter.value
  }
}

function applyFilter(label) {
  // Clicking the already active filter clears it
  if (activeFilter.value === label) {
    activeFilter.value = ''
    localStorage.removeItem('filter')
    resetVisible.value = false
    return
  }

  activeFilter.value = label
  localStorage.setItem('filter', label)
  resetVisible.value = true
}

function resetFilters() {
  activeFilter.value = ''
  localStorage.removeItem('filter')
  resetVisible.value = false
}

function applyFilterFromLocalStorage() {
  const saved = localStorage.getItem('filter')
  if (saved && filterLabels.includes(saved)) {
    activeFilter.value = saved
    resetVisible.value = true
    // Inform the user filters were restored automatically
    generateAlert('info', 'Ci sono filtri attivi')
  }
}

onMounted(() => {
  // After events load code runs above, also try to restore a saved filter
  applyFilterFromLocalStorage()
})

// ------- Event display helpers -------
function getField(ev, names) {
  for (const n of names) {
    if (ev[n] != null && ev[n] !== '') return ev[n]
  }
  return null
}

function displayTitle(ev) {
  return getField(ev, ['title', 'summary', 'data', 'name']) || 'Evento'
}

function displayStartText(ev) {
  const raw = getField(ev, ['start.dateTime', 'start.date', 'startDateTime', 'startDate'])
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const d = new Date(raw)
    if (!isNaN(d)) return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    return raw
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 'Tutto il giorno'
  return raw
}

function displayEndText(ev) {
  const raw = getField(ev, ['end.dateTime', 'end.date', 'endDateTime', 'endDate'])
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const d = new Date(raw)
    if (!isNaN(d)) return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    return raw
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 'Tutto il giorno'
  return raw
}
</script>

<template>
  <div id="CercaEventi">
    <!-- cerca eventi -->
    <div class="cercaEventi-container">
      <div class="cercaEventi">
        <div class="cercaEventi-title">
          <span class="material-symbols-outlined"> event </span>
          <h1>Cerca <br /><span class="primary-text">eventi</span></h1>
        </div>

        <div class="cercaEventi-form">
          <div class="material-textfield">
            <input
              placeholder=" "
              type="text"
              id="cercaEventiInput"
              v-model="query"
              @input="toUppercase"
              @keyup.enter="cercaEventi"
            />
            <label>Keyword</label>
          </div>
          <a id="submit-btn" class="btn filled addButton" @click="cercaEventi">
            <font-awesome-icon :icon="faChevronRight" />
          </a>
        </div>
      </div>
    </div>
  </div>

  <div class="relative flex-center-x cercaEventiInfo-container">
    <transition name="opener" @after-leave="onOpenerAfterLeave">
      <a id="cercaEventiInfoShow" class="btn text" v-if="showOpener" @click="openInfo">
        <span class="material-symbols-outlined material-space-right">help</span>
        <span>Come funziona?</span>
      </a>
    </transition>

    <transition
      @enter="slideEnter"
      @after-enter="slideAfterEnter"
      @leave="slideLeave"
      @after-leave="slideAfterLeave"
    >
      <div class="rounded-container" id="cercaEventiInfo" v-if="showInfo">
        <div class="rounded-inner">
          <p>
            Cerca nel <span class="primary-text">calendario giornaliero</span> una
            <span class="primary-text">keyword</span> e mostra le variazioni previsti nei prossimi 3
            giorni.
          </p>
          <p>
            Fai attenzione alla <span class="primary-text">formattazione</span> della keyword:
            dev'essere uguale a quella scritta nel calendario giornaliero!
          </p>
          <transition
            @enter="slideEnter"
            @after-enter="slideAfterEnter"
            @leave="slideLeave"
            @after-leave="slideAfterLeave"
          >
            <div v-if="showDetails">
              <ul>
                <li style="padding: 0; line-height: 1">
                  Esempio: con <code>5CIIN</code> mostra le variazioni della classe <i>5CIIN</i>.
                </li>
              </ul>
              <p>
                Accetta i cookies per <span class="primary-text">salvare</span> le keyword inserite.
              </p>
              <p>Usa <code>*</code> per mostrare tutte le variazioni.</p>
            </div>
          </transition>
          <div class="action-btn-container">
            <a class="btn text" @click="toggleDetails">
              <span class="action-btn-container-btn-text">{{
                showDetails ? 'Mostra di meno' : 'Mostra di più'
              }}</span>
            </a>
            <a class="btn filled" @click="closeInfo">Chiudi</a>
          </div>
        </div>
      </div>
    </transition>
  </div>

  <div class="cercaEventi-section">
    <div class="cercaEventi-keywords-list" style="display: none"></div>
    <div class="cercaEventi-filter-container">
      <div class="relative">
        <a
          class="btn flex-center"
          :class="filtersOpen ? 'filled' : 'outlined'"
          @click="toggleFilters"
        >
          <span class="material-symbols-outlined material-space-right">{{ filterIcon }}</span>
          Filtri
        </a>
        <span
          class="material-symbols-outlined filter-on-circle"
          :style="{ visibility: filterBadgeVisible ? 'visible' : 'hidden' }"
        >
          circle
        </span>
      </div>
      <a
        v-for="(label, idx) in filterLabels"
        :key="label"
        class="btn filter-btn"
        :class="[
          activeFilter === label ? 'filled' : 'outlined',
          filterBtnStates[idx].hidden ? 'hidden' : '',
          filterBtnStates[idx].fadeRight ? 'fade-right' : '',
          filterBtnStates[idx].fadeLeftOut ? 'fade-left-out' : '',
        ]"
        @click="applyFilter(label)"
      >
        {{ label }}
      </a>
      <a
        class="btn text reset-filter-btn"
        :class="[resetVisible ? 'fade-right' : 'fade-left-out', resetVisible ? '' : 'hidden']"
        @click="resetFilters"
      >
        Reset filtri
      </a>
    </div>

    <!-- TODO similar events -->
    <div class="events-content-container">
      <div id="events-loading" v-show="isLoading">
        <div class="lds-grid">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>

      <div
        id="noevents"
        style="text-align: center; margin: 25px 0"
        v-show="!isLoading && !hasAnyEvents"
      >
        Nessun evento disponibile.
      </div>
      <div
        v-for="d in days"
        :key="d"
        class="events-container"
        :id="`events-${d}`"
        :style="{ display: eventsForDay(d).length ? 'block' : 'none' }"
      >
        <h3 class="events-date" :id="`events-${d}-date`">
          <span class="primary-text">{{ getDateInfo(d).label }}</span>
          <span>{{ getDateInfo(d).dateText }}</span>
        </h3>
        <div class="events-list" :id="`events-${d}-eventslist`">
          <div
            v-for="(event, i) in eventsForDay(d)"
            :key="i"
            class="event"
            :class="eventClasses(event)"
          >
            <p class="event-title">{{ displayTitle(event) }}</p>
            <div class="event-time">
              <p class="event-time-start">
                <span class="start-end-text">
                  <span class="material-symbols-outlined">start</span>
                </span>
                <span>{{ displayStartText(event) }}</span>
              </p>

              <p class="event-time-end">
                <span class="start-end-text">
                  <span class="material-symbols-outlined mirrorElement">start</span>
                </span>
                <span>{{ displayEndText(event) }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="../assets/css/cercaeventi.css"></style>

<style>
/* Simple slide-down/up for the info panel */
.slide-enter-active,
.slide-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}
.slide-enter-to,
.slide-leave-from {
  max-height: 1000px; /* large enough to contain content */
  opacity: 1;
}

/* Opener link slide/fade animation */
.opener-enter-active,
.opener-leave-active {
  transition:
    transform 300ms ease,
    opacity 300ms ease;
}
.opener-enter-from,
.opener-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}
.opener-enter-to,
.opener-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>
