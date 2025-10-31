<script setup>
import { ref, defineEmits, nextTick } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'

// local state for the search query
const query = ref('')

// info panel state (replaces jQuery slideToggle + localStorage logic)
// Initialize from localStorage synchronously to avoid initial flash on first render
const storedClosed = typeof window !== 'undefined' ? localStorage.getItem('cercaEventiInfoClosed') : null
const showInfo = ref(storedClosed === 'true' ? false : true)
const showDetails = ref(false)
// opener link visibility; avoid showing while panel is animating out to prevent layout shift
const showOpener = ref(!showInfo.value)
// track if we're in the open flow initiated from the opener link
const isOpening = ref(false)

// emit a search event so parent can handle navigation/results
const emit = defineEmits(['search'])

function toUppercase(e) {
  // force uppercase as the user types
  query.value = (e?.target?.value || '').toUpperCase()
}

function cercaEventi() {
  // emit to parent; adjust to your actual search/navigation logic
  emit('search', query.value)
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
</script>

<template>
  <div id="CercaEventi">
    <!-- cerca eventi -->
    <div class="cercaEventi-container">
      <div class="cercaEventi">
        <div class="cercaEventi-title">
          <span class="material-symbols-outlined"> event </span>
          <h1>Cerca <br /><span class="primary-text">eventi</span></h1>
        </div>

        <div class="cercaEventi-form">
          <div class="material-textfield">
            <input
              placeholder=" "
              type="text"
              id="cercaEventiInput"
              v-model="query"
              @input="toUppercase"
              @keyup.enter="cercaEventi"
            />
            <label>Keyword</label>
          </div>
          <a id="submit-btn" class="btn filled addButton" @click="cercaEventi">
            <font-awesome-icon :icon="faChevronRight" />
          </a>
        </div>
      </div>
    </div>
  </div>

  <div class="relative flex-center-x cercaEventiInfo-container">
    <transition name="opener" @after-leave="onOpenerAfterLeave">
      <a
        id="cercaEventiInfoShow"
        class="btn text"
        v-if="showOpener"
        @click="openInfo"
      >
        <span class="material-symbols-outlined material-space-right">help</span>
        <span>Come funziona?</span>
      </a>
    </transition>

    <transition @enter="slideEnter" @after-enter="slideAfterEnter" @leave="slideLeave" @after-leave="slideAfterLeave">
      <div class="rounded-container" id="cercaEventiInfo" v-if="showInfo">
        <div class="rounded-inner">
            <p>
              Cerca nel <span class="primary-text">calendario giornaliero</span> una
              <span class="primary-text">keyword</span> e mostra le variazioni previsti nei prossimi 3
              giorni.
            </p>
            <p>
              Fai attenzione alla <span class="primary-text">formattazione</span> della keyword:
              dev'essere uguale a quella scritta nel calendario giornaliero!
            </p>
            <transition @enter="slideEnter" @after-enter="slideAfterEnter" @leave="slideLeave" @after-leave="slideAfterLeave">
              <div v-if="showDetails">
              <ul>
                <li style="padding: 0; line-height: 1">
                  Esempio: con <code>5CIIN</code> mostra le variazioni della classe <i>5CIIN</i>.
                </li>
              </ul>
              <p>
                Accetta i cookies per <span class="primary-text">salvare</span> le keyword inserite.
              </p>
              <p>Usa <code>*</code> per mostrare tutte le variazioni.</p>
              </div>
            </transition>
            <div class="action-btn-container">
              <a class="btn text" @click="toggleDetails">
                <span class="action-btn-container-btn-text">{{ showDetails ? 'Mostra di meno' : 'Mostra di più' }}</span>
              </a>
              <a class="btn filled" @click="closeInfo">Chiudi</a>
            </div>
          </div>
      </div>
    </transition>

  </div>


</template>

<style src="../assets/css/cercaeventi.css"></style>

<style>
/* Simple slide-down/up for the info panel */
.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
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
</style>

<style>
/* Opener link slide/fade animation */
.opener-enter-active,
.opener-leave-active {
  transition: transform 300ms ease, opacity 300ms ease;
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
