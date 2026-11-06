<template>
  <div class="tt-week-wrap">
  <div ref="scroller" class="tt-week-scroll">
    <div
      class="tt-week"
      role="table"
      :aria-label="`Orario settimanale ${entityName}`"
      :style="{
        gridTemplateColumns: `var(--time-col) repeat(${days.length}, minmax(var(--day-min), 1fr))`,
        gridTemplateRows: `auto repeat(${times.length}, minmax(var(--row-min), auto))`,
      }"
    >
      <div class="tt-week-corner" aria-hidden="true"></div>
      <div
        v-for="(day, i) in days"
        :key="day.date"
        class="tt-week-head"
        :class="{ 'is-today': day.date === today }"
        :style="{ gridColumn: i + 2, gridRow: 1 }"
        :data-today="day.date === today || undefined"
        role="columnheader"
      >
        <span class="tt-week-weekday">{{ weekdayShort(day.weekday) }}</span>
        <span class="tt-week-daynum">{{ dayOfMonth(day.date) }}</span>
        <span v-if="!day.published" class="tt-week-unpublished" :title="unpublishedHint(day)">
          <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
        </span>
      </div>

      <div
        v-for="(time, r) in times"
        :key="time"
        class="tt-week-time"
        :style="{ gridColumn: 1, gridRow: r + 2 }"
        role="rowheader"
      >
        <span v-if="hourNumber(time)">{{ hourNumber(time) }}ª</span>
        <span class="tt-week-time-clock">{{ time }}</span>
      </div>

      <!-- Background lines, one per row -->
      <div
        v-for="(time, r) in times"
        :key="`line-${time}`"
        class="tt-week-rowline"
        :style="{ gridColumn: `2 / span ${days.length}`, gridRow: r + 2 }"
        aria-hidden="true"
      ></div>

      <template v-for="(day, i) in days" :key="`cells-${day.date}`">
        <div
          v-for="cell in day.cells"
          :key="`${day.date}-${cell.start}`"
          class="tt-week-slot"
          :class="{ 'is-today': day.date === today }"
          :style="{ gridColumn: i + 2, gridRow: `${times.indexOf(cell.start) + 2} / span ${cell.span}` }"
          role="cell"
        >
          <TimetableCell
            :cell="cell"
            :entity-type="entityType"
            compact
            interactive
            @select="(c, el) => $emit('cell-menu', { day, cell: c, el })"
          />
        </div>
        <!-- Variations with real times (10:30–11:30): on top of the lessons, at those times -->
        <div
          v-for="o in day.overlays || []"
          :key="`${day.date}-o-${o.variations[0].uid}`"
          class="tt-overlay tt-week-overlay"
          :style="{ ...overlayArea(o), ...overlayInset(o) }"
          role="cell"
        >
          <div class="tt-overlay-card tt-week-overlay-card">
            <!-- Taps cycle: one line → full card → lesson menu → one line again -->
            <TimetableCell
              :brief="!stage.has(keyOf(day, o))"
              :aria-expanded="stage.has(keyOf(day, o))"
              :cell="o"
              :entity-type="entityType"
              compact
              interactive
              @select="(c, el) => cycle(keyOf(day, o), () => $emit('cell-menu', { day, cell: c, el }), el)"
            />
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- Events not placed in the grid (no time, no lesson to attach to, or only possibly
       about this timetable): listed so that nothing is lost. -->
  <div v-if="notedDays.length" class="tt-week-notes">
    <h3>Altre variazioni della settimana</h3>
    <ul>
      <template v-for="day in notedDays" :key="`notes-${day.date}`">
        <li v-for="n in day.notes" :key="n.uid" :class="{ 'is-maybe': n.maybe }">
          <span class="tt-week-notes-when">
            {{ weekdayLong(day.weekday) }} {{ dayOfMonth(day.date) }} · {{ n.start ? `${n.start} – ${n.end}` : 'tutto il giorno' }}
          </span>
          <span v-if="n.maybe" class="tt-notes-maybe">Variazione</span>
          {{ n.summary }}
        </li>
      </template>
    </ul>
  </div>
  </div>
</template>

<script setup>
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { useOverlayCycle } from '@/composables/useOverlayCycle'
  import './orario.css'
  import TimetableCell from './TimetableCell.vue'
  import { weekdayShort, weekdayLong, dayOfMonth, hourNumber, overlayBox } from '@/utils/timetable'

  const props = defineProps({
    days: { type: Array, required: true },
    times: { type: Array, required: true },
    extraTimes: { type: Array, default: () => [] }, // rows of events out of the lessons (no hour number)
    today: { type: String, required: true },
    entityType: { type: String, required: true },
    entityName: { type: String, default: '' },
    window: { type: Object, required: true },
  })
  defineEmits(['cell-menu'])

  // Overlays opened to the full card (by day + event).
  const keyOf = (day, o) => `${day.date}-${o.variations[0].uid}`
  const { stage, cycle } = useOverlayCycle()

  function overlayArea(o) {
    const box = overlayBox(o, props.times, props.extraTimes)
    const first = props.times.indexOf(box.from)
    const span = props.times.indexOf(box.to) - first + 1
    const col = props.days.findIndex((d) => (d.overlays || []).includes(o)) + 2
    return { gridColumn: col, gridRow: `${first + 2} / span ${span}` }
  }
  function overlayInset(o) {
    const box = overlayBox(o, props.times, props.extraTimes)
    // In the flow of the grid: space above and below in proportion to the minutes; when the
    // text needs more room the rows grow (the lessons beside get taller), nothing is covered.
    // At least the lesson's title (two lines in the grid) stays visible above it.
    return { gridTemplateRows: `minmax(46px, ${box.top}fr) auto ${box.bottom}fr` }
  }

  const notedDays = computed(() => props.days.filter((d) => d.notes?.length))

  // On narrow screens the grid scrolls sideways: start on today's column.
  // Waits until the grid is actually laid out (it may mount behind the boot loading screen).
  const scroller = ref(null)
  let observer = null
  function scrollToToday() {
    const el = scroller.value
    if (!el || !el.clientWidth) return false
    const todayHead = el.querySelector('[data-today]')
    if (todayHead && el.scrollWidth > el.clientWidth) {
      const timeCol = el.querySelector('.tt-week-time')?.offsetWidth || 0
      el.scrollLeft = todayHead.offsetLeft - timeCol - 8
    }
    return true
  }
  onMounted(() => {
    if (scrollToToday() || typeof ResizeObserver === 'undefined') return
    observer = new ResizeObserver(() => {
      if (scrollToToday()) observer.disconnect()
    })
    observer.observe(scroller.value)
  })
  onBeforeUnmount(() => observer?.disconnect())

  const unpublishedHint = (day) =>
    day.date > props.window.to ? 'Variazioni non ancora pubblicate' : 'Variazioni non più disponibili'
</script>

<style scoped>
  .tt-week-notes {
    margin-top: 24px;
  }
  .tt-week-notes h3 {
    margin: 0 0 8px;
    font-size: 0.9375rem;
  }
  .tt-week-notes ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 0.875rem;
    line-height: 1.4;
  }
  .tt-week-notes li {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .tt-week-notes-when {
    color: var(--text-secondary, inherit);
    font-size: 0.8125rem;
  }
  .tt-week-scroll {
    width: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--divider) transparent;
  }

  .tt-week {
    --time-col: 56px;
    --day-min: 132px;
    --row-min: 72px;
    display: grid;
    column-gap: 6px;
    row-gap: 6px;
    min-width: min-content;
    position: relative;
  }

  .tt-week-corner {
    grid-column: 1;
    grid-row: 1;
    position: sticky;
    left: 0;
    z-index: 3;
    background: var(--surface);
  }

  .tt-week-head {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 6px;
    padding: 6px 0 10px;
    color: var(--on-surface-variant);
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--surface);
  }
  .tt-week-weekday {
    font-size: 0.8125rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .tt-week-daynum {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--on-surface);
    font-variant-numeric: tabular-nums;
  }
  .tt-week-head.is-today .tt-week-weekday {
    color: var(--on-surface-primary);
  }
  .tt-week-head.is-today .tt-week-daynum {
    display: inline-grid;
    place-items: center;
    min-width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--primary);
    color: var(--on-primary);
  }
  .tt-week-unpublished {
    color: var(--muted);
    align-self: center;
  }
  .tt-week-unpublished .material-symbols-outlined {
    font-size: 16px;
  }

  .tt-week-time {
    position: sticky;
    left: 0;
    z-index: 3;
    background: var(--surface);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-start;
    padding: 8px 8px 0 0;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--on-surface-variant);
    font-variant-numeric: tabular-nums;
  }
  .tt-week-time-clock {
    font-size: 0.6875rem;
    font-weight: 400;
    color: var(--muted);
  }

  .tt-week-rowline {
    border-top: 1px solid color-mix(in srgb, var(--divider) 45%, transparent);
    margin-top: -3px;
    pointer-events: none;
  }

  .tt-week-slot {
    position: relative;
    z-index: 1;
    min-width: 0;
  }
  .tt-week-slot:has(.is-menu-open) {
    z-index: 3;
  }
  /* .tt-overlay / .tt-overlay-card in orario.css; here the week grid's inset and shadow */
  .tt-week-overlay {
    padding-left: 10px;
  }
  .tt-week-overlay-card {
    border-radius: 12px;
    box-shadow: 0 4px 14px rgb(0 0 0 / 0.45);
  }

  @media (max-width: 700px) {
    .tt-week {
      --time-col: 44px;
      --day-min: 118px;
      --row-min: 64px;
      column-gap: 4px;
      row-gap: 4px;
    }
  }
</style>
