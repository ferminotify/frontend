<template>
  <div class="section" :class="{ 'onboarding-visible': showOnboarding }">
    <!-- Backdrop that dims the entire page while onboarding is active -->
    <div v-if="showOnboarding" class="onboarding-backdrop" @click="skipOnboarding"></div>

    <div
      ref="startOnboardingRef"
      class="onboarding-container"
      :class="{ 'onboarding-active': showOnboarding && step === 0 }">
      <!-- Onboarding card anchored to top/start of the page -->
      <div v-if="showOnboarding && step === 0" class="onboarding-card start">
        <p class="onboarding-text" v-html="currentStepText"></p>
        <div class="onboarding-actions">
          <button class="btn text" @click="skipOnboarding">Salta</button>
          <button class="btn text" @click="nextStep">{{ isLastStep ? 'Fine' : 'Avanti' }}</button>
          <div class="onboarding-progress">{{ step + 1 }}/{{ steps.length }}</div>
        </div>
      </div>
    </div>

    <Title :title="`Dashboard di ${user.name || ''}`" :subtitle="greeting" id="dashboard-title" />
    <p class="information">
      <span class="material-symbols-outlined" style="color: var(--on-surface-primary)" aria-hidden="true">warning</span>
      Il sistema non è ufficialmente riconosciuto dalla presidenza dell'Istituto Superiore "Enrico Fermi" di Mantova.
      Eventuali malfunzionamenti sono a carico dello staff e non sono valide giustificazioni in uffici di segreteria e
      presidenza.
    </p>

    <!-- Keyword form -->
    <div ref="keywordRef" class="onboarding-container" :class="{ 'onboarding-active': showOnboarding && step === 1 }">
      <KeywordForm />
      <!-- Onboarding card anchored to this section -->
      <div v-if="showOnboarding && step === 1" class="onboarding-card">
        <p class="onboarding-text" v-html="currentStepText"></p>
        <div class="onboarding-actions">
          <button class="btn text" @click="skipOnboarding">Salta</button>
          <button class="btn text" @click="nextStep">{{ isLastStep ? 'Fine' : 'Avanti' }}</button>
          <div class="onboarding-progress">{{ step + 1 }}/{{ steps.length }}</div>
        </div>
      </div>
    </div>

    <!-- Events -->
    <Eventi :keywords="keywords" />

    <!-- Settings -->
    <div ref="settingsRef" class="onboarding-container" :class="{ 'onboarding-active': showOnboarding && step === 2 }">
      <Settings />
      <!-- Onboarding card anchored to this section -->
      <div v-if="showOnboarding && step === 2" class="onboarding-card settings">
        <p class="onboarding-text" v-html="currentStepText"></p>
        <div class="onboarding-actions">
          <button class="btn text" @click="skipOnboarding">Salta</button>
          <button class="btn text" @click="nextStep">{{ isLastStep ? 'Fine' : 'Avanti' }}</button>
          <div class="onboarding-progress">{{ step + 1 }}/{{ steps.length }}</div>
        </div>
      </div>
    </div>

    <!-- Telegram -->
    <div ref="telegramRef" class="onboarding-container" :class="{ 'onboarding-active': showOnboarding && step === 3 }">
      <Telegram />
      <!-- Onboarding card anchored to this section -->
      <div v-if="showOnboarding && step === 3" class="onboarding-card">
        <p class="onboarding-text" v-html="currentStepText"></p>
        <div class="onboarding-actions">
          <button class="btn text" @click="skipOnboarding">Salta</button>
          <button class="btn text" @click="nextStep">{{ isLastStep ? 'Fine' : 'Avanti' }}</button>
          <div class="onboarding-progress">{{ step + 1 }}/{{ steps.length }}</div>
        </div>
      </div>
    </div>

    <!-- User Info -->
    <UserInfo />

    <!-- Notifiche -->
    <Notifiche />

    <!-- Report a problem -->
    <div class="sub-section reportProblem">
      <p>
        <a href="mailto:mail@fn.lkev.in">
          <span class="material-symbols-outlined material-space-right primary-text" aria-hidden="true">error</span>
          <span class="link">Segnala un problema</span>
        </a>
      </p>
      <p>mail@fn.lkev.in</p>
      <p>
        <a href="https://www.instagram.com/ferminotify/" class="link">
          <FontAwesomeIcon :icon="['fab', 'instagram']" style="color: var(--on-surface-primary)" />
          ferminotify
        </a>
      </p>
      <p>
        <button class="btn text" v-on:click="startOnboarding()"><span class="material-symbols-outlined">play_circle</span> Onboarding</button>
      </p>
    </div>
  </div>
</template>

<style src="@/assets/css/page.css"></style>
<style scoped src="@/assets/css/dashboard.css"></style>
<style scoped>
  .onboarding-container {
    position: relative;
  }
  .onboarding-card {
    position: absolute;
    transform: translateY(-45px); /* margin of section */
    z-index: 1000; /* ensure it overlays above following components */
    background: rgba(20, 19, 20, 0.96);
    color: var(--on-surface);
    border: 1px solid var(--on-surface-variant);
    border-radius: 25px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
    padding: 14px 16px;
    width: auto;
    max-width: min(92vw, 460px);
  }
  .onboarding-card.settings {
    transform: translateY(-100px); /* logout btn */
  }
  .onboarding-card.start {
    /* position the start card slightly below the top element */
    transform: translateY(8px);
    left: 0;
  }
  .onboarding-text {
    line-height: 1.4;
  }
  .onboarding-actions {
    display: flex;
    gap: 25px;
    justify-content: flex-end;
    align-items: center;
  }
  .onboarding-progress {
    font-size: 12px;
    color: var(--muted);
    margin-top: 6px;
    text-align: right;
  }

  /* When onboarding is visible, dim and disable interaction for non-active containers */
  .onboarding-visible .onboarding-container {
    opacity: 0.28;
    pointer-events: none;
    transition: opacity 200ms ease;
    filter: brightness(0.85);
  }
  .onboarding-visible .onboarding-container.onboarding-active {
    opacity: 1;
    pointer-events: auto;
    filter: none;
  }

  /* Ensure the onboarding card itself remains interactive */
  .onboarding-card {
    pointer-events: auto;
  }

  /* Full-screen backdrop to dim everything while onboarding is active */
  .onboarding-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 900;
  }

  /* Ensure active container sits above the backdrop and remains interactive */
  .onboarding-visible .onboarding-container.onboarding-active {
    z-index: 1001;
  }

  /* Raise onboarding-card above the active container/backdrop so controls remain clickable */
  .onboarding-card {
    z-index: 1002; /* override earlier z-index to ensure it's above the backdrop */
  }
</style>

<script setup>
  import KeywordForm from '@/components/dashboard/KeywordForm.vue'
  import Eventi from '@/components/dashboard/Eventi.vue'
  import Title from '@/components/Title.vue'
  import Settings from '@/components/dashboard/Settings.vue'
  import Telegram from '@/components/dashboard/Telegram.vue'
  import UserInfo from '@/components/dashboard/UserInfo.vue'
  import Notifiche from '@/components/dashboard/Notifiche.vue'
  import { onMounted, ref, computed, nextTick } from 'vue'
  import { useUserStore } from '@/stores/user'

  const store = useUserStore()
  const loading = ref(false)
  const user = computed(() => store.user || {})
  const keywords = computed(() => (Array.isArray(store.user?.keywords) ? store.user.keywords : []))
  const showOnboarding = ref(false)
  const step = ref(0)
  const startOnboardingRef = ref(null)
  const keywordRef = ref(null)
  const settingsRef = ref(null)
  const telegramRef = ref(null)
  const userGenderLetter = computed(() => store.genderLetter)

  const steps = [
    {
      key: 'startOnboardingRef',
      ref: startOnboardingRef,
      text: () =>
        `Benvenut${userGenderLetter.value || 'ǝ'} su Fermi Notify! Ti guideremo attraverso le <b>funzionalità</b> principali della dashboard.`,
    },
    {
      key: 'keywords',
      ref: keywordRef,
      text: "Aggiungi le tue <b>keyword</b> (classe, cognome, corsi) che appaiono nella variazione dell'orario.",
    },
    {
      key: 'settings',
      ref: settingsRef,
      text: () => {
        const time = (store.user?.notification_time || '06:00').slice(0, 5)
        const dayBefore = !!store.user?.notification_day_before
        const when = dayBefore ? 'del <b>giorno prima</b>' : 'alla <b>mattina</b>'
        return `Personalizza i canali e l'orario delle <b>notifiche</b>. Attualmente ricevi un riepilogo alle <b>${time}</b> ${when}.`
      },
    },
    {
      key: 'telegram',
      ref: telegramRef,
      text: '<b>Collega Telegram</b> per ricevere le notifiche anche su Telegram.',
    },
  ]

  const currentStepText = computed(() => {
    const s = steps[step.value]
    if (!s) return ''
    return typeof s.text === 'function' ? s.text() : s.text || ''
  })
  const isLastStep = computed(() => step.value >= steps.length - 1)

  function scrollToCurrent() {
    const target = steps[step.value]?.ref?.value
    if (!target) return
    try {
      // Compute absolute top and scroll so the element sits 30px below the top of the viewport
      const rect = target.getBoundingClientRect()
      const offset = 30 // px above the element
      const top = window.scrollY + rect.top - offset
      window.scrollTo({ top, behavior: 'smooth' })
    } catch (e) {
      // Fallback: try scrollIntoView then nudge the page
      try {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTimeout(() => {
          window.scrollBy({ top: -30, left: 0, behavior: 'smooth' })
        }, 50)
      } catch (e2) {
        // Last-resort fallback: instant scroll without smooth
        const top2 = (target.getBoundingClientRect && target.getBoundingClientRect().top) || 0
        window.scrollTo({ top: window.scrollY + top2 - 30 })
      }
    }
  }

  async function startOnboarding() {
    showOnboarding.value = true
    // disable page scroll while onboarding is active
    try {
      document.body.style.overflow = 'hidden'
    } catch (e) {
      // ignore (server-side rendering or locked environment)
    }
    step.value = 0
    await nextTick()
    // Let layout settle
    setTimeout(scrollToCurrent, 50)
  }

  function skipOnboarding() {
    // End onboarding and restore scrolling
    showOnboarding.value = false
    try {
      document.body.style.overflow = ''
    } catch (e) {}
  }

  function nextStep() {
    if (isLastStep.value) {
      // finish onboarding
      showOnboarding.value = false
      // scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
      try {
        document.body.style.overflow = ''
      } catch (e) {}
      return
    }
    step.value += 1
    setTimeout(scrollToCurrent, 50)
  }

  const greeting = computed(() => {
    const today = new Date()
    const hour = today.getHours()
    let base = ''
    if (hour < 12) base = 'Buongiorno'
    else if (hour < 18) base = 'Buon pomeriggio'
    else base = 'Buona sera'
    return store.user && store.user.name ? `${base} ${store.user.name}` : base
  })

  onMounted(async () => {
    try {
      loading.value = true
      // Ensure profile is loaded if we only have a token
      if (!store.user && store.token) {
        await store.fetchProfile()
      }

      // first login --> lightweight guided scroll (use backend-provided flag)
      if (store.onboarding) {
        await startOnboarding()
        // Reset the flag so we don't show again on subsequent navigations in the same session
        store.onboarding = false
      }
    } finally {
      loading.value = false
    }
  })

  // ensure scrolling is restored if the component is destroyed while onboarding
  import { onUnmounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
  onUnmounted(() => {
    try {
      document.body.style.overflow = ''
    } catch (e) {}
  })
</script>
