<template>
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
            @select="$emit('select-day', day.date, cell.start)"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  import TimetableCell from './TimetableCell.vue'
  import { weekdayShort, dayOfMonth, hourNumber } from '@/utils/timetable'

  const props = defineProps({
    days: { type: Array, required: true },
    times: { type: Array, required: true },
    today: { type: String, required: true },
    entityType: { type: String, required: true },
    entityName: { type: String, default: '' },
    window: { type: Object, required: true },
  })
  defineEmits(['select-day'])

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
