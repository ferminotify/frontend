<template>
  <Teleport to="body">
    <Transition name="cell-menu">
      <div
        v-if="anchor"
        ref="menuEl"
        class="cell-menu"
        role="menu"
        :aria-label="label"
        :style="position"
        @keydown="onKeydown"
      >
        <div v-if="info.length" class="cell-menu-info">
          <div v-for="(group, g) in info" :key="g" class="cell-menu-info-group">
            <p v-if="group.title" class="cell-menu-info-title">{{ group.title }}</p>
            <p v-for="(it, i) in group.items" :key="i" class="cell-menu-info-item" :class="`is-${it.tone}`">
              <span class="material-symbols-outlined" aria-hidden="true">{{ it.icon }}</span>
              {{ it.text }}
            </p>
          </div>
        </div>
        <button
          v-for="item in items"
          :key="item.label"
          type="button"
          role="menuitem"
          class="cell-menu-item"
          @click="choose(item)"
        >
          <span class="material-symbols-outlined" aria-hidden="true">{{ item.icon }}</span>
          {{ item.label }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
  import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

  // Small popup menu next to a timetable cell. `anchor` is the clicked element (null: closed).
  const props = defineProps({
    anchor: { type: Object, default: null },
    items: { type: Array, required: true }, // [{ label, icon, action }]
    label: { type: String, default: 'Azioni' },
    info: { type: Array, default: () => [] }, // [{ title, items: [{ icon, text, tone }] }], see readingInfo()
  })
  const emit = defineEmits(['close'])

  const menuEl = ref(null)
  const position = ref({})
  const GAP = 6
  const MARGIN = 8

  function place() {
    const el = menuEl.value
    if (!props.anchor || !el) return
    const r = props.anchor.getBoundingClientRect()
    const w = el.offsetWidth
    const h = el.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight
    // Below the cell, or above when it does not fit; aligned to the cell's left edge.
    const top = r.bottom + GAP + h <= vh - MARGIN ? r.bottom + GAP : Math.max(MARGIN, r.top - GAP - h)
    const left = Math.min(Math.max(MARGIN, r.left), vw - w - MARGIN)
    position.value = { top: `${top}px`, left: `${left}px` }
  }

  function close() {
    emit('close')
  }
  function choose(item) {
    close()
    item.action()
  }

  function onPointerDown(e) {
    if (menuEl.value?.contains(e.target) || props.anchor?.contains(e.target)) return
    close()
  }
  function onKeydown(e) {
    const buttons = [...(menuEl.value?.querySelectorAll('button') || [])]
    const i = buttons.indexOf(document.activeElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      props.anchor?.focus?.()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = (i + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
      buttons[next]?.focus()
    } else if (e.key === 'Tab') {
      close()
    }
  }

  const listen = (on) => {
    const fn = on ? 'addEventListener' : 'removeEventListener'
    document[fn]('pointerdown', onPointerDown, true)
    window[fn]('scroll', close, true)
    window[fn]('resize', close)
  }

  watch(
    () => props.anchor,
    async (anchor, old) => {
      if (old && !anchor) listen(false)
      if (!anchor) return
      if (!old) listen(true)
      position.value = { visibility: 'hidden' }
      await nextTick()
      place()
      menuEl.value?.querySelector('button')?.focus({ preventScroll: true })
    }
  )
  onBeforeUnmount(() => props.anchor && listen(false))
</script>

<style scoped>
  .cell-menu {
    position: fixed;
    z-index: 1000;
    min-width: 200px;
    padding: 6px;
    border-radius: 14px;
    border: 1px solid var(--divider);
    background: var(--surface);
    color: var(--on-surface);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
  }
  .cell-menu-info {
    max-width: 300px;
    padding: 6px 10px 8px;
    margin-bottom: 4px;
    border-bottom: 1px solid var(--divider);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .cell-menu-info-group {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .cell-menu-info-title {
    margin: 0 0 2px;
    font-size: 0.6875rem;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cell-menu-info-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.35;
    color: var(--on-surface-variant);
    overflow-wrap: anywhere;
  }
  .cell-menu-info-item .material-symbols-outlined {
    font-size: 15px;
    margin-top: 1px;
  }
  .cell-menu-info-item.is-good .material-symbols-outlined {
    color: #66bb6a;
  }
  .cell-menu-info-item.is-warn .material-symbols-outlined {
    color: #f9a825;
  }
  .cell-menu-info-item.is-bad .material-symbols-outlined {
    color: #ef5350;
  }
  .cell-menu-info-item.is-muted {
    color: var(--muted);
  }
  .cell-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: inherit;
    font: inherit;
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
  }
  .cell-menu-item .material-symbols-outlined {
    font-size: 20px;
    color: var(--on-surface-variant);
  }
  .cell-menu-item:hover,
  .cell-menu-item:focus-visible {
    background: var(--surface-variant);
    outline: none;
  }

  .cell-menu-enter-active,
  .cell-menu-leave-active {
    transition:
      opacity 120ms ease,
      transform 120ms ease;
  }
  .cell-menu-enter-from,
  .cell-menu-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
  @media (prefers-reduced-motion: reduce) {
    .cell-menu-enter-active,
    .cell-menu-leave-active {
      transition: none;
    }
  }
</style>
