<template>
  <div class="tt-day">
    <p v-if="!day.published" class="tt-day-hint">
      <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
      {{ day.date > window.to ? 'Le variazioni di questo giorno non sono ancora pubblicate: vedi l’orario normale.' : 'Variazioni non più disponibili per questo giorno.' }}
    </p>

    <p v-if="!day.cells.length" class="tt-day-empty">Nessuna lezione in questo giorno.</p>

    <ol v-else class="tt-day-list">
      <li
        v-for="row in rows"
        :key="row.start"
        :ref="(el) => setRef(row.start, el)"
        class="tt-day-row"
        :class="{ 'is-focused': focus === row.start, 'is-now': isNow(row), 'is-free': !row.cell }"
        :style="row.span > 1 ? { gridRow: `span ${row.span}` } : null"
      >
        <div class="tt-day-time">
          <span class="tt-day-hour">{{ hourLabel(row) }}</span>
          <span class="tt-day-clock">{{ row.start }}<span class="tt-day-clock-sep"> – </span><wbr />{{ cellEnd(row, times) }}</span>
        </div>
        <TimetableCell
          v-if="row.cell"
          :cell="row.cell"
          :entity-type="entityType"
          interactive
          @select="(c, el) => $emit('cell-menu', { day, cell: c, el })"
        />
        <div v-else class="tt-day-free" aria-label="Nessuna lezione"></div>
      </li>
    </ol>

    <div v-if="day.notes.length" class="tt-day-notes">
      <h3>Altre variazioni del giorno</h3>
      <ul>
        <li v-for="n in day.notes" :key="n.uid" :class="{ 'is-maybe': n.maybe }">
          <span class="tt-day-clock">{{ n.start ? `${n.start} – ${n.end}` : 'Tutto il giorno' }}</span>
          <span v-if="n.maybe" class="tt-day-notes-maybe">Possibile variazione</span>
          {{ n.summary }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
  import { computed, nextTick, onMounted, watch } from 'vue'
  import TimetableCell from './TimetableCell.vue'
  import { cellEnd, hourNumber } from '@/utils/timetable'

  const props = defineProps({
    day: { type: Object, required: true },
    times: { type: Array, required: true },
    entityType: { type: String, required: true },
    window: { type: Object, required: true },
    today: { type: String, required: true },
    nowTime: { type: String, default: '' },
    focus: { type: String, default: null }, // slot start to scroll to
  })
  defineEmits(['cell-menu'])

  const refs = new Map()
  const setRef = (start, el) => (el ? refs.set(start, el) : refs.delete(start))

  // Every slot of the week, like the week grid: lessons plus empty rows for the free hours.
  const rows = computed(() => {
    const byStart = new Map(props.day.cells.map((c) => [c.start, c]))
    const out = []
    for (let i = 0; i < props.times.length; i++) {
      const cell = byStart.get(props.times[i])
      if (cell) {
        out.push({ start: cell.start, slots: cell.slots, span: cell.span, cell })
        i += cell.span - 1
      } else {
        out.push({ start: props.times[i], slots: [props.times[i]], span: 1, cell: null })
      }
    }
    return out
  })

  const hourLabel = (cell) => {
    const first = hourNumber(cell.start)
    if (!first) return ''
    return cell.span > 1 ? `${first}ª–${first + cell.span - 1}ª` : `${first}ª`
  }

  const isNow = (cell) =>
    props.day.date === props.today && props.nowTime >= cell.start && props.nowTime < cellEnd(cell, props.times)

  async function scrollToFocus() {
    if (!props.focus) return
    await nextTick()
    refs.get(props.focus)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  onMounted(scrollToFocus)
  watch(() => [props.focus, props.day.date], scrollToFocus)
</script>

<style scoped>
  /* One grid track per hour: a 2-3 hour lesson spans 2-3 tracks, so its length shows. */
  .tt-day-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-auto-rows: minmax(60px, auto);
    gap: 8px;
  }

  .tt-day-row {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 12px;
    align-items: stretch;
    border-radius: 16px;
    transition: background-color 300ms cubic-bezier(0.05, 0.7, 0.1, 1);
  }
  .tt-day-row.is-focused {
    animation: tt-focus 1.6s cubic-bezier(0.2, 0, 0, 1);
  }
  @keyframes tt-focus {
    0%,
    40% {
      background: color-mix(in srgb, var(--on-surface-primary) 14%, transparent);
    }
    100% {
      background: transparent;
    }
  }

  .tt-day-time {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-top: 10px;
    font-variant-numeric: tabular-nums;
  }
  .tt-day-hour {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--on-surface-variant);
  }
  .tt-day-clock {
    font-size: 0.75rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .tt-day-row.is-now .tt-day-hour {
    color: var(--on-surface-primary);
  }
  .tt-day-row.is-now .tt-day-hour::after {
    content: ' · ora';
    font-weight: 500;
  }

  .tt-day-free {
    border-radius: 12px;
    /* plain: a dashed border means "Aggiunta" in the legend */
    background: color-mix(in srgb, var(--on-surface) 4%, transparent);
  }
  .tt-day-row.is-free .tt-day-time {
    padding-top: 6px;
  }

  .tt-day-hint,
  .tt-day-empty {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px;
    font-size: 0.875rem;
    color: var(--on-surface-variant);
  }
  .tt-day-hint .material-symbols-outlined {
    font-size: 18px;
  }

  .tt-day-notes {
    margin-top: 28px;
  }
  .tt-day-notes h3 {
    margin: 0 0 8px;
    font-size: 0.9375rem;
  }
  .tt-day-notes ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 0.875rem;
    line-height: 1.4;
  }
  .tt-day-notes-maybe {
    align-self: flex-start;
    padding: 1px 8px;
    border: 1px solid var(--on-surface-primary);
    border-radius: 999px;
    color: var(--on-surface-primary);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .tt-day-notes li {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  @media (max-width: 700px) {
    .tt-day-row {
      grid-template-columns: 52px minmax(0, 1fr);
      gap: 8px;
    }
    .tt-day-clock {
      white-space: normal;
      text-align: right;
    }
    .tt-day-clock-sep {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tt-day-row.is-focused {
      animation: none;
    }
  }
</style>
