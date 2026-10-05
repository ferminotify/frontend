import { ref } from 'vue'
const STORAGE_KEY = 'feedback_prompt'
const SNOOZE_DAYS = 14

const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved) return saved
  } catch (e) {}
  return {}
}

const write = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {}
}

const shouldShow = (state) => !state.done && !(state.snoozedUntil > Date.now())

const visible = ref(false)
const done = ref(false)
let resolved = false

export function useFeedbackPrompt() {
  const init = () => {
    if (resolved) return
    resolved = true
    const state = read()
    visible.value = shouldShow(state)
    done.value = !!state.done
  }

  const snooze = () => {
    write({ ...read(), snoozedUntil: Date.now() + SNOOZE_DAYS * 864e5 })
    visible.value = false
  }

  const isDesktopCollapsed = () => read().desktopCollapsed === true
  const setDesktopCollapsed = (collapsed) => {
    if (isDesktopCollapsed() !== collapsed) write({ ...read(), desktopCollapsed: collapsed })
  }

  return { visible, done, init, snooze, isDesktopCollapsed, setDesktopCollapsed }
}

export function markFeedbackDone() {
  write({ ...read(), done: true })
  visible.value = false
  done.value = true
}
