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
      <!-- Saved keywords that look like a class and are none: the notifier only finds that exact word -->
      <div v-if="savedTypos.length" class="kw-check" role="status">
        <p class="kw-check-title">
          <span class="material-symbols-outlined" aria-hidden="true">help</span>
          {{ savedTypos.length === 1 ? 'Questa keyword non corrisponde' : 'Queste keyword non corrispondono' }} a nessuna classe:
          le notifiche arrivano solo se è scritta così nel calendario.
        </p>
        <ul class="kw-check-list">
          <li v-for="t in savedTypos" :key="t.keyword">
            <code>{{ t.keyword }}</code>
            <template v-if="t.suggestions.length">
              <span class="kw-check-hint">intendevi</span>
              <button
                v-for="s in t.suggestions"
                :key="s"
                type="button"
                class="chip kw-check-chip"
                :disabled="isSubmitting"
                @click="replaceKeyword(t.keyword, s)">
                {{ s }}
              </button>
            </template>
            <button type="button" class="btn text kw-check-keep" @click="keepKeyword(t.keyword)">Va bene così</button>
          </li>
        </ul>
      </div>
      <ul id="keyword-list">
        <li
          v-for="(keyword, index) in keywords"
          :key="index"
          class="keyword"
          :class="{ 'keyword-editing': isEditing, 'keyword-unknown': typoKeys.has(keyword) }"
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
            <KeywordSuggestions
              id="keyword-suggestions"
              :show="showSuggestions"
              :suggestions="suggestions"
              :active-index="activeIndex"
              @pick="pickSuggestion"
              @hover="activeIndex = $event" />
          </div>
          <a class="btn filled addButton submit-btn" @click="addKeyword" :disabled="isSubmitting">
            <span class="material-symbols-outlined">arrow_forward_ios</span>
          </a>
        </div>
      </div>
      <!-- New keyword that looks like a class and is none: ask before adding it -->
      <div v-if="pendingTypo" class="kw-check" role="alert">
        <p class="kw-check-title">
          <span class="material-symbols-outlined" aria-hidden="true">help</span>
          <span><code>{{ pendingTypo.keyword }}</code> non è una classe.{{ pendingTypo.suggestions.length ? ' Intendevi:' : '' }}</span>
        </p>
        <div class="kw-check-actions">
          <button
            v-for="s in pendingTypo.suggestions"
            :key="s"
            type="button"
            class="chip kw-check-chip"
            :disabled="isSubmitting"
            @click="addKeyword(s, { force: true })">
            {{ s }}
          </button>
          <button type="button" class="btn text" :disabled="isSubmitting" @click="addKeyword(pendingTypo.keyword, { force: true })">
            Aggiungi comunque
          </button>
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
  import { useKeywordSuggestions, useClassCheck } from '@/composables/useKeywordSuggestions'
  import KeywordSuggestions from '@/components/common/KeywordSuggestions.vue'

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
  const { suggestions, showSuggestions, activeIndex, resetActive, onFocus, onBlur, onKeydown, pick } = useKeywordSuggestions({
    input: keywordInput,
    exclude: () => keywords.value,
    onPick: (s) => {
      keywordInput.value = s.keyword
      addKeyword()
    },
    onEnter: () => addKeyword(),
  })
  const pickSuggestion = pick

  function onInput() {
    toUppercase()
    resetActive()
  }

  // ------- Class check (see useClassCheck) -------
  const { check } = useClassCheck()
  const pendingTypo = ref(null) // { keyword, suggestions } waiting for a choice
  const KEEP_KEY = 'keywordsKept' // keywords the user said are fine as they are
  const kept = ref(readKept())
  function readKept() {
    try {
      return new Set(JSON.parse(localStorage.getItem(KEEP_KEY) || '[]'))
    } catch {
      return new Set()
    }
  }
  function keepKeyword(kw) {
    kept.value = new Set([...kept.value, kw])
    try {
      localStorage.setItem(KEEP_KEY, JSON.stringify([...kept.value]))
    } catch {
      // private mode: kept for this visit only
    }
  }
  const savedTypos = computed(() => keywords.value.filter((k) => !kept.value.has(k)).map(check).filter(Boolean))
  const typoKeys = computed(() => new Set(savedTypos.value.map((t) => t.keyword)))

  async function replaceKeyword(oldKw, newKw) {
    try {
      isSubmitting.value = true
      await store.deleteKeyword(oldKw)
    } catch (err) {
      console.warn('Failed to replace keyword', err)
      generateAlert('error', 'Si è verificato un errore. Riprova più tardi.')
      return
    } finally {
      isSubmitting.value = false
    }
    await addKeyword(newKw, { force: true })
  }

  async function addKeyword(value, { force = false } = {}) {
    const kw = (typeof value === 'string' ? value : keywordInput.value || '').trim().replace(/\s+/g, ' ')
    if (!kw) return
    if (!force) {
      const typo = check(kw)
      if (typo) {
        pendingTypo.value = typo
        return
      }
    }
    pendingTypo.value = null
    // prevent duplicates (case-insensitive)
    const exists = (keywords.value || []).some((k) => (k || '').toUpperCase() === kw.toUpperCase())
    if (exists) {
      generateAlert('error', 'La keyword è già presente.')
      return
    }
    try {
      isSubmitting.value = true
      const joints = await store.addKeyword(kw)
      keywordInput.value = ''
      if (joints.length) {
        const list = joints.join(', ')
        generateAlert(
          'info',
          `Aggiunt${joints.length > 1 ? 'e' : 'a'} anche ${list}, classe articolata con ${kw.toUpperCase()}. Se non ti interessa, toglila.`
        )
      }
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
  .kw-check {
    margin: 12px 0;
    padding: 10px 14px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--warning) 12%, transparent);
    font-size: 0.875rem;
  }
  .kw-check-title {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0 0 8px;
  }
  .kw-check-title .material-symbols-outlined {
    font-size: 20px;
    color: var(--warning-soft);
  }
  .kw-check-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .kw-check-list li,
  .kw-check-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
  }
  .kw-check-hint {
    color: var(--on-surface-variant);
  }
  .kw-check-chip {
    padding: 4px 12px;
    border-radius: 999px;
    font-weight: 600;
  }
  .kw-check-keep {
    margin-left: auto;
    font-size: 0.8125rem;
  }
  .keyword.keyword-unknown {
    outline: 1px dashed var(--warning-soft);
    outline-offset: 2px;
  }
</style>
