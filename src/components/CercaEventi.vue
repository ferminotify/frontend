<script setup>
  import { ref, defineEmits, nextTick, onMounted, computed } from 'vue'
  import { generateAlert } from '@/utils/alertbanner.js'
  import CercaEventiCore from '@/components/CercaEventiCore.vue'

  // local state for the search query
  const query = ref('')
  const searchKeywords = ref([])

  // Load saved keywords from localStorage on mount
  onMounted(() => {
    const saved = localStorage.getItem('keywords')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          searchKeywords.value = parsed
        }
      } catch (e) {
        console.warn('Failed to parse saved keywords', e)
      }
    }
    // Try to restore a saved filter
    applyFilterFromLocalStorage()
  })

  // Save keywords to localStorage whenever they change
  function saveKeywords() {
    localStorage.setItem('keywords', JSON.stringify(searchKeywords.value))
  }

  // info panel state (replaces jQuery slideToggle + localStorage logic)
  // Initialize from localStorage synchronously to avoid initial flash on first render
  const storedClosed = typeof window !== 'undefined' ? localStorage.getItem('cercaEventiInfoClosed') : null
  const showInfo = ref(storedClosed === 'true' ? false : true)
  const showDetails = ref(false)
  // opener link visibility; avoid showing while panel is animating out to prevent layout shift
  const showOpener = ref(!showInfo.value)
  // track if we're in the open flow initiated from the opener link
  const isOpening = ref(false)

  // ------- Filters (UI + logic) -------
  const filtersOpen = ref(false)
  const filterIcon = computed(() => (filtersOpen.value ? 'close' : 'tune'))
  const filterLabels = ['Nascondi conclusi', 'In corso', 'Futuri', 'Conclusi']
  // activeFilter is one of filterLabels or '' (none)
  const activeFilter = ref('')
  // badge visibility (small circle near the filter toggle when a filter is active)
  const filterBadgeVisible = computed(() => !!activeFilter.value)
  // reset button visibility (animated separately)
  const resetVisible = ref(false)

  // animation state per filter button to mimic sequential fade-in/out
  const filterBtnStates = ref(filterLabels.map(() => ({ hidden: true, fadeRight: false, fadeLeftOut: false })))

  // emit a search event so parent can handle navigation/results
  const emit = defineEmits(['search'])

  function toUppercase(e) {
    // force uppercase as the user types
    query.value = (e?.target?.value || '').toUpperCase()
  }

  function cercaEventi() {
    const kw = query.value.trim()
    if (!kw) {
      return
    }
    // Add keyword if not already in the list
    if (!searchKeywords.value.includes(kw)) {
      searchKeywords.value.push(kw)
      saveKeywords()
    }
    // DON'T clear input - keep it like index.ejs
    // emit to parent for any additional handling (like analytics)
    emit('search', kw)
  }

  function removeKeyword(keyword) {
    searchKeywords.value = searchKeywords.value.filter((k) => k !== keyword)
    saveKeywords()
  }

  async function openInfo() {
    // Begin the two-step open: 1) slide up opener, 2) after it leaves, slide down panel
    isOpening.value = true
    showOpener.value = false
    // persist state immediately (matches original behavior)
    localStorage.setItem('cercaEventiInfoClosed', 'false')
  }

  function toggleDetails() {
    showDetails.value = !showDetails.value
  }

  function closeInfo() {
    showInfo.value = false
    localStorage.setItem('cercaEventiInfoClosed', 'true')
    // keep opener hidden until panel fully collapsed (set in after-leave)
    showOpener.value = false
  }

  // slideToggle-like transition hooks (height auto animation)
  const DURATION = 300
  function slideEnter(el) {
    el.style.overflow = 'hidden'
    el.style.height = '0'
    el.style.opacity = '0'
    // force reflow
    void el.offsetHeight
    el.style.transition = `height ${DURATION}ms ease, opacity ${DURATION}ms ease`
    el.style.height = el.scrollHeight + 'px'
    el.style.opacity = '1'
    // ensure opener is hidden during entering
    if (el.id === 'cercaEventiInfo') {
      showOpener.value = false
    }
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
    // force reflow
    void el.offsetHeight
    el.style.transition = `height ${DURATION}ms ease, opacity ${DURATION}ms ease`
    el.style.height = '0'
    el.style.opacity = '0'
  }
  function slideAfterLeave(el) {
    el.style.transition = ''
    el.style.height = ''
    el.style.overflow = ''
    // now that the panel is gone, show the opener to avoid left-shift during animation
    if (el.id === 'cercaEventiInfo') {
      showOpener.value = true
    }
  }

  function onOpenerAfterLeave() {
    // Step 2: after the opener has slid away, open the info panel
    if (isOpening.value) {
      isOpening.value = false
      // next frame ensures DOM has removed opener before measuring panel
      nextTick(() => {
        showInfo.value = true
      })
    }
  }

  // ------- Filters: behaviors -------
  function toggleFilters() {
    filtersOpen.value = !filtersOpen.value

    const btns = filterBtnStates.value
    if (filtersOpen.value) {
      // opening: sequential fade in left->right
      btns.forEach((_, i) => {
        setTimeout(() => {
          btns[i].hidden = false
          btns[i].fadeLeftOut = false
          btns[i].fadeRight = true
        }, 150 * i)
      })
      // hide reset while opening; will be shown if active filter exists
      resetVisible.value = !!activeFilter.value
    } else {
      // closing: sequential fade out right->left
      for (let i = btns.length - 1; i >= 0; i--) {
        setTimeout(
          () => {
            btns[i].fadeRight = false
            btns[i].fadeLeftOut = true
          },
          150 * (btns.length - 1 - i)
        )
      }
      // keep reset visibility depending on active filter
      resetVisible.value = !!activeFilter.value
    }
  }

  function applyFilter(label) {
    // Clicking the already active filter clears it
    if (activeFilter.value === label) {
      activeFilter.value = ''
      localStorage.removeItem('filter')
      resetVisible.value = false
      return
    }

    activeFilter.value = label
    localStorage.setItem('filter', label)
    resetVisible.value = true
  }

  function resetFilters() {
    activeFilter.value = ''
    localStorage.removeItem('filter')
    resetVisible.value = false
  }

  function applyFilterFromLocalStorage() {
    const saved = localStorage.getItem('filter')
    if (saved && filterLabels.includes(saved)) {
      activeFilter.value = saved
      resetVisible.value = true
      // Inform the user filters were restored automatically
      generateAlert('info', 'Ci sono filtri attivi')
    }
  }
</script>

<template>
  <div id="CercaEventi">
    <!-- cerca eventi -->
    <div class="cercaEventi-container">
      <div class="cercaEventi">
        <div class="cercaEventi-title">
          <span class="material-symbols-outlined">event</span>
          <h1>
            Cerca
            <br />
            <span class="primary-text">eventi</span>
          </h1>
        </div>

        <div class="cercaEventi-form">
          <div class="material-textfield">
            <input
              placeholder=" "
              type="text"
              id="cercaEventiInput"
              v-model="query"
              @input="toUppercase"
              @keyup.enter="cercaEventi" />
            <label>Keyword</label>
          </div>
          <a id="submit-btn" class="btn filled addButton" @click="cercaEventi">
            <span class="material-symbols-outlined">arrow_forward_ios</span>
          </a>
        </div>
      </div>
    </div>
  </div>

  <div class="relative flex-center-x cercaEventiInfo-container">
    <transition name="opener" @after-leave="onOpenerAfterLeave">
      <a id="cercaEventiInfoShow" class="btn text" v-if="showOpener" @click="openInfo">
        <span class="material-symbols-outlined material-space-right">help</span>
        <span>Come funziona?</span>
      </a>
    </transition>

    <transition @enter="slideEnter" @after-enter="slideAfterEnter" @leave="slideLeave" @after-leave="slideAfterLeave">
      <div class="rounded-container" id="cercaEventiInfo" v-if="showInfo">
        <div class="rounded-inner">
          <p>
            Cerca nel
            <span class="primary-text">calendario giornaliero</span>
            una
            <span class="primary-text">keyword</span>
            e mostra le variazioni previsti nei prossimi 3 giorni.
          </p>
          <p>
            Fai attenzione alla
            <span class="primary-text">formattazione</span>
            della keyword: dev'essere uguale a quella scritta nel calendario giornaliero!
          </p>
          <transition
            @enter="slideEnter"
            @after-enter="slideAfterEnter"
            @leave="slideLeave"
            @after-leave="slideAfterLeave">
            <div v-if="showDetails">
              <ul>
                <li style="padding: 0; line-height: 1">
                  Esempio: con
                  <code>5CIIN</code>
                  mostra le variazioni della classe
                  <i>5CIIN</i>
                  .
                </li>
              </ul>
              <p>
                Accetta i cookies per
                <span class="primary-text">salvare</span>
                le keyword inserite.
              </p>
              <p>
                Usa
                <code>*</code>
                per mostrare tutte le variazioni.
              </p>
            </div>
          </transition>
          <div class="action-btn-container">
            <a class="btn text" @click="toggleDetails">
              <span class="action-btn-container-btn-text">
                {{ showDetails ? 'Mostra di meno' : 'Mostra di più' }}
              </span>
            </a>
            <a class="btn filled" @click="closeInfo">Chiudi</a>
          </div>
        </div>
      </div>
    </transition>
  </div>

  <div class="cercaEventi-section">
    <div class="cercaEventi-keywords-list" v-if="searchKeywords.length > 0">
      <span
        v-for="(keyword, idx) in searchKeywords"
        :key="idx"
        class="cercaEventi-keyword"
        @click="removeKeyword(keyword)"
        :title="`Clicca per rimuovere '${keyword}'`">
        {{ keyword }}
        <span class="material-symbols-outlined">backspace</span>
      </span>
    </div>
    <div class="cercaEventi-filter-container">
      <div class="relative">
        <a class="btn flex-center" :class="filtersOpen ? 'filled' : 'outlined'" @click="toggleFilters">
          <span class="material-symbols-outlined material-space-right">{{ filterIcon }}</span>
          Filtri
        </a>
        <span
          class="material-symbols-outlined filter-on-circle"
          :style="{ visibility: filterBadgeVisible ? 'visible' : 'hidden' }">
          circle
        </span>
      </div>
      <a
        v-for="(label, idx) in filterLabels"
        :key="label"
        class="btn filter-btn"
        :class="[
          activeFilter === label ? 'filled' : 'outlined',
          filterBtnStates[idx].hidden ? 'hidden' : '',
          filterBtnStates[idx].fadeRight ? 'fade-right' : '',
          filterBtnStates[idx].fadeLeftOut ? 'fade-left-out' : '',
        ]"
        @click="applyFilter(label)">
        {{ label }}
      </a>
      <a
        class="btn text reset-filter-btn"
        :class="[resetVisible ? 'fade-right' : 'fade-left-out', resetVisible ? '' : 'hidden']"
        @click="resetFilters">
        Reset filtri
      </a>
    </div>

    <!-- TODO similar events -->
    <CercaEventiCore :activeFilter="activeFilter" :keywords="searchKeywords" />
  </div>
</template>

<style scoped src="../assets/css/cercaeventi.css"></style>

<style>
  /* Simple slide-down/up for the info panel */
  .slide-enter-active,
  .slide-leave-active {
    transition:
      max-height 0.3s ease,
      opacity 0.3s ease;
    overflow: hidden;
  }
  .slide-enter-from,
  .slide-leave-to {
    max-height: 0;
    opacity: 0;
  }
  .slide-enter-to,
  .slide-leave-from {
    max-height: 1000px; /* large enough to contain content */
    opacity: 1;
  }

  /* Opener link slide/fade animation */
  .opener-enter-active,
  .opener-leave-active {
    transition:
      transform 300ms ease,
      opacity 300ms ease;
  }
  .opener-enter-from,
  .opener-leave-to {
    transform: translateY(-8px);
    opacity: 0;
  }
  .opener-enter-to,
  .opener-leave-from {
    transform: translateY(0);
    opacity: 1;
  }
</style>
