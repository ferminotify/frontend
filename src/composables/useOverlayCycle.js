import { ref } from 'vue'

/**
 * Variations drawn over the lessons (real times): each tap moves one step,
 * one line → full card → the lesson menu → one line again.
 * `stage` holds the open ones: key → 'open' | 'menu' (absent = one line).
 */
export function useOverlayCycle() {
  const stage = ref(new Map())

  /**
   * @param {string} key  the overlay (day + event)
   * @param {() => void} openMenu  opens (or, called again on the same cell, closes) its menu
   * @param {HTMLElement} [el]  the tapped cell
   */
  function cycle(key, openMenu, el) {
    const now = stage.value.get(key)
    const next = new Map(stage.value)
    if (!now) next.set(key, 'open')
    else if (now === 'open') {
      next.set(key, 'menu')
      openMenu()
    } else {
      next.delete(key)
      if (el?.classList.contains('is-menu-open')) openMenu() // same cell again: the page closes it
    }
    stage.value = next
  }

  return { stage, cycle }
}
