<template>
  <component
    :is="interactive ? 'button' : 'div'"
    :type="interactive ? 'button' : undefined"
    :aria-haspopup="interactive && !brief ? 'menu' : undefined"
    class="tt-cell"
    :class="[`tt-cell--${view.tone}`, { 'tt-cell--compact': compact, 'tt-cell--plain': view.plain, 'tt-cell--brief': brief, 'tt-cell--overlay': cell.overlay }]"
    :style="cell.color && !view.plain ? { '--subject': cell.color } : null"
    :title="brief ? cell.variations.map((v) => v.summary).join('\n') : undefined"
    @click="interactive && $emit('select', cell, $event.currentTarget)"
  >
    <!-- Brief (over the lessons): one line, the times and what changes; the rest on tap -->
    <span v-if="brief" class="tt-cell-brief">
      <span class="material-symbols-outlined" aria-hidden="true">{{ badgeIcon }}</span>
      <strong>{{ cell.start }}–{{ cell.end }}</strong>
      <span class="tt-cell-brief-text">{{ briefText }}</span>
    </span>
    <template v-else>
    <span v-if="view.badge" class="tt-cell-badge">
      <span class="material-symbols-outlined" aria-hidden="true">{{ badgeIcon }}</span>
      {{ view.badge }}
    </span>
    <span class="tt-cell-title" :class="{ 'tt-cell-title--struck': view.titleStruck }">
      <span v-if="view.titleStruck" class="sr-only">Al posto di </span>{{ view.title }}
    </span>
    <span v-for="line in view.lines" :key="`${line.text}|${line.was}`" class="tt-cell-line">
      <template v-if="line.wasFirst && line.was">
        <s class="tt-cell-was tt-cell-was--first">{{ line.was }}</s><span v-if="line.list">,</span><span v-if="line.text" class="sr-only"> sostituito da</span> {{ line.text }}
      </template>
      <template v-else>
        {{ line.text }}<span v-if="line.list">,</span>
        <s v-if="line.was" class="tt-cell-was"><span class="sr-only">{{ line.list ? 'assente: ' : 'invece di ' }}</span>{{ line.was }}</s>
      </template>
    </span>
    <span v-if="view.original" class="tt-cell-original">{{ view.original }}</span>
    <template v-if="!compact && cell.variations.length">
      <span v-for="v in cell.variations" :key="v.uid" class="tt-cell-raw" :title="v.summary">{{ v.summary }}</span>
      <span v-if="readingNote" class="tt-cell-reading">
        <span class="material-symbols-outlined" aria-hidden="true">{{ readingNote.icon }}</span>
        {{ readingNote.text }}
      </span>
    </template>
    </template>
  </component>
</template>

<script setup>
  import { computed } from 'vue'
  import { describeCell } from '@/utils/timetable'

  const props = defineProps({
    cell: { type: Object, required: true },
    entityType: { type: String, required: true }, // 'class' | 'room'
    compact: { type: Boolean, default: false },
    interactive: { type: Boolean, default: false },
    brief: { type: Boolean, default: false }, // one line: times + what changes (overlays)
  })
  defineEmits(['select'])

  const view = computed(() => describeCell(props.cell, props.entityType))
  // The event title was hard to read (see backend confidence.js).
  const readingNote = computed(() => {
    const vs = props.cell.variations || []
    if (vs.some((v) => v.confidence != null && v.confidence < 60)) return { icon: 'help', text: 'Lettura incerta: controlla il testo originale' }
    return null
  })
  // What changes, in a few words: the first line that is not the times (e.g. "Aula 605").
  const briefText = computed(() => {
    const line = view.value.lines.find((l) => !l.text.startsWith('Dalle '))
    return line?.text || view.value.badge || view.value.title
  })
  const badgeIcon = computed(
    () =>
      ({ Supplenza: 'person', Anticipata: 'schedule' })[view.value.badge] ||
      ({ changed: 'swap_horiz', cancelled: 'event_busy', freed: 'meeting_room', added: 'add_circle', maybe: 'help' })[view.value.tone]
  )
</script>

<style scoped>
  .tt-cell--brief {
    padding: 6px 10px;
    justify-content: center;
  }
  .tt-cell-brief {
    display: flex;
    flex-wrap: wrap; /* narrow week columns: what changes goes on a second line */
    align-items: center;
    gap: 2px 6px;
    min-width: 0;
    font-size: 0.8125rem;
    white-space: nowrap;
  }
  .tt-cell-brief .material-symbols-outlined {
    font-size: 16px;
    color: var(--on-surface-primary);
  }
  .tt-cell-brief strong {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .tt-cell-brief-text {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tt-cell {
    --subject: var(--on-surface-variant);
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    height: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid transparent;
    background: color-mix(in srgb, var(--subject) 16%, var(--surface-variant));
    color: var(--on-surface);
    text-align: left;
    font: inherit;
    line-height: 1.3;
    position: relative;
    overflow: hidden;
    transition:
      background-color 150ms var(--m3-emph-decel),
      transform 150ms var(--m3-emph-decel);
  }


  button.tt-cell {
    cursor: pointer;
  }
  button.tt-cell:hover {
    background: color-mix(in srgb, var(--subject) 24%, var(--surface-variant));
  }
  button.tt-cell:active {
    transform: scale(0.98);
  }
  /* No blue flash on tap (mobile browsers) */
  button.tt-cell {
    -webkit-tap-highlight-color: transparent;
  }
  /* Its menu is open (see CellMenu) */
  button.tt-cell.is-menu-open {
    outline: 2px solid var(--on-surface-primary);
    outline-offset: 2px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
    transform: scale(1.02);
    z-index: 2;
  }
  /* Over the lessons (cycle of taps): no ring when its menu opens, the card itself is enough */
  button.tt-cell.tt-cell--overlay.is-menu-open {
    outline: none;
    transform: none;
  }
  button.tt-cell:focus-visible {
    outline: 2px solid var(--on-surface-primary);
    outline-offset: 2px;
  }

  /* Subject colour from the school timetable, as a dot before the title */
  .tt-cell-title::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 6px;
    border-radius: 50%;
    background: var(--subject);
    vertical-align: 0.05em;
  }
  .tt-cell-title {
    font-weight: 600;
    font-size: 0.875rem;
    overflow-wrap: anywhere;
  }
  .tt-cell-line {
    font-size: 0.8125rem;
    color: var(--on-surface-variant);
    overflow-wrap: anywhere;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .tt-cell-was {
    margin-left: 4px;
    font-size: 0.75rem;
    color: var(--muted);
  }
  .tt-cell-was--first {
    margin-left: 0; /* struck first (~~Bianchi~~ Verdi, the replaced subject): no indent */
  }
  .tt-cell-original {
    font-size: 0.75rem;
    color: var(--muted);
    text-decoration: line-through;
    overflow-wrap: anywhere;
  }
  .tt-cell-raw {
    margin-top: 6px;
    font-size: 0.75rem;
    color: var(--muted);
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tt-cell-reading {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-size: 0.75rem;
    color: var(--error); /* red: worth a look */
  }
  .tt-cell-reading .material-symbols-outlined {
    font-size: 14px;
  }

  .tt-cell-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    align-self: flex-start;
    margin-bottom: 4px;
    padding: 2px 8px 2px 6px;
    border-radius: 999px;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .tt-cell-badge .material-symbols-outlined {
    font-size: 14px;
  }
  /* Narrow week columns (phones): smaller badge, never wider than the card */
  @media (max-width: 700px) {
    .tt-cell--compact .tt-cell-badge {
      max-width: 100%;
      box-sizing: border-box;
      gap: 3px;
      padding: 2px 6px 2px 4px;
      font-size: 0.625rem;
      letter-spacing: 0;
      line-height: 1.2;
    }
    .tt-cell--compact .tt-cell-badge .material-symbols-outlined {
      font-size: 12px;
    }
  }

  /* Compact (week grid): fewer lines, clamp long subjects */
  .tt-cell--compact {
    padding: 8px 10px;
  }
  .tt-cell--compact .tt-cell-title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 0.8125rem;
  }
  .tt-cell--compact .tt-cell-line {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* States */
  .tt-cell--changed {
    border-color: var(--on-surface-primary);
    background: color-mix(in srgb, var(--on-surface-primary) 12%, var(--surface-variant));
  }
  .tt-cell--changed .tt-cell-badge {
    background: var(--primary);
    color: var(--on-primary);
  }
  .tt-cell--changed .tt-cell-line {
    color: var(--on-surface);
  }

  .tt-cell--added {
    border: 1px dashed var(--on-surface-primary);
    background: color-mix(in srgb, var(--on-surface-primary) 8%, var(--surface));
  }
  .tt-cell--added .tt-cell-title::before,
  .tt-cell--plain .tt-cell-title::before {
    display: none;
  }
  .tt-cell--added .tt-cell-badge {
    background: color-mix(in srgb, var(--on-surface-primary) 18%, transparent);
    color: var(--on-surface-primary);
  }

  /* Possible variation: the lesson as it is, with a dotted amber border and badge */
  .tt-cell--maybe {
    border: 1px dashed var(--warning-soft);
  }
  .tt-cell--maybe .tt-cell-badge {
    background: color-mix(in srgb, var(--warning-soft) 18%, transparent);
    color: var(--warning-soft);
  }

  .tt-cell--cancelled,
  .tt-cell--freed {
    background: repeating-linear-gradient(
      -45deg,
      color-mix(in srgb, var(--on-surface) 4%, var(--surface)),
      color-mix(in srgb, var(--on-surface) 4%, var(--surface)) 6px,
      var(--surface) 6px,
      var(--surface) 12px
    );
    border-color: color-mix(in srgb, var(--on-surface) 14%, transparent);
  }
  .tt-cell--cancelled .tt-cell-title::before,
  .tt-cell--freed .tt-cell-title::before {
    opacity: 0.35;
  }
  .tt-cell--cancelled .tt-cell-title,
  .tt-cell-title--struck {
    text-decoration: line-through;
    color: var(--on-surface-variant);
  }
  .tt-cell--freed .tt-cell-title {
    color: var(--muted);
    text-decoration: line-through;
  }
  .tt-cell--cancelled .tt-cell-badge {
    background: color-mix(in srgb, var(--error-soft) 18%, transparent);
    color: var(--error-soft);
  }
  .tt-cell--freed .tt-cell-badge {
    background: color-mix(in srgb, var(--success-soft) 18%, transparent);
    color: var(--success-soft);
  }

  @media (prefers-reduced-motion: reduce) {
    .tt-cell {
      transition: none;
    }
  }
</style>
