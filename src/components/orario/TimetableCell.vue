<template>
  <component
    :is="interactive ? 'button' : 'div'"
    :type="interactive ? 'button' : undefined"
    class="tt-cell"
    :class="[`tt-cell--${view.tone}`, { 'tt-cell--compact': compact, 'tt-cell--plain': view.plain }]"
    :style="cell.color && !view.plain ? { '--subject': cell.color } : null"
    @click="interactive && $emit('select', cell)"
  >
    <span v-if="view.badge" class="tt-cell-badge">
      <span class="material-symbols-outlined" aria-hidden="true">{{ badgeIcon }}</span>
      {{ view.badge }}
    </span>
    <span class="tt-cell-title">{{ view.title }}</span>
    <span v-for="line in view.lines" :key="line" class="tt-cell-line">{{ line }}</span>
    <span v-if="view.original" class="tt-cell-original">{{ view.original }}</span>
    <template v-if="!compact && cell.variations.length">
      <span v-for="v in cell.variations" :key="v.uid" class="tt-cell-raw" :title="v.summary">{{ v.summary }}</span>
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
  })
  defineEmits(['select'])

  const view = computed(() => describeCell(props.cell, props.entityType))
  const badgeIcon = computed(
    () => ({ changed: 'swap_horiz', cancelled: 'event_busy', freed: 'meeting_room', added: 'add_circle' })[view.value.tone]
  )
</script>

<style scoped>
  .tt-cell {
    --subject: var(--on-surface-variant);
    --m3-emph-decel: cubic-bezier(0.05, 0.7, 0.1, 1);
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
  .tt-cell--freed .tt-cell-title {
    color: var(--muted);
    text-decoration: line-through;
  }
  .tt-cell--cancelled .tt-cell-badge {
    background: color-mix(in srgb, #f2b8b5 18%, transparent);
    color: #f2b8b5;
  }
  .tt-cell--freed .tt-cell-badge {
    background: color-mix(in srgb, #a8dab5 18%, transparent);
    color: #a8dab5;
  }

  @media (prefers-reduced-motion: reduce) {
    .tt-cell {
      transition: none;
    }
  }
</style>
