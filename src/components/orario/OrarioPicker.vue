<template>
  <div class="op">
    <div class="op-bar">
      <label class="op-field">
        <span class="material-symbols-outlined op-lead" aria-hidden="true">search</span>
        <input
          ref="input"
          v-model="query"
          type="search"
          class="op-input"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          :aria-label="index?.teachers?.length ? 'Cerca classe, aula o docente' : 'Cerca classe o aula'"
          :aria-controls="panelId"
          :placeholder="index ? (index.teachers?.length ? 'Cerca classe, aula o docente' : 'Cerca classe o aula') : 'Caricamento…'"
          :disabled="!index"
          @input="open = true"
          @keydown="onKeydown"
        />
        <button v-if="query" type="button" class="op-icon-btn" aria-label="Cancella ricerca" @click="clearQuery">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </label>

      <button
        v-if="!locked"
        type="button"
        class="op-toggle"
        :class="{ open }"
        :aria-expanded="open"
        :aria-controls="panelId"
        :disabled="!index"
        @click="open = !open"
      >
        <template v-if="selectedLabel">
          <span class="material-symbols-outlined" aria-hidden="true">{{ TYPE_ICON[type] }}</span>
          <span class="op-toggle-name">{{ selectedLabel }}</span>
        </template>
        <span v-else class="op-toggle-name">Elenco</span>
        <span class="material-symbols-outlined op-chevron" aria-hidden="true">expand_more</span>
        <span class="sr-only">{{ open ? 'Nascondi elenco' : 'Mostra elenco' }}</span>
      </button>
    </div>

    <Transition name="op-panel">
      <div v-if="(open || locked) && index" :id="panelId" class="op-panel">
        <Transition name="op-notice" mode="out-in">
        <button
          v-if="index.teachers === null && noticeHidden"
          type="button"
          class="btn text op-notice-opener"
          @click="reopenNotice"
        >
          <span class="material-symbols-outlined material-space-right" aria-hidden="true">school</span>
          <span>Orario dei docenti</span>
        </button>
        <div v-else-if="index.teachers === null" class="op-notice" role="note">
          <button type="button" class="op-notice-close" aria-label="Nascondi" @click="hideNotice">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
          <span class="material-symbols-outlined op-notice-icon" aria-hidden="true">school</span>
          <div class="op-notice-text">
            <strong>Orario dei docenti</strong>
            <span>Accedi con un account <b>@fermimn.edu.it</b> per cercare i docenti.</span>
          </div>
          <div v-if="!loginOpen" class="op-notice-actions">
            <RouterLink v-if="!loggedIn" to="/login" class="op-notice-btn op-notice-btn--outlined">Accedi</RouterLink>
            <button type="button" class="op-notice-btn" @click="openLogin">Accedi con Moodle</button>
          </div>

          <form v-else class="op-login" @submit.prevent="submitLogin">
            <label class="op-login-field">
              <span>Nome utente Moodle</span>
              <input
                ref="userInput"
                v-model="loginUser"
                name="username"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                required
                maxlength="150"
              />
            </label>
            <label class="op-login-field">
              <span>Password</span>
              <input v-model="loginPass" type="password" name="password" autocomplete="current-password" required maxlength="256" />
            </label>
            <p v-if="loginError" class="op-login-error" role="alert">{{ loginError }}</p>
            <p class="op-login-note">
              <span class="material-symbols-outlined" aria-hidden="true">lock</span>
              Le credenziali servono solo ad accedere a fermimn.edu.it e non vengono salvate.
            </p>
            <div class="op-login-actions">
              <button type="button" class="op-login-cancel" :disabled="loginBusy" @click="loginOpen = false">Annulla</button>
              <button type="submit" class="op-notice-btn" :disabled="loginBusy">
                {{ loginBusy ? 'Accesso…' : 'Accedi' }}
              </button>
            </div>
          </form>
        </div>
        </Transition>
        <p v-if="q && !best" class="op-empty">
          Nessuna classe o aula per “{{ query.trim() }}”.
          <template v-if="index.teachers === null">
            <br />Cerchi un docente?
            <button type="button" class="op-link-btn" @click="showLogin">Accedi con Moodle</button>
            per vederli.
          </template>
        </p>
        <div v-else class="op-columns" :style="{ '--cols': columns.length }">
          <section v-for="col in columns" :key="col.type" class="op-col" :aria-label="col.label">
            <h3 class="op-col-title">
              <span class="material-symbols-outlined" aria-hidden="true">{{ col.icon }}</span>
              {{ col.label }}
              <span class="op-count">{{ col.count }}</span>
            </h3>
            <div v-for="g in col.groups" :key="g.label" class="op-group">
              <p v-if="g.label" class="op-group-label">{{ g.label }}</p>
              <div class="op-chips">
                <button
                  v-for="e in g.items"
                  :key="e.key"
                  type="button"
                  class="chip op-chip"
                  :class="{ selected: isSelected(col.type, e.key), best: isBest(col.type, e.key) }"
                  :aria-pressed="isSelected(col.type, e.key)"
                  @click="choose(col.type, e)"
                >
                  {{ e.name }}
                </button>
              </div>
            </div>
          </section>
        </div>
        <p v-if="index.schoolSession" class="op-hint op-hint--teachers">
          <span class="material-symbols-outlined" aria-hidden="true">verified_user</span>
          Docenti visibili tramite Moodle.
          <button type="button" class="op-link-btn" @click="logoutMoodle">Esci</button>
        </p>
        <p v-if="index.teachers?.length === 0" class="op-hint op-hint--teachers">
          <span class="material-symbols-outlined" aria-hidden="true">cloud_off</span>
          Orario dei docenti non disponibile in questo momento.
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup>
  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { groupEntities } from '@/utils/timetable'
  import { schoolLogin, schoolLogout } from '@/api/timetable'
  import { useUserStore } from '@/stores/user'

  const props = defineProps({
    /** { classes, rooms, teachers: [{key,name}] | null } or null while loading; teachers null = not allowed */
    index: { type: Object, default: null },
    /** type of the selected entity: 'classe' | 'aula' | 'docente' */
    type: { type: String, default: 'classe' },
    /** selected key (upper case), '' if none */
    selected: { type: String, default: '' },
    /** fallback label for the selected entity before the index loads */
    selectedName: { type: String, default: '' },
  })
  const emit = defineEmits(['select'])

  const TYPE_ICON = { classe: 'groups', aula: 'meeting_room', docente: 'school' }
  const listOf = (type) => ({ classe: props.index?.classes, aula: props.index?.rooms, docente: props.index?.teachers })[type] || []

  const panelId = `op-${Math.random().toString(36).slice(2, 8)}`
  const input = ref(null)
  const query = ref('')
  // Nothing selected (first visit): the list is the page, always open and not closable.
  // After a pick it closes; reopens on demand or when typing.
  const locked = computed(() => !props.selected)
  const open = ref(!props.selected)

  watch(
    () => props.selected,
    (key, prev) => {
      if (!key) open.value = true
      else if (!prev) open.value = false // e.g. /orario restored the last class
    }
  )

  const selectedLabel = computed(() => {
    return listOf(props.type).find((e) => e.key === props.selected)?.name || props.selectedName || ''
  })

  const userStore = useUserStore()
  const loggedIn = computed(() => Boolean(userStore.token))

  // --- "Accedi con Moodle" (the view reloads when the ticket changes) ---
  const loginOpen = ref(false)
  const loginUser = ref('')
  const loginPass = ref('')
  const loginBusy = ref(false)
  const loginError = ref('')
  const userInput = ref(null)

  // The teachers notice can be hidden; remembered per browser.
  const NOTICE_KEY = 'orarioTeacherNoticeHidden'
  const noticeHidden = ref(false)
  onMounted(() => {
    try {
      noticeHidden.value = localStorage.getItem(NOTICE_KEY) === '1'
    } catch {
      // storage unavailable: show it
    }
  })
  function hideNotice() {
    noticeHidden.value = true
    loginOpen.value = false
    try {
      localStorage.setItem(NOTICE_KEY, '1')
    } catch {
      // hidden for this visit only
    }
  }

  function reopenNotice() {
    noticeHidden.value = false
    try {
      localStorage.removeItem(NOTICE_KEY)
    } catch {
      // ignore
    }
  }

  /** From the "no results" hint: bring the notice back with the form open. */
  function showLogin() {
    query.value = ''
    reopenNotice()
    openLogin()
  }

  function openLogin() {
    loginOpen.value = true
    loginError.value = ''
    nextTick(() => userInput.value?.focus())
  }

  async function submitLogin() {
    loginBusy.value = true
    loginError.value = ''
    try {
      await schoolLogin(loginUser.value.trim(), loginPass.value)
      loginOpen.value = false
      loginUser.value = ''
    } catch (err) {
      loginError.value = err.message
    } finally {
      loginPass.value = ''
      loginBusy.value = false
    }
  }

  const logoutMoodle = () => schoolLogout()

  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
  const q = computed(() => norm(query.value))

  /** Lower is better; -1 = no match. */
  function score(name, needle) {
    const n = norm(name)
    if (n === needle) return 0
    if (n.startsWith(needle)) return 1
    // start of any word: "94" → "Aula 94", "inf" → "Lab Inf 2"
    if (name.toLowerCase().split(/[\s.\-_/]+/).some((w) => norm(w).startsWith(needle))) return 2
    if (n.includes(needle)) return 3
    return -1
  }

  const byName = (a, b) => a.name.localeCompare(b.name, 'it', { numeric: true })

  function column(type, list, label, icon) {
    if (!q.value) {
      const groups = groupEntities([...list].sort(byName), type)
      return { type, label, icon, count: list.length, groups }
    }
    const items = list
      .map((e) => ({ ...e, s: score(e.name, q.value) }))
      .filter((e) => e.s >= 0)
      .sort((a, b) => a.s - b.s || byName(a, b))
    return { type, label, icon, count: items.length, groups: items.length ? [{ label: '', items }] : [] }
  }

  const columns = computed(() => {
    if (!props.index) return []
    return [
      column('classe', props.index.classes, 'Classi', 'groups'),
      // Only for confirmed @fermimn.edu.it accounts (the API sends null otherwise).
      ...(props.index.teachers?.length ? [column('docente', props.index.teachers, 'Docenti', 'school')] : []),
      column('aula', props.index.rooms, 'Aule', 'meeting_room'),
    ].filter((col) => col.count > 0) // while searching, hide columns without matches
  })

  // Best match across all columns: what Enter opens.
  const best = computed(() => {
    if (!q.value) return null
    let top = null
    for (const col of columns.value) {
      const e = col.groups[0]?.items[0]
      if (e && (!top || e.s < top.s)) top = { ...e, type: col.type }
    }
    return top
  })

  const isSelected = (type, key) => type === props.type && key === props.selected
  const isBest = (type, key) => best.value?.type === type && best.value.key === key

  function choose(type, e) {
    emit('select', type, e.key)
    query.value = ''
    open.value = false
    input.value?.blur()
  }

  function clearQuery() {
    query.value = ''
    input.value?.focus()
  }

  function onKeydown(e) {
    if (e.key === 'Enter' && best.value) {
      e.preventDefault()
      choose(best.value.type, best.value)
    } else if (e.key === 'Escape') {
      if (query.value) query.value = ''
      else open.value = false
    }
  }
</script>

<style scoped>
  .op {
    width: 100%;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .op-bar {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .op-field {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    min-height: 48px;
    padding: 0 4px 0 14px;
    border-radius: 16px;
    border: 1px solid var(--divider);
    background: var(--surface-variant);
    cursor: text;
    transition: border-color 150ms var(--m3-standard);
  }
  .op-field:hover {
    border-color: var(--on-surface-variant);
  }
  .op-field:focus-within {
    outline: 2px solid var(--on-surface-primary);
    outline-offset: 2px;
  }
  .op-lead {
    font-size: 20px;
    color: var(--on-surface-variant);
    margin-right: 8px;
  }
  .op-input {
    flex: 1;
    min-width: 0;
    height: 46px;
    border: 0;
    background: transparent;
    color: var(--on-surface);
    font: inherit;
    font-size: 1rem;
    outline: none;
  }
  .op-input::-webkit-search-cancel-button {
    display: none;
  }
  .op-input::placeholder {
    color: var(--on-surface-variant);
  }

  .op-icon-btn {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: var(--on-surface-variant);
  }
  .op-icon-btn:hover {
    background: color-mix(in srgb, var(--on-surface) 8%, transparent);
    color: var(--on-surface);
  }
  .op-icon-btn .material-symbols-outlined {
    font-size: 20px;
  }

  /* No blue flash on tap (mobile browsers): the toggle, the chips, the panel buttons */
  .op :is(button, a) {
    -webkit-tap-highlight-color: transparent;
  }
  .op-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 48px;
    padding: 0 10px 0 16px;
    border-radius: 16px;
    border: 1px solid var(--divider);
    background: var(--surface-variant);
    color: var(--on-surface);
    font-weight: 600;
    transition:
      background-color 150ms var(--m3-standard),
      border-color 150ms var(--m3-standard);
  }
  .op-toggle:hover:not(:disabled) {
    border-color: var(--on-surface-variant);
  }
  .op-toggle.open {
    background: color-mix(in srgb, var(--primary) 14%, var(--surface-variant));
  }
  .op-toggle:focus-visible,
  .op-chip:focus-visible {
    outline: 2px solid var(--on-surface-primary);
    outline-offset: 2px;
  }
  .op-toggle .material-symbols-outlined {
    font-size: 20px;
    color: var(--on-surface-variant);
  }
  .op-toggle-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .op-chevron {
    margin-left: auto;
    transition: transform 200ms var(--m3-standard);
  }
  .op-toggle.open .op-chevron {
    transform: rotate(180deg);
  }

  .op-panel {
    margin-top: 12px;
    padding: 16px 20px 12px;
    border-radius: 20px;
    border: 1px solid var(--divider);
    background: var(--surface);
  }

  .op-columns {
    display: grid;
    grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr));
    gap: 8px 32px;
  }

  .op-col-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
    font-size: 1rem;
    font-weight: 600;
    color: var(--on-surface);
  }
  .op-col-title .material-symbols-outlined {
    font-size: 20px;
    color: var(--on-surface-variant);
  }
  .op-count {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--on-surface-variant);
    font-variant-numeric: tabular-nums;
  }

  .op-group + .op-group {
    margin-top: 10px;
  }
  .op-group-label {
    margin: 0 0 6px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--on-surface-variant);
  }

  .op-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  /* .chip (style.css) + the rounded-square shape of the picker */
  .op-chip {
    min-height: 34px;
    padding: 0 12px;
    border-radius: 10px;
    color: var(--on-surface);
    font-size: 0.875rem;
    font-weight: 500;
    transition:
      background-color 120ms var(--m3-standard),
      border-color 120ms var(--m3-standard);
  }
  .op-chip:hover {
    background: color-mix(in srgb, var(--on-surface) 8%, transparent);
  }
  .op-chip.best {
    border-color: var(--on-surface-primary);
  }
  .op-chip.selected {
    background: var(--primary);
    border-color: var(--primary);
    color: var(--on-primary);
  }

  .op-empty {
    margin: 0;
    color: var(--on-surface-variant);
    font-size: 0.875rem;
  }

  .op-notice {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 16px;
    padding: 12px 44px 12px 14px;
    border-radius: 16px;
    background: color-mix(in srgb, var(--primary) 12%, var(--surface));
    color: var(--on-surface);
    font-size: 0.875rem;
    line-height: 1.4;
  }
  .op-notice-opener {
    display: flex;
    align-items: center;
    margin: 0 auto 12px;
    font-size: 0.875rem;
  }
  .op-notice-opener .material-symbols-outlined {
    font-size: 20px;
  }
  .op-notice-enter-active,
  .op-notice-leave-active {
    transition:
      transform 200ms ease,
      opacity 200ms ease;
  }
  .op-notice-enter-from,
  .op-notice-leave-to {
    transform: translateY(-8px);
    opacity: 0;
  }

  .op-notice-close {
    position: absolute;
    top: 6px;
    right: 6px;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--on-surface-variant);
    cursor: pointer;
  }
  .op-notice-close:hover {
    background: color-mix(in srgb, var(--on-surface) 8%, transparent);
  }
  .op-notice-close .material-symbols-outlined {
    font-size: 20px;
  }
  .op-notice-icon {
    flex: none;
    font-size: 24px;
    color: var(--primary);
  }
  .op-notice-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .op-notice-actions {
    flex: none;
    display: flex;
    gap: 8px;
  }
  .op-notice-btn {
    border: 0;
    font: inherit;
    text-align: center;
    cursor: pointer;
    flex: none;
    padding: 8px 16px;
    border-radius: 999px;
    background: var(--primary);
    color: var(--on-primary);
    font-weight: 500;
    text-decoration: none;
  }
  .op-notice-btn--outlined {
    background: transparent;
    color: var(--on-surface);
    box-shadow: inset 0 0 0 1px var(--divider);
  }
  .op-notice-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .op-notice:has(.op-login) {
    flex-wrap: wrap;
  }
  .op-login {
    flex-basis: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
    padding-left: 36px;
  }
  .op-login-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.8125rem;
    color: var(--on-surface-variant);
  }
  .op-login-field input {
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--divider);
    background: var(--surface);
    color: var(--on-surface);
    font: inherit;
    font-size: 0.9375rem;
  }
  .op-login-field input:focus {
    outline: 2px solid var(--primary);
    outline-offset: -1px;
  }
  .op-login-error,
  .op-login-note {
    grid-column: 1 / -1;
    margin: 0;
    font-size: 0.8125rem;
  }
  .op-login-error {
    color: var(--error);
  }
  .op-login-note {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--on-surface-variant);
  }
  .op-login-note .material-symbols-outlined {
    font-size: 16px;
  }
  .op-login-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .op-login-cancel,
  .op-link-btn {
    border: 0;
    background: none;
    color: var(--primary);
    font: inherit;
    font-weight: 500;
    cursor: pointer;
  }
  .op-login-cancel {
    padding: 8px 12px;
    color: var(--on-surface-variant);
  }
  .op-link-btn {
    padding: 0 4px;
    text-decoration: underline;
  }

  @media (max-width: 480px) {
    .op-login {
      grid-template-columns: 1fr;
      padding-left: 0;
    }
    .op-notice {
      flex-wrap: wrap;
    }
    .op-notice-text {
      flex-basis: calc(100% - 36px);
    }
    .op-notice-actions {
      flex: 1 1 100%;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .op-notice-btn {
      padding: 8px 14px;
    }
  }

  .op-hint {
    margin: 12px 0 0;
    font-size: 0.8125rem;
    color: var(--on-surface-variant);
  }
  .op-hint--teachers {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .op-hint--teachers .material-symbols-outlined {
    font-size: 16px;
  }

  .op-panel-enter-active,
  .op-panel-leave-active {
    transition:
      opacity 180ms var(--m3-standard),
      transform 180ms var(--m3-standard);
  }
  .op-panel-enter-from,
  .op-panel-leave-to {
    opacity: 0;
    transform: translateY(-6px);
  }

  @media (max-width: 700px) {
    .op-columns {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    .op-panel {
      padding: 14px 14px 10px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .op-panel-enter-active,
    .op-panel-leave-active,
    .op-chevron {
      transition: none;
    }
  }
</style>
