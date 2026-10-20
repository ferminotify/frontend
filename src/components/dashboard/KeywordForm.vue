<template>
  <!-- Keyword form -->
  <div class="sub-section">
    <h2 style="margin-bottom: 10px">
      <font-awesome-icon :icon="faKey" style="color: var(--on-surface-primary)" />
      Le tue keywords
    </h2>
    <div class="keywords-container">
      <button
        class="btn keyword-edit-btn"
        :class="isEditing ? 'filled' : 'outlined'"
        @click="toggleKeywordEdit"
        :aria-pressed="isEditing">
        <span class="material-symbols-outlined">edit_square</span>
      </button>
      <ul id="keyword-list">
        <li
          v-for="(keyword, index) in keywords"
          :key="index"
          class="keyword"
          :class="{ 'keyword-editing': isEditing }"
          @click="onKeywordClick(keyword)">
          <span class="keyword-list-bullet">
            <font-awesome-icon :icon="isEditing ? faTrash : faSquare" />
          </span>
          {{ keyword }}
        </li>
      </ul>
      <div class="keywords-form-container">
        <div class="keywords material-textfield" id="submitForm">
          <div class="kw-combo">
            <input
              type="text"
              id="keyword"
              name="keyword"
              placeholder="Es. 5CIIN"
              class="keyword-input"
              required
              autocomplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="keyword-suggestions"
              :aria-expanded="showSuggestions"
              :aria-activedescendant="activeIndex >= 0 ? `keyword-suggestion-${activeIndex}` : undefined"
              v-model="keywordInput"
              @input="onInput"
              @focus="onFocus"
              @blur="onBlur"
              @keydown="onKeydown"
              style="text-transform: uppercase" />
            <!-- Suggestions: classes, and teachers for school accounts -->
            <ul v-show="showSuggestions" id="keyword-suggestions" class="kw-suggestions" role="listbox" aria-label="Suggerimenti">
              <li
                v-for="(s, i) in suggestions"
                :id="`keyword-suggestion-${i}`"
                :key="`${s.type}-${s.keyword}-${s.label}`"
                role="option"
                :aria-selected="i === activeIndex"
                class="kw-suggestion"
                :class="{ active: i === activeIndex }"
                @mousedown.prevent="pickSuggestion(s)"
                @mousemove="activeIndex = i">
                <span class="material-symbols-outlined" aria-hidden="true">{{ s.type === 'teacher' ? 'person' : 'groups' }}</span>
                <span class="kw-suggestion-text">
                  <strong>{{ s.keyword }}</strong>
                  <small>{{ s.type === 'teacher' ? s.label : 'Classe' }}</small>
                </span>
              </li>
            </ul>
          </div>
          <a class="btn filled addButton submit-btn" @click="addKeyword" :disabled="isSubmitting">
            <span class="material-symbols-outlined">arrow_forward_ios</span>
          </a>
        </div>
      </div>

      <div class="maggioriInfo-container">
        <!-- prettier-ignore -->
        <p id="maggioriInfo" class="maggioriInfo"
		  @click="toggleKeywordsInfo"
		  >
			<!-- prettier-ignore -->
            <span class="material-symbols-outlined">info</span> <span style="text-decoration: underline; text-decoration-color: var(--on-surface-primary); cursor: pointer">Maggiori informazioni</span>
          </p>
        <transition
          @enter="slideEnter"
          @after-enter="slideAfterEnter"
          @leave="slideLeave"
          @after-leave="slideAfterLeave">
          <ul class="keywords-info" id="keywordsInfo" v-if="showKeywordsInfo">
            <li>
              Aggiungi le parole chiave alla lista per essere notificat{{ userGenderLetter }}
              quando è presente un evento che la riguarda nel calendario giornaliero. Ti consigliamo di inserire la tua
              classe e il tuo cognome.
            </li>
            <li>
              Per rimuovere una parola chiave, clicca sul bottone
              <span class="material-symbols-outlined">edit_square</span>
              .
            </li>
            <li>
              Per ulteriori dettagli, visita il
              <RouterLink to="/faq" class="link">FAQ</RouterLink>
              .
            </li>
          </ul>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
  import { faKey, faSquare, faTrash } from '@fortawesome/free-solid-svg-icons'
  import { ref, computed } from 'vue'
  import { useUserStore } from '@/stores/user'
  import { generateAlert } from '@/utils/alertbanner.js'
  import { fetchTimetableIndex } from '@/api/timetable'

  const store = useUserStore()
  const keywords = computed(() => (Array.isArray(store.user?.keywords) ? store.user.keywords : []))
  const isEditing = ref(false)
  const keywordInput = ref('')
  const isSubmitting = ref(false)
  const showKeywordsInfo = ref(false)
  // use centralized store getter for gender letter
  const userGenderLetter = computed(() => store.genderLetter)

  function toggleKeywordEdit() {
    isEditing.value = !isEditing.value
  }

  function toUppercase() {
    keywordInput.value = (keywordInput.value || '').toUpperCase()
  }

  // ------- Suggestions -------
  // Classes from the school timetable; teachers too when the backend shows them
  // (@fermimn.edu.it accounts). Loaded once, on first focus.
  const index = ref(null) // { classes: [{key,name}], teachers: [{key,name}] | null }
  let indexLoading = null
  const focused = ref(false)
  const activeIndex = ref(-1)
  const MAX_SUGGESTIONS = 6

  function loadIndex() {
    indexLoading ||= fetchTimetableIndex()
      .then((data) => (index.value = data))
      .catch((err) => {
        console.warn('Keyword suggestions unavailable', err)
        indexLoading = null // retry on the next focus
      })
    return indexLoading
  }

  // The school lists teachers as "Surname Name": the calendar names them by surname
  // ("PROF. ROSSI"). Two words → the first; a leading particle (De, Di, Della…) joins the next.
  const PARTICLES = new Set(['DE', 'DI', 'DEL', 'DELLA', 'DELLE', 'DEGLI', 'DAL', 'DALLA', 'DA', 'LA', 'LO', 'LI', 'VAN', 'VON', "D'"])
  function surnameOf(name) {
    const words = name.toUpperCase().split(/\s+/).filter(Boolean)
    if (words.length > 2 && PARTICLES.has(words[0])) return `${words[0]} ${words[1]}`
    return words[0] || ''
  }

  const candidates = computed(() => {
    if (!index.value) return []
    const classes = (index.value.classes || []).map((c) => ({ type: 'class', keyword: c.key.toUpperCase(), label: c.name }))
    const teachers = (index.value.teachers || [])
      .filter((t) => !/\d/.test(t.name)) // vacant posts ("A40 …")
      .map((t) => ({ type: 'teacher', keyword: surnameOf(t.name), label: t.name }))
    return [...classes, ...teachers]
  })

  const suggestions = computed(() => {
    const q = (keywordInput.value || '').trim().toUpperCase().replace(/\s+/g, ' ')
    if (!q) return []
    const have = new Set(keywords.value.map((k) => (k || '').toUpperCase()))
    const score = (c) => {
      const label = c.label.toUpperCase()
      if (c.keyword.startsWith(q)) return 0
      if (label.split(' ').some((w) => w.startsWith(q))) return 1
      if (c.keyword.includes(q) || label.includes(q)) return 2
      return -1
    }
    return candidates.value
      .filter((c) => !have.has(c.keyword) && !(c.keyword === q && c.type === 'class'))
      .map((c) => ({ c, rank: score(c) }))
      .filter((x) => x.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.c.keyword.localeCompare(b.c.keyword))
      .slice(0, MAX_SUGGESTIONS)
      .map((x) => x.c)
  })

  const showSuggestions = computed(() => focused.value && suggestions.value.length > 0)

  function onInput() {
    toUppercase()
    activeIndex.value = -1
  }
  function onFocus() {
    focused.value = true
    loadIndex()
  }
  function onBlur() {
    focused.value = false
    activeIndex.value = -1
  }
  function onKeydown(e) {
    const n = suggestions.value.length
    if (e.key === 'ArrowDown' && n) {
      e.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % n
    } else if (e.key === 'ArrowUp' && n) {
      e.preventDefault()
      activeIndex.value = (activeIndex.value - 1 + n) % n
    } else if (e.key === 'Escape') {
      activeIndex.value = -1
      focused.value = false
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (showSuggestions.value && activeIndex.value >= 0) pickSuggestion(suggestions.value[activeIndex.value])
      else addKeyword()
    }
  }
  function pickSuggestion(s) {
    keywordInput.value = s.keyword
    activeIndex.value = -1
    addKeyword()
  }

  async function addKeyword() {
    const kw = (keywordInput.value || '').trim().replace(/\s+/g, ' ')
    if (!kw) return
    // prevent duplicates (case-insensitive)
    const exists = (keywords.value || []).some((k) => (k || '').toUpperCase() === kw.toUpperCase())
    if (exists) {
      generateAlert('error', 'La keyword è già presente.')
      return
    }
    try {
      isSubmitting.value = true
      await store.addKeyword(kw)
      keywordInput.value = ''
      // Optionally refresh similar suggestions in the future
    } catch (err) {
      console.warn('Failed to add keyword', err)
      generateAlert('error', 'Si è verificato un errore. Riprova più tardi.')
    } finally {
      isSubmitting.value = false
    }
  }

  async function deleteKeyword(kw) {
    try {
      await store.deleteKeyword(kw)
    } catch (err) {
      console.warn('Failed to delete keyword', err)
      generateAlert('error', 'Si è verificato un errore. Riprova più tardi.')
    }
  }

  async function onKeywordClick(kw) {
    if (!isEditing.value) return
    await deleteKeyword(kw)
  }

  function toggleKeywordsInfo() {
    showKeywordsInfo.value = !showKeywordsInfo.value
  }

  // Slide transition helpers
  const DURATION = 300
  function slideEnter(el) {
    el.style.overflow = 'hidden'
    el.style.height = '0'
    el.style.opacity = '0'
    void el.offsetHeight
    el.style.transition = `height ${DURATION}ms ease, opacity ${DURATION}ms ease`
    el.style.height = el.scrollHeight + 'px'
    el.style.opacity = '1'
  }
  function slideAfterEnter(el) {
    el.style.transition = ''
    el.style.height = 'auto'
    el.style.overflow = ''
  }
  function slideLeave(el) {
    el.style.overflow = 'hidden'
    el.style.height = el.scrollHeight + 'px'
    el.style.opacity = '1'
    void el.offsetHeight
    el.style.transition = `height ${DURATION}ms ease, opacity ${DURATION}ms ease`
    el.style.height = '0'
    el.style.opacity = '0'
  }
  function slideAfterLeave(el) {
    el.style.transition = ''
    el.style.height = ''
    el.style.overflow = ''
  }
</script>

<style scoped src="@/assets/css/dashboard.css"></style>

<style scoped>
  .kw-combo {
    position: relative;
    flex: 0 1 350px;
    min-width: 0;
  }
  /* Padding inside the width, or the field runs under the submit button */
  .kw-combo .keyword-input {
    width: 100%;
    box-sizing: border-box;
  }
  .kw-suggestions {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 20;
    margin: 0;
    padding: 4px;
    list-style: none;
    border-radius: 12px;
    border: 1px solid var(--divider);
    background: var(--surface);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  }
  .kw-suggestion {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .kw-suggestion.active {
    background: var(--surface-variant);
  }
  .kw-suggestion .material-symbols-outlined {
    font-size: 20px;
    color: var(--on-surface-primary);
  }
  .kw-suggestion-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .kw-suggestion-text strong {
    font-weight: 600;
  }
  .kw-suggestion-text small {
    color: var(--on-surface-variant);
    font-size: 0.75rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
