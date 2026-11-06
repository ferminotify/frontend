<template>
  <div class="tt-day">
    <p v-if="!day.published" class="tt-day-hint">
      <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
      {{ day.date > window.to ? 'Le variazioni di questo giorno non sono ancora pubblicate: vedi l’orario normale.' : 'Variazioni non più disponibili per questo giorno.' }}
    </p>

    <p v-if="!day.cells.length && !(day.overlays || []).length" class="tt-day-empty">Nessuna lezione in questo giorno.</p>

    <ol v-else class="tt-day-list">
      <li
        v-for="row in rows"
        :key="row.start"
        :ref="(el) => setRef(row.start, el)"
        class="tt-day-row"
        :class="{ 'is-focused': focus === row.start, 'is-now': isNow(row), 'is-free': !row.cell }"
        :style="{ gridRow: `${row.track} / span ${row.span}` }"
      >
        <div class="tt-day-time">
          <span class="tt-day-hour">{{ hourLabel(row) }}</span>
          <span class="tt-day-clock">{{ row.start }}<span class="tt-day-clock-sep"> – </span><wbr />{{ cellEnd(row.cell || row, times, extraTimes) }}</span>
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
      <!-- Variations with real times (10:30–11:30): on top of the lessons, at those times -->
      <li
        v-for="o in overlays"
        :key="`o-${o.cell.variations[0].uid}`"
        class="tt-overlay tt-day-overlay"
        :style="{ gridRow: o.area, gridTemplateRows: `minmax(36px, ${o.box.top}fr) auto ${o.box.bottom}fr` }"
      >
        <div class="tt-overlay-card tt-day-overlay-card">
          <!-- Taps cycle: one line → full card → lesson menu → one line again -->
          <TimetableCell
            :brief="!stage.has(o.key)"
            :aria-expanded="stage.has(o.key)"
            :cell="o.cell"
            :entity-type="entityType"
            interactive
            @select="(c, el) => cycle(o.key, () => $emit('cell-menu', { day, cell: c, el }), el)"
          />
        </div>
      </li>
    </ol>

    <div v-if="day.notes.length" class="tt-day-notes">
      <h3>Altre variazioni del giorno</h3>
      <ul>
        <li v-for="n in day.notes" :key="n.uid" :class="{ 'is-maybe': n.maybe }">
          <span class="tt-day-clock">{{ n.start ? `${n.start} – ${n.end}` : 'Tutto il giorno' }}</span>
          <span v-if="n.maybe" class="tt-notes-maybe">Variazione</span>
          {{ n.summary }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
  import { computed, nextTick, onMounted, watch } from 'vue'
  import { useOverlayCycle } from '@/composables/useOverlayCycle'
  import './orario.css'
  import TimetableCell from './TimetableCell.vue'
  import { cellEnd, hourNumber, overlayBox } from '@/utils/timetable'

  const props = defineProps({
    day: { type: Object, required: true },
    times: { type: Array, required: true },
    extraTimes: { type: Array, default: () => [] },
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
    let track = 1 // grid row of each list row: explicit, so overlays can sit on top
    for (let i = 0; i < props.times.length; i++) {
      const cell = byStart.get(props.times[i])
      if (cell) {
        out.push({ start: cell.start, slots: cell.slots, span: cell.span, cell, track })
        track += cell.span
        i += cell.span - 1
      } else if (!props.extraTimes.includes(props.times[i])) {
        // Extra rows (an event out of the lessons, on some day of the week): only where used.
        out.push({ start: props.times[i], slots: [props.times[i]], span: 1, cell: null, track })
        track += 1
      }
    }
    return out
  })

  // Overlays opened to the full card.
  const { stage, cycle } = useOverlayCycle()

  // Overlays over the list rows of their slots (see overlayBox for the inset).
  const overlays = computed(() => {
    const trackOf = new Map()
    for (const r of rows.value) r.slots.forEach((s, k) => trackOf.set(s, r.track + Math.min(k, r.span - 1)))
    return (props.day.overlays || [])
      .map((o) => {
        const box = overlayBox(o, props.times, props.extraTimes)
        const a = trackOf.get(box.from)
        const b = trackOf.get(box.to)
        return a && b ? { cell: o, box, area: `${a} / ${b + 1}`, key: o.variations[0].uid } : null
      })
      .filter(Boolean)
  })

  const hourLabel = (cell) => {
    const first = hourNumber(cell.start)
    if (!first) return ''
    return cell.span > 1 ? `${first}ª–${first + cell.span - 1}ª` : `${first}ª`
  }

  const isNow = (cell) =>
    props.day.date === props.today && props.nowTime >= cell.start && props.nowTime < cellEnd(cell.cell || cell, props.times, props.extraTimes)

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

  /* .tt-overlay / .tt-overlay-card in orario.css; here: over the lesson column only */
  .tt-day-overlay {
    grid-column: 1;
    margin-left: 102px; /* time column + gap + a little: the lesson below stays visible */
    list-style: none;
  }
  .tt-day-overlay-card {
    flex-direction: column;
    border-radius: 16px;
    box-shadow: 0 6px 18px rgb(0 0 0 / 0.5);
  }

  .tt-day-row {
    grid-column: 1;
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
    .tt-day-overlay {
      margin-left: 74px;
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
