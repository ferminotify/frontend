// Material "standard" easing: cubic-bezier(0.4, 0, 0.2, 1)
const X1 = 0.4, Y1 = 0, X2 = 0.2, Y2 = 1

const bezier = (t, a, b) => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t

function materialEase(x) {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    if (bezier(mid, X1, X2) < x) lo = mid
    else hi = mid
  }
  return bezier((lo + hi) / 2, Y1, Y2)
}

let rafId = null

export function animateScrollTo(targetY, duration = 700) {
  if (rafId) cancelAnimationFrame(rafId)
  const startY = window.scrollY
  const delta = targetY - startY
  if (Math.abs(delta) < 2) return

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, targetY)
    return
  }

  const start = performance.now()
  const cancel = () => {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
    cleanup()
  }
  const cleanup = () => {
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchstart', cancel)
    window.removeEventListener('keydown', cancel)
  }
  window.addEventListener('wheel', cancel, { passive: true })
  window.addEventListener('touchstart', cancel, { passive: true })
  window.addEventListener('keydown', cancel)

  const step = (now) => {
    const t = Math.min((now - start) / duration, 1)
    window.scrollTo(0, startY + delta * materialEase(t))
    if (t < 1) rafId = requestAnimationFrame(step)
    else {
      rafId = null
      cleanup()
    }
  }
  rafId = requestAnimationFrame(step)
}

// Scroll to element matching the URL hash; waits for async content to render.
export function scrollToHash(hash, { offset = 30, timeout = 10000 } = {}) {
  if (!hash || hash.length < 2) return
  let id = hash.slice(1)
  try {
    id = decodeURIComponent(id)
  } catch (e) {}

  const started = performance.now()
  const tryScroll = () => {
    const el = document.getElementById(id)
    // getClientRects is empty while an ancestor is display:none (boot loading screen)
    if (el && el.getClientRects().length > 0) {
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      animateScrollTo(Math.max(0, top))
    } else if (performance.now() - started < timeout) {
      setTimeout(tryScroll, 100)
    }
  }
  tryScroll()
}
