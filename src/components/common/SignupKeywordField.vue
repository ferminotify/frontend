<template>
  <div class="skf">
    <div class="material-textfield">
      <input
        ref="inputRef"
        :value="query"
        placeholder=" "
        type="text"
        name="keyword"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="signup-keyword-suggestions"
        :aria-expanded="showSuggestions"
        :aria-activedescendant="activeIndex >= 0 ? `signup-keyword-suggestions-${activeIndex}` : undefined"
        :disabled="model.length >= MAX"
        @input="onInput"
        @focus="onFocus"
        @blur="onFieldBlur"
        @keydown="onKeydown" />
      <label>Classe o docente</label>
      <KeywordSuggestions
        id="signup-keyword-suggestions"
        :show="showSuggestions"
        :suggestions="suggestions"
        :active-index="activeIndex"
        @pick="pick"
        @hover="activeIndex = $event" />
    </div>
    <div v-if="model.length" class="cercaEventi-keywords-list">
      <span
        v-for="kw in model"
        :key="kw"
        class="cercaEventi-keyword"
        :class="{ 'skf-unknown': typoKeys.has(kw) }"
        role="button"
        tabindex="0"
        :title="`Clicca per rimuovere '${kw}'`"
        @click="remove(kw)"
        @keydown.enter.prevent="remove(kw)"
        @keydown.space.prevent="remove(kw)">
        {{ kw }}
        <span class="material-symbols-outlined" aria-hidden="true">backspace</span>
      </span>
    </div>
    <p v-if="tooShort" class="input-suggestion skf-typo" role="alert">Scrivi almeno 2 lettere o numeri.</p>
    <p v-for="t in typos" :key="t.keyword" class="input-suggestion skf-typo" role="alert">
      Classe <code>{{ t.keyword }}</code> non trovata.
      <template v-if="t.suggestions.length">
        Intendevi
        <button v-for="s in t.suggestions" :key="s" type="button" class="chip skf-chip" @click="replace(t.keyword, s)">{{ s }}</button>
      </template>
    </p>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import KeywordSuggestions from '@/components/common/KeywordSuggestions.vue'
  import { useClassCheck, useKeywordSuggestions } from '@/composables/useKeywordSuggestions'

  const MAX = 5 // as the backend (signupKeywordList)
  const model = defineModel({ type: Array, default: () => [] })
  const query = ref('') // what is being typed; the chosen keywords are the model (the tags)
  const inputRef = ref(null)

  const { suggestions, showSuggestions, activeIndex, resetActive, onFocus, onBlur, onKeydown, pick } = useKeywordSuggestions({
    input: query,
    exclude: () => model.value,
    onPick: (s) => add(s.keyword),
    // Enter: the typed text becomes a tag; with nothing typed, the form is sent
    onEnter: () => (query.value.trim() ? add(query.value) : inputRef.value?.form?.requestSubmit()),
  })
  const { check } = useClassCheck()
  const typos = computed(() => model.value.map(check).filter(Boolean))
  const typoKeys = computed(() => new Set(typos.value.map((t) => t.keyword)))

  const clean = (kw) => kw.trim().replace(/\s+/g, ' ').toUpperCase()
  // Letters and digits only, as the backend counts them (keywordWords): at least 2
  const letters = (kw) => kw.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const tooShort = ref(false)

  function add(keyword) {
    const value = clean(keyword)
    if (value && letters(value).length < 2) {
      tooShort.value = true // kept in the field, to be completed
      return
    }
    tooShort.value = false
    query.value = ''
    if (!value || model.value.some((k) => k === value) || model.value.length >= MAX) return
    model.value = [...model.value, value]
  }

  function replace(oldKw, newKw) {
    const value = clean(newKw)
    model.value = model.value.filter((k) => k !== value).map((k) => (k === oldKw ? value : k))
  }

  function remove(kw) {
    model.value = model.value.filter((k) => k !== kw)
    inputRef.value?.focus()
  }

  function onInput(e) {
    query.value = e.target.value.toUpperCase()
    tooShort.value = false
    resetActive()
  }

  function onFieldBlur() {
    onBlur()
    if (query.value.trim()) add(query.value)
  }
</script>

<style scoped src="@/assets/css/page.css"></style>
<style scoped src="@/assets/css/cercaeventi.css"></style>
<style scoped>
  .skf input {
    text-transform: uppercase;
  }
  .skf-typo {
    padding-top: 0;
    margin: 0;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    color: var(--on-surface);
  }
  .skf-chip {
    padding: 4px 12px;
    border-radius: 999px;
    font-weight: 600;
  }
  .skf .cercaEventi-keywords-list {
    justify-content: flex-start;
    margin-bottom: 0;
  }
  .skf .cercaEventi-keyword {
    margin: 0 20px 0 0;
  }
  .skf-unknown {
    outline: 1px dashed var(--warning-soft);
    outline-offset: 2px;
  }
</style>
