import { onBeforeUnmount, watch } from 'vue'

const LOCK_PX = 10 // movement before deciding horizontal swipe vs vertical scroll
const TRIGGER_PX = 60 // horizontal distance that triggers
const FLICK_SPEED = 0.4 // px/ms: a fast short flick also triggers
const DRAG_FACTOR = 0.35 // the content follows the finger, damped

/** Whether a scrollable ancestor (up to `root`) can still scroll toward the swipe: let it scroll. */
function scrollsHorizontally(target, root, dx) {
  for (let el = target; el && el !== root.parentElement; el = el.parentElement) {
    if (el.scrollWidth <= el.clientWidth + 1) continue
    const overflow = getComputedStyle(el).overflowX
    if (overflow !== 'auto' && overflow !== 'scroll') continue
    // finger to the left (dx < 0) reveals content on the right
    if (dx < 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1) return true
    if (dx > 0 && el.scrollLeft > 0) return true
  }
  return false
}

/**
 * Horizontal swipe on touch screens. `onSwipe('left' | 'right')` fires when the finger
 * moves left/right enough. Vertical scrolling, form fields and horizontally scrollable
 * children (e.g. the week grid on phones) keep working.
 * @param {import('vue').Ref<HTMLElement|null>} elRef
 * @param {(dir: 'left'|'right') => void} onSwipe
 * @param {{ enabled?: () => boolean }} [opts]
 */
export function useSwipe(elRef, onSwipe, { enabled = () => true } = {}) {
  let start = null // { x, y, t }
  let mode = null // null (undecided) | 'swipe' | 'ignore'
  let dx = 0

  const setDrag = (el, x) => {
    el.style.transition = x ? 'none' : 'transform 200ms cubic-bezier(0.2, 0, 0, 1)'
    el.style.transform = x ? `translateX(${x}px)` : ''
  }

  function onStart(e) {
    if (e.touches.length !== 1 || !enabled() || e.target.closest('input, textarea, select, [contenteditable]')) {
      start = null
      return
    }
    start = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: e.timeStamp }
    mode = null
    dx = 0
  }

  function onMove(e) {
    if (!start || mode === 'ignore') return
    dx = e.touches[0].clientX - start.x
    const dy = e.touches[0].clientY - start.y
    if (!mode) {
      if (Math.abs(dx) < LOCK_PX && Math.abs(dy) < LOCK_PX) return
      mode = Math.abs(dx) > Math.abs(dy) * 1.5 && !scrollsHorizontally(e.target, elRef.value, dx) ? 'swipe' : 'ignore'
      if (mode === 'ignore') return
    }
    e.preventDefault() // no vertical scroll while swiping sideways
    setDrag(elRef.value, dx * DRAG_FACTOR)
  }

  function onEnd(e) {
    if (!start) return
    const el = elRef.value
    const wasSwipe = mode === 'swipe'
    const speed = Math.abs(dx) / Math.max(1, e.timeStamp - start.t)
    start = null
    mode = null
    if (!wasSwipe) return
    setDrag(el, 0)
    if (Math.abs(dx) >= TRIGGER_PX || (Math.abs(dx) >= LOCK_PX * 3 && speed >= FLICK_SPEED)) {
      onSwipe(dx < 0 ? 'left' : 'right')
    }
  }

  function onCancel() {
    if (start && mode === 'swipe' && elRef.value) setDrag(elRef.value, 0)
    start = null
    mode = null
  }

  const bind = (el) => {
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onCancel)
  }
  const unbind = (el) => {
    el.removeEventListener('touchstart', onStart)
    el.removeEventListener('touchmove', onMove)
    el.removeEventListener('touchend', onEnd)
    el.removeEventListener('touchcancel', onCancel)
  }

  watch(
    elRef,
    (el, old) => {
      if (old) unbind(old)
      if (el) bind(el)
    },
    { immediate: true }
  )
  onBeforeUnmount(() => elRef.value && unbind(elRef.value))
}
