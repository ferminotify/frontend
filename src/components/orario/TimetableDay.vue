<template>
  <div class="tt-day">
    <p v-if="!day.published" class="tt-day-hint">
      <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
      {{ day.date > window.to ? 'Le variazioni di questo giorno non sono ancora pubblicate: vedi l’orario normale.' : 'Variazioni non più disponibili per questo giorno.' }}
    </p>

    <p v-if="!day.cells.length" class="tt-day-empty">Nessuna lezione in questo giorno.</p>

    <ol v-else class="tt-day-list">
      <li
        v-for="cell in day.cells"
        :key="cell.start"
        :ref="(el) => setRef(cell.start, el)"
        class="tt-day-row"
        :class="{ 'is-focused': focus === cell.start, 'is-now': isNow(cell) }"
      >
        <div class="tt-day-time">
          <span class="tt-day-hour">{{ hourLabel(cell) }}</span>
          <span class="tt-day-clock">{{ cell.start }}<span class="tt-day-clock-sep"> – </span><wbr />{{ cellEnd(cell, times) }}</span>
        </div>
        <TimetableCell :cell="cell" :entity-type="entityType" />
      </li>
    </ol>

    <div v-if="day.notes.length" class="tt-day-notes">
      <h3>Altre variazioni del giorno</h3>
      <ul>
        <li v-for="n in day.notes" :key="n.uid">
          <span class="tt-day-clock">{{ n.start ? `${n.start} – ${n.end}` : 'Tutto il giorno' }}</span>
          {{ n.summary }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
  import { nextTick, onMounted, watch } from 'vue'
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

  const refs = new Map()
  const setRef = (start, el) => (el ? refs.set(start, el) : refs.delete(start))

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
  .tt-day-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
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
