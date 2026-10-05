<template>
  <div class="section orario">
    <Title title="Orario" subtitle="Orario di classi e aule, aggiornato con le variazioni del giorno." />

    <!-- Selection -->
    <div class="orario-controls">
      <div class="orario-segmented" role="radiogroup" aria-label="Tipo">
        <button
          v-for="opt in TYPE_OPTIONS"
          :key="opt.value"
          type="button"
          role="radio"
          :aria-checked="type === opt.value"
          :class="{ active: type === opt.value }"
          @click="switchType(opt.value)"
        >
          <span class="material-symbols-outlined" aria-hidden="true">{{ opt.icon }}</span>
          {{ opt.label }}
        </button>
      </div>

      <label class="orario-select">
        <span class="sr-only">{{ type === 'classe' ? 'Classe' : 'Aula' }}</span>
        <select :value="refKey" :disabled="!index" @change="selectEntity($event.target.value)">
          <option value="" disabled>{{ index ? (type === 'classe' ? 'Scegli una classe' : 'Scegli un’aula') : 'Caricamento…' }}</option>
          <optgroup v-for="g in groups" :key="g.label" :label="g.label">
            <option v-for="e in g.items" :key="e.key" :value="e.key">{{ e.name }}</option>
          </optgroup>
        </select>
        <span class="material-symbols-outlined" aria-hidden="true">expand_more</span>
      </label>
    </div>

    <p v-if="indexError" class="orario-message orario-message--error">
      <span class="material-symbols-outlined" aria-hidden="true">cloud_off</span>
      {{ indexError }}
      <button type="button" class="btn text" @click="loadIndex">Riprova</button>
    </p>

    <!-- Empty state -->
    <div v-if="!refKey" class="orario-empty">
      <span class="material-symbols-outlined" aria-hidden="true">calendar_view_week</span>
      <p>Scegli una classe o un’aula per vedere l’orario della settimana con le variazioni già applicate.</p>
    </div>

    <template v-else>
      <!-- Week + view toolbar -->
      <div class="orario-toolbar">
        <div class="orario-weeknav">
          <button type="button" class="orario-icon-btn" aria-label="Settimana precedente" :disabled="!week" @click="goWeek(week.prevWeek)">
            <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
          </button>
          <span class="orario-weeklabel">{{ week ? weekRangeLabel(week.days) : '…' }}</span>
          <button type="button" class="orario-icon-btn" aria-label="Settimana successiva" :disabled="!week" @click="goWeek(week.nextWeek)">
            <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
          </button>
          <button v-if="week && !isCurrentWeek" type="button" class="orario-today-btn" @click="goToday">Oggi</button>
        </div>

        <div class="orario-segmented orario-segmented--small" role="radiogroup" aria-label="Vista">
          <button
            v-for="opt in VIEW_OPTIONS"
            :key="opt.value"
            type="button"
            role="radio"
            :aria-checked="viewMode === opt.value"
            :class="{ active: viewMode === opt.value }"
            @click="setView(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <p v-if="error" class="orario-message orario-message--error">
        <span class="material-symbols-outlined" aria-hidden="true">cloud_off</span>
        {{ error }}
        <button type="button" class="btn text" @click="loadWeek()">Riprova</button>
      </p>

      <div v-if="loading && !week" class="orario-skeleton" aria-busy="true" aria-label="Caricamento orario">
        <div v-for="n in 6" :key="n" class="orario-skeleton-row"></div>
      </div>

      <div v-else-if="week" class="orario-body" :class="{ 'is-refreshing': loading }">
        <!-- Day picker (day view) -->
        <div v-if="viewMode === 'giorno'" class="orario-days" role="tablist" aria-label="Giorno">
          <button
            v-for="d in week.days"
            :key="d.date"
            type="button"
            role="tab"
            :aria-selected="d.date === selectedDay"
            class="orario-day-chip"
            :class="{ active: d.date === selectedDay, today: d.date === week.today }"
            @click="selectDay(d.date)"
          >
            <span class="orario-day-chip-wd">{{ weekdayShort(d.weekday) }}</span>
            <span class="orario-day-chip-num">{{ dayOfMonth(d.date) }}</span>
            <span v-if="hasChanges(d)" class="orario-day-chip-dot" aria-label="con variazioni"></span>
          </button>
        </div>

        <Transition name="orario-swap" mode="out-in">
          <TimetableWeek
            v-if="viewMode === 'settimana'"
            :key="`w-${week.weekStart}-${week.entity.key}`"
            :days="week.days"
            :times="week.times"
            :today="week.today"
            :entity-type="week.entity.type"
            :entity-name="week.entity.name"
            :window="week.variationsWindow"
            @select-day="openDay"
          />
          <TimetableDay
            v-else-if="currentDay"
            :key="`d-${currentDay.date}-${week.entity.key}`"
            :day="currentDay"
            :times="week.times"
            :today="week.today"
            :now-time="nowTime"
            :entity-type="week.entity.type"
            :window="week.variationsWindow"
            :focus="focusSlot"
          />
        </Transition>

        <div class="orario-footer">
          <ul class="orario-legend" aria-label="Legenda">
            <li><span class="swatch swatch--changed"></span>Variazione</li>
            <li><span class="swatch swatch--cancelled"></span>Annullata</li>
            <li v-if="week.entity.type === 'room'"><span class="swatch swatch--freed"></span>Aula libera</li>
            <li><span class="swatch swatch--added"></span>Aggiunta</li>
          </ul>
          <p class="orario-updated">
            <span v-if="week.stale" class="orario-stale">Dati non aggiornati ·</span>
            Aggiornato alle {{ updatedLabel }}
            <button type="button" class="orario-icon-btn orario-icon-btn--small" aria-label="Aggiorna" :disabled="loading" @click="loadWeek({ silent: true })">
              <span class="material-symbols-outlined" :class="{ spinning: loading }" aria-hidden="true">refresh</span>
            </button>
          </p>
          <p class="orario-source">
            Fonte: <a class="link" href="https://www.fermimn.edu.it/orario/" target="_blank" rel="noopener">orario ufficiale</a>
            e calendario giornaliero dell’istituto.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useHead } from '@unhead/vue'
  import Title from '@/components/common/Title.vue'
  import TimetableWeek from '@/components/orario/TimetableWeek.vue'
  import TimetableDay from '@/components/orario/TimetableDay.vue'
  import { fetchTimetableIndex, fetchTimetableWeek } from '@/api/timetable'
  import { groupEntities, weekRangeLabel, weekdayShort, dayOfMonth } from '@/utils/timetable'

  const TYPE_OPTIONS = [
    { value: 'classe', label: 'Classe', icon: 'groups' },
    { value: 'aula', label: 'Aula', icon: 'meeting_room' },
  ]
  const VIEW_OPTIONS = [
    { value: 'settimana', label: 'Settimana' },
    { value: 'giorno', label: 'Giorno' },
  ]
  const LAST_KEY = 'orario:last'
  const VIEW_KEY = 'orario:view'
  const REFRESH_MS = 2 * 60 * 1000

  const route = useRoute()
  const router = useRouter()

  const storage = {
    get(k) {
      try {
        return JSON.parse(localStorage.getItem(k))
      } catch {
        return null
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v))
      } catch {
        // storage unavailable (private mode): selection just isn't remembered
      }
    },
  }

  // --- selection (from the URL) ---------------------------------------------------
  const type = ref(route.params.type || 'classe')
  const refKey = computed(() => String(route.params.ref || '').toUpperCase())

  const index = ref(null)
  const indexError = ref('')
  const groups = computed(() => {
    if (!index.value) return []
    return groupEntities(type.value === 'classe' ? index.value.classes : index.value.rooms, type.value)
  })

  async function loadIndex() {
    indexError.value = ''
    try {
      index.value = await fetchTimetableIndex()
    } catch {
      indexError.value = 'Elenco di classi e aule non disponibile.'
    }
  }

  function selectEntity(key) {
    router.push({ name: 'orario', params: { type: type.value, ref: key.toLowerCase() }, query: route.query })
  }

  function switchType(t) {
    if (t === type.value) return
    type.value = t
    const last = storage.get(LAST_KEY)
    if (last?.[t]) router.push({ name: 'orario', params: { type: t, ref: last[t] }, query: route.query })
    else router.push({ name: 'orario', params: { type: t }, query: route.query })
  }

  // --- week data ------------------------------------------------------------------
  const week = ref(null)
  const loading = ref(false)
  const error = ref('')
  let requestId = 0

  async function loadWeek({ silent = false } = {}) {
    if (!refKey.value) {
      week.value = null
      return
    }
    const id = ++requestId
    loading.value = true
    if (!silent) error.value = ''
    try {
      const data = await fetchTimetableWeek(type.value, refKey.value.toLowerCase(), route.query.settimana)
      if (id !== requestId) return
      week.value = data
      error.value = ''
      ensureSelectedDay()
      rememberSelection(data.entity)
    } catch (e) {
      if (id !== requestId) return
      if (e.status === 404) {
        error.value = type.value === 'classe' ? 'Classe non trovata.' : 'Aula non trovata.'
        week.value = null
      } else if (!silent || !week.value) {
        error.value = 'Orario non raggiungibile in questo momento.'
      }
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  function rememberSelection(entity) {
    const t = entity.type === 'class' ? 'classe' : 'aula'
    const last = storage.get(LAST_KEY) || {}
    storage.set(LAST_KEY, { ...last, [t]: entity.key.toLowerCase(), type: t })
  }

  const isCurrentWeek = computed(() => week.value && week.value.days.some((d) => d.date === week.value.today))

  function goWeek(date) {
    router.push({ query: { ...route.query, settimana: date } })
  }
  function goToday() {
    const query = { ...route.query }
    delete query.settimana
    selectedDay.value = null
    router.push({ query })
  }

  // --- view mode + day -----------------------------------------------------------
  const viewMode = ref('settimana')
  const selectedDay = ref(null)
  const focusSlot = ref(null)

  function setView(v) {
    viewMode.value = v
    focusSlot.value = null
    storage.set(VIEW_KEY, v)
  }

  function ensureSelectedDay() {
    const days = week.value?.days || []
    if (days.some((d) => d.date === selectedDay.value)) return
    selectedDay.value = (days.find((d) => d.date === week.value.today) || days[0])?.date || null
  }

  function selectDay(date) {
    selectedDay.value = date
    focusSlot.value = null
  }

  function openDay(date, slot) {
    selectedDay.value = date
    focusSlot.value = slot
    viewMode.value = 'giorno'
  }

  const currentDay = computed(() => week.value?.days.find((d) => d.date === selectedDay.value) || null)
  const hasChanges = (d) => d.cells.some((c) => c.status !== 'regular') || d.notes.length > 0

  // --- clock + refresh ------------------------------------------------------------
  const nowTime = ref('')
  const tickNow = () => {
    nowTime.value = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' }).format(new Date())
  }
  const updatedLabel = computed(() =>
    week.value
      ? new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' }).format(new Date(week.value.updatedAt))
      : ''
  )

  let timer = null
  function onVisibility() {
    if (document.visibilityState === 'visible') {
      tickNow()
      loadWeek({ silent: true })
    }
  }

  // --- lifecycle ------------------------------------------------------------------
  watch(
    () => [route.params.type, route.params.ref, route.query.settimana],
    () => {
      if (route.name !== 'orario') return
      type.value = route.params.type || type.value
      if (week.value && week.value.entity.key !== refKey.value) week.value = null
      loadWeek()
    }
  )

  onMounted(() => {
    const savedView = storage.get(VIEW_KEY)
    viewMode.value = savedView || (window.matchMedia('(max-width: 700px)').matches ? 'giorno' : 'settimana')

    // /orario with nothing selected: reopen the last class/room.
    if (!route.params.ref) {
      const last = storage.get(LAST_KEY)
      const t = route.params.type || last?.type
      if (t && last?.[t]) {
        router.replace({ name: 'orario', params: { type: t, ref: last[t] }, query: route.query })
      }
    }

    loadIndex()
    loadWeek()
    tickNow()
    timer = setInterval(() => {
      tickNow()
      if (document.visibilityState === 'visible') loadWeek({ silent: true })
    }, REFRESH_MS)
    document.addEventListener('visibilitychange', onVisibility)
  })

  onBeforeUnmount(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisibility)
  })

  useHead(
    computed(() => {
      const name = week.value?.entity.name
      if (!name) return {}
      const what = week.value.entity.type === 'class' ? `classe ${name}` : name
      return {
        title: `Orario ${what} · Fermi Notify`,
        meta: [{ name: 'description', content: `Orario settimanale ${what} dell’IS Fermi di Mantova con le variazioni del giorno.` }],
      }
    })
  )
</script>

<style scoped>
  .orario {
    max-width: 1180px;
    --m3-emph-decel: cubic-bezier(0.05, 0.7, 0.1, 1);
    --m3-emph-accel: cubic-bezier(0.3, 0, 0.8, 0.15);
    --m3-standard: cubic-bezier(0.2, 0, 0, 1);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  /* Controls */
  .orario-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin: 24px 0 16px;
  }

  .orario-segmented {
    display: inline-flex;
    padding: 4px;
    gap: 4px;
    border-radius: 999px;
    background: var(--surface-variant);
  }
  .orario-segmented button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 16px;
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--on-surface-variant);
    transition:
      background-color 200ms var(--m3-standard),
      color 200ms var(--m3-standard);
  }
  .orario-segmented button .material-symbols-outlined {
    font-size: 20px;
  }
  .orario-segmented button:hover {
    color: var(--on-surface);
  }
  .orario-segmented button.active {
    background: var(--primary);
    color: var(--on-primary);
  }
  .orario-segmented--small button {
    min-height: 36px;
    padding: 0 14px;
  }

  .orario-select {
    position: relative;
    flex: 1 1 220px;
    max-width: 320px;
  }
  .orario-select select {
    appearance: none;
    width: 100%;
    min-height: 48px;
    padding: 0 44px 0 18px;
    border-radius: 16px;
    border: 1px solid var(--divider);
    background: var(--surface-variant);
    color: var(--on-surface);
    font: inherit;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 150ms var(--m3-standard);
  }
  .orario-select select:hover {
    border-color: var(--on-surface-variant);
  }
  .orario-select select:focus-visible {
    outline: 2px solid var(--on-surface-primary);
    outline-offset: 2px;
  }
  .orario-select .material-symbols-outlined {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--on-surface-variant);
  }

  /* Toolbar */
  .orario-toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .orario-weeknav {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .orario-weeklabel {
    min-width: 11ch;
    text-align: center;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .orario-icon-btn {
    display: inline-grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: var(--on-surface-variant);
    transition: background-color 150ms var(--m3-standard);
  }
  .orario-icon-btn:hover:not(:disabled) {
    background: color-mix(in srgb, var(--on-surface) 8%, transparent);
    color: var(--on-surface);
  }
  .orario-icon-btn:disabled {
    opacity: 0.38;
    cursor: default;
  }
  .orario-icon-btn--small {
    width: 32px;
    height: 32px;
  }
  .orario-icon-btn--small .material-symbols-outlined {
    font-size: 18px;
  }
  .orario-icon-btn:focus-visible,
  .orario-segmented button:focus-visible,
  .orario-today-btn:focus-visible,
  .orario-day-chip:focus-visible {
    outline: 2px solid var(--on-surface-primary);
    outline-offset: 2px;
  }
  .orario-today-btn {
    margin-left: 8px;
    min-height: 32px;
    padding: 0 14px;
    border-radius: 8px;
    border: 1px solid var(--divider);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--on-surface-primary);
    transition: background-color 150ms var(--m3-standard);
  }
  .orario-today-btn:hover {
    background: color-mix(in srgb, var(--on-surface-primary) 8%, transparent);
  }

  /* Day chips */
  .orario-days {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .orario-day-chip {
    position: relative;
    flex: 1 0 56px;
    max-width: 96px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 0;
    border-radius: 16px;
    border: 1px solid var(--divider);
    color: var(--on-surface-variant);
    transition:
      background-color 200ms var(--m3-standard),
      border-color 200ms var(--m3-standard);
  }
  .orario-day-chip-wd {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .orario-day-chip-num {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--on-surface);
    font-variant-numeric: tabular-nums;
  }
  .orario-day-chip.today .orario-day-chip-wd {
    color: var(--on-surface-primary);
  }
  .orario-day-chip.active {
    background: var(--primary);
    border-color: var(--primary);
    color: var(--on-primary);
  }
  .orario-day-chip.active .orario-day-chip-num,
  .orario-day-chip.active .orario-day-chip-wd {
    color: var(--on-primary);
  }
  .orario-day-chip-dot {
    position: absolute;
    top: 6px;
    right: 8px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--on-surface-primary);
  }

  /* Body */
  .orario-body {
    transition: opacity 200ms var(--m3-standard);
  }

  .orario-swap-enter-active {
    transition:
      opacity 250ms var(--m3-emph-decel),
      transform 300ms var(--m3-emph-decel);
  }
  .orario-swap-leave-active {
    transition: opacity 100ms var(--m3-emph-accel);
  }
  .orario-swap-enter-from {
    opacity: 0;
    transform: translateY(8px);
  }
  .orario-swap-leave-to {
    opacity: 0;
  }

  .orario-skeleton {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .orario-skeleton-row {
    height: 64px;
    border-radius: 12px;
    background: linear-gradient(90deg, var(--surface-variant) 0%, color-mix(in srgb, var(--on-surface) 6%, var(--surface-variant)) 50%, var(--surface-variant) 100%);
    background-size: 200% 100%;
    animation: orario-shimmer 1.4s linear infinite;
  }
  @keyframes orario-shimmer {
    from {
      background-position: 100% 0;
    }
    to {
      background-position: -100% 0;
    }
  }

  /* Empty / messages */
  .orario-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 56px 16px;
    text-align: center;
    color: var(--on-surface-variant);
  }
  .orario-empty .material-symbols-outlined {
    font-size: 40px;
    color: var(--on-surface-primary);
  }
  .orario-empty p {
    max-width: 42ch;
    margin: 0;
    line-height: 1.5;
  }

  .orario-message {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px;
    font-size: 0.875rem;
  }
  .orario-message--error {
    color: #f2b8b5;
  }

  /* Footer */
  .orario-footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px 24px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid color-mix(in srgb, var(--divider) 45%, transparent);
    font-size: 0.8125rem;
    color: var(--on-surface-variant);
  }
  .orario-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .orario-legend li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 4px;
  }
  .swatch--changed {
    border: 1px solid var(--on-surface-primary);
    background: color-mix(in srgb, var(--on-surface-primary) 12%, var(--surface-variant));
  }
  .swatch--cancelled {
    border: 1px solid color-mix(in srgb, var(--on-surface) 14%, transparent);
    background: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--on-surface) 10%, var(--surface)) 0 3px, var(--surface) 3px 6px);
  }
  .swatch--freed {
    border: 1px solid #a8dab5;
    background: color-mix(in srgb, #a8dab5 14%, var(--surface));
  }
  .swatch--added {
    border: 1px dashed var(--on-surface-primary);
  }
  .orario-updated {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
  .orario-stale {
    color: #f2b8b5;
  }
  .orario-source {
    flex-basis: 100%;
    margin: 0;
    color: var(--muted);
  }
  .spinning {
    animation: orario-spin 0.9s linear infinite;
  }
  @keyframes orario-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 700px) {
    .orario-controls {
      margin-top: 16px;
    }
    .orario-select {
      max-width: none;
    }
    .orario-toolbar {
      flex-direction: column-reverse;
      align-items: stretch;
    }
    .orario-toolbar .orario-segmented {
      align-self: stretch;
    }
    .orario-toolbar .orario-segmented button {
      flex: 1;
      justify-content: center;
    }
    .orario-weeknav {
      justify-content: space-between;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .orario-skeleton-row,
    .spinning {
      animation: none;
    }
    .orario-swap-enter-active,
    .orario-swap-leave-active {
      transition: none;
    }
  }
</style>
