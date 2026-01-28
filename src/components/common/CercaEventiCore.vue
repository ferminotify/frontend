<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import csv2json from '@/utils/csv2json.js'

const props = defineProps({
  activeFilter: {
    type: String,
    default: '',
  },
  keywords: {
    type: Array,
    default: () => [],
  },
})

const events = ref([])
const isLoading = ref(true)
const days = [0, 1, 2, 3]

// Intersection observer for scroll-triggered animations
let observer = null
let initialLoad = true
let animationsReady = false
let pendingElements = [] // Queue for elements that scroll into view before animations are ready
let batchTimeout = null // For batching scroll-triggered animations

onMounted(async () => {
  // Setup intersection observer for event cards
  observer = new IntersectionObserver(
    (entries) => {
      // Collect all initially visible events for staggered animation
      const visibleOnLoad = []
      
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (initialLoad) {
            visibleOnLoad.push(entry.target)
          } else if (animationsReady) {
            // Queue elements and batch them with a small delay
            pendingElements.push(entry.target)
            
            // Debounce: wait a frame to collect all visible elements, then animate with stagger
            if (batchTimeout) clearTimeout(batchTimeout)
            batchTimeout = setTimeout(() => {
              pendingElements.forEach((el, index) => {
                el.style.animationDelay = `${index * 40}ms`
                el.classList.add('event-visible')
              })
              pendingElements = []
            }, 16)
          } else {
            // Queue elements that appear before initial animations are done
            pendingElements.push(entry.target)
          }
          observer.unobserve(entry.target) // Only animate once
        }
      })
      
      // Apply staggered delays to initially visible events
      if (initialLoad && visibleOnLoad.length > 0) {
        visibleOnLoad.forEach((el, index) => {
          el.style.animationDelay = `${index * 40}ms`
          el.classList.add('event-visible')
        })
        initialLoad = false
        
        // Wait for all initial animations to complete before enabling scroll animations
        const totalDuration = (visibleOnLoad.length - 1) * 40 + 350 // last delay + animation duration
        setTimeout(() => {
          animationsReady = true
          // Animate any queued elements with staggered delays
          pendingElements.forEach((el, index) => {
            el.style.animationDelay = `${index * 40}ms`
            el.classList.add('event-visible')
          })
          pendingElements = []
        }, totalDuration)
      }
    },
    { threshold: 0.01, rootMargin: '0px 0px -20px 0px' }
  )

  try {
    const res = await fetch(
      'https://docs.google.com/spreadsheets/d/1ADaUVRQeYU078-suUxGk0u1aMj_GbcjsAzG11YlMp5g/export?format=csv&id=1ADaUVRQeYU078-suUxGk0u1aMj_GbcjsAzG11YlMp5g&gid=0'
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

    // if query param 'id' is provided, scroll to that event
    const urlParams = new URLSearchParams(window.location.search)
    const eventId = urlParams.get('id')
    if (eventId) {
      setTimeout(() => {
        const el = document.getElementById(eventId)
        if (el) {
          const yOffset = -50
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }, 500)
    }
  } catch (e) {
    console.error('Failed to fetch events', e)
    events.value = []
  } finally {
    isLoading.value = false
    // Observe event elements after loading completes
    setTimeout(() => {
      document.querySelectorAll('.event').forEach((el) => {
        if (observer) observer.observe(el)
      })
    }, 50)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

// Watch for changes in filtered events and re-observe new elements
watch(
  () => [props.activeFilter, props.keywords],
  () => {
    // Wait for DOM to update with new filtered events
    setTimeout(() => {
      document.querySelectorAll('.events-list .event:not(.event-visible)').forEach((el) => {
        if (observer) observer.observe(el)
      })
    }, 50)
  },
  { deep: true }
)

// Date parsing helpers
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
  const filter = props.activeFilter
  const keywords = props.keywords || []

  const match = (ev) => {
    const st = eventStatus(ev)

    // First apply status filter
    let statusMatch = true
    switch (filter) {
      case 'Nascondi conclusi':
        statusMatch = st !== 'past'
        break
      case 'In corso':
        statusMatch = st === 'running'
        break
      case 'Futuri':
        statusMatch = st === 'future'
        break
      case 'Conclusi':
        statusMatch = st === 'past'
        break
    }

    if (!statusMatch) return false

    // Then apply keyword filter (if any keywords provided)
    if (keywords.length === 0) return true

    // Special case: '*' shows all events
    if (keywords.includes('*')) return true

    // Check if event title/summary matches any keyword using word boundaries
    const title = displayTitle(ev).toUpperCase()
    return keywords.some((kw) => {
      // Use word boundary regex for more precise matching (like dashboard.ejs)
      const regex = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '\\b', 'i')
      return regex.test(title)
    })
  }

  for (const k of [0, 1, 2, 3]) {
    out[k] = (eventsByDay.value[k] || []).filter(match)
  }
  return out
})

function eventsForDay(dayIndex) {
  return filteredEventsByDay.value[dayIndex] || []
}

const hasAnyEvents = computed(() => [0, 1, 2, 3].some((d) => (filteredEventsByDay.value?.[d]?.length || 0) > 0))

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

  const label = offset === 0 ? 'Oggi' : offset === 1 ? 'Domani' : offset === 2 ? 'Dopodomani' : `Tra ${offset} giorni`
  const dateText = `${weekdayCap} ${day}/${month}/${year}`

  return { label, dateText }
}

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

// Return true when start and end are present and represent the same instant/date
function sameStartEnd(ev) {
  const startRaw = getField(ev, ['start.dateTime', 'start.date', 'startDateTime', 'startDate'])
  const endRaw = getField(ev, ['end.dateTime', 'end.date', 'endDateTime', 'endDate'])
  if (!startRaw || !endRaw) return false
  // Quick string equality (covers most CSV-exact cases)
  if (startRaw === endRaw) return true

  // Parse as dates and compare instants (handles equivalent representations)
  const s = parseStart(ev)
  const e = parseEnd(ev)
  if (s && e) {
    if (s.getTime() === e.getTime()) return true

    // Handle all-day events where Google Calendar represents a single-day
    // event as end = start + 1 day (end is exclusive). Treat that as "same".
    const msPerDay = 24 * 60 * 60 * 1000
    if (e.getTime() === s.getTime() + msPerDay) {
      // Ensure both raw values were date-only (not date-time)
      const dateOnly = (str) => /^\d{4}-\d{2}-\d{2}$/.test(str)
      if (dateOnly(startRaw) && dateOnly(endRaw)) return true
    }
  }

  return false
}
</script>

<template>
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

    <div id="noevents" style="text-align: center; margin: 25px 0" v-show="!isLoading && !hasAnyEvents">
      Nessun evento disponibile.
    </div>
    <div
      v-for="d in days"
      :key="d"
      class="events-container"
      :id="`events-${d}`"
      :style="{ display: eventsForDay(d).length ? 'block' : 'none' }">
      <h3 class="events-date" :id="`events-${d}-date`">
        <span class="primary-text">{{ getDateInfo(d).label }}</span>
        <span>{{ getDateInfo(d).dateText }}</span>
      </h3>
      <div class="events-list" :id="`events-${d}-eventslist`">
        <div v-for="(event, i) in eventsForDay(d)" :key="i" class="event" :class="eventClasses(event)" :id="event.uid">
          <p class="event-title">{{ displayTitle(event) }}</p>
          <div class="event-time">
            <p class="event-time-start">
              <span class="start-end-text">
                <span class="material-symbols-outlined">{{ sameStartEnd(event) ? 'schedule' : 'start' }}</span>
              </span>
              <span>{{ displayStartText(event) }}</span>
            </p>

            <p v-if="!sameStartEnd(event)" class="event-time-end">
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
</template>

<style scoped src="@/assets/css/cercaeventi.css"></style>

<style scoped>
/* Fade-up entrance animation for events - triggered on scroll into view */
@keyframes event-fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Events start hidden until scrolled into view */
.event {
  opacity: 0;
  transform: translateY(16px);
}

/* Animate when visible */
.event.event-visible {
  animation: event-fade-up 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
}

/* Hover effect for event items: subtle lift and background lightening */
.event {
  transition: background-color 220ms cubic-bezier(.2,.9,.2,1),
    transform 220ms cubic-bezier(.2,.9,.2,1),
    box-shadow 220ms cubic-bezier(.2,.9,.2,1);
  will-change: transform, background-color;
}
.event:hover {
  /* lightening effect that works reasonably in both light/dark themes */
  background-color: rgba(255, 255, 255, 0.04);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

/* Make the icon and title slightly pop on hover */
.event:hover .event-title {
  transform: translateY(-1px);
}
.event .event-title {
  transition: transform 220ms cubic-bezier(.2,.9,.2,1);
}
</style>
