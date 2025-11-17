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
          <input
            type="text"
            id="keyword"
            name="keyword"
            placeholder="Es. 5CIIN"
            class="keyword-input"
            required
            v-model="keywordInput"
            @input="toUppercase"
            @keyup.enter="addKeyword"
            style="text-transform: uppercase" />
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
              <a href="./faq" class="link">FAQ</a>
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
    keywordInput.value = (keywordInput.value || '').toUpperCase().replace(/\s+/g, '')
  }

  async function addKeyword() {
    const kw = (keywordInput.value || '').trim()
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
