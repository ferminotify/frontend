<template>
  <div class="section flex-center-y">
    <img src="@/assets/icons/logo-long.svg" alt="Fermi Notify Logo" class="form-logo logo" />
    <div class="rounded-container" style="margin: 25px; width: min(100%, 450px)">
      <div class="rounded-inner">
        <!-- Moodle: school username and password, checked by the backend on the school site -->
        <form v-if="moodleMode" class="basic-form" @submit.prevent="onMoodleSubmit">
          <div class="moodle-head">
            <span class="moodle-icon material-symbols-outlined" aria-hidden="true">school</span>
            <h1 class="firstTitle">Accedi con Moodle</h1>
          </div>
          <div class="input-container">
            <div class="material-textfield">
              <input
                v-model="moodleUser"
                placeholder=" "
                type="text"
                required
                name="username"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                ref="moodleUserRef" />
              <label>Nome utente</label>
            </div>
          </div>
          <div class="input-container">
            <div class="material-textfield">
              <input
                v-model="moodlePassword"
                placeholder=" "
                type="password"
                required
                name="password"
                autocomplete="current-password"
                ref="moodlePswRef" />
              <label>Password</label>
              <span id="PSWShowHideIcon" @click="onToggleMoodlePsw">
                <span class="material-symbols-outlined" aria-hidden="true" ref="moodlePswIconRef">visibility_off</span>
              </span>
            </div>
          </div>
          <button class="btn filled submit-btn" ref="moodleBtnRef">Accedi</button>
          <div class="oauth-divider"><span>oppure</span></div>
          <button type="button" class="btn google-btn" @click="setMoodleMode(false)">
            <span class="material-symbols-outlined" aria-hidden="true">mail</span>
            <span>Accedi con email</span>
          </button>
        </form>

        <form v-else class="basic-form" @submit.prevent="onSubmit">
          <h1 class="firstTitle flex-center-x">Accedi</h1>
          <div class="input-container">
            <div class="material-textfield">
              <input v-model="email" placeholder=" " type="email" required name="email" />
              <label>Email</label>
            </div>
            <p class="firstSubtitle">
              Non hai un account?
              <RouterLink to="/register" class="link">Registrati</RouterLink>
            </p>
          </div>
          <div class="input-container">
            <div class="material-textfield">
              <input
                v-model="password"
                placeholder=" "
                type="password"
                required
                name="password"
                id="password"
                ref="pswInputRef" />
              <label>Password</label>
              <span id="PSWShowHideIcon" @click="onTogglePsw">
                <span class="material-symbols-outlined" aria-hidden="true" ref="pswIconRef">visibility_off</span>
              </span>
            </div>
            <p class="firstSubtitle">
              <RouterLink to="/password_reset" class="link">Password dimenticata?</RouterLink>
            </p>
          </div>
          <button class="btn filled submit-btn" ref="submitBtnRef">Accedi</button>
          <div class="oauth-divider"><span>oppure</span></div>
          <!-- Grouped: closer together than the form's 25px gap -->
          <div class="oauth-buttons">
            <button type="button" class="btn google-btn" @click="onGoogle">
              <font-awesome-icon :icon="['fab', 'google']" />
              <span>Continua con Google</span>
            </button>
            <button type="button" class="btn google-btn" @click="setMoodleMode(true)">
              <span class="material-symbols-outlined" aria-hidden="true">school</span>
              <span>Accedi con Moodle</span>
            </button>
          </div>
          <p style="font-size: 0.84rem; color: var(--muted)">
            <span class="material-symbols-outlined" aria-hidden="true">info</span>
            Fermi Notify non &egrave; un servizio ufficiale del Fermi.
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/page.css"></style>
<style scoped>
  /* One row: icon, then the title, aligned left */
  .moodle-head {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .moodle-head .firstTitle {
    margin: 0;
    text-align: left;
    font-size: 1.75rem; /* one line next to the icon on desktop; wraps on phones */
  }
  @media (max-width: 500px) {
    .moodle-head {
      gap: 12px;
    }
    .moodle-icon {
      width: 44px;
      height: 44px;
      font-size: 26px;
    }
  }
  .moodle-icon {
    flex: none;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--on-surface-primary) 14%, transparent);
    color: var(--on-surface-primary);
    font-size: 30px;
  }
  .oauth-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
</style>

<script setup>
  import { nextTick, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { togglePasswordVisibility, initPasswordIconForEdge } from '@/utils/forms.js'
  import { loading, saveBtnParams, resetLoading } from '@/utils/loading.js'
  import { useUserStore } from '@/stores/user'
  import { generateAlert } from '@/utils/alertbanner.js'
  import { consumeRedirect } from '@/utils/redirect.js'

  const submitBtnRef = ref(null)
  const pswInputRef = ref(null)
  const pswIconRef = ref(null)
  const user = useUserStore()
  const email = ref('')
  const password = ref('')
  const router = useRouter()
  const route = useRoute()
  const btnParams = ref(null)

  async function onSubmit() {
    if (!submitBtnRef.value) return
    if (!btnParams.value) btnParams.value = saveBtnParams(submitBtnRef.value)
    loading(submitBtnRef.value)
    try {
      await user.login(email.value, password.value)
      await router.push(consumeRedirect())
    } catch (error) {
      // Better normalization: handle network/CORS errors and backend messages
      const status = error?.response?.status
      const code = error?.response?.data?.code
      const backendMsg = error?.response?.data?.error || error?.response?.data?.message

      if (!error?.response) {
        // Network/CORS/timeout
        console.error('Login network error:', error)
        generateAlert('error', 'Impossibile contattare il server. Controlla la connessione e riprova.')
      } else if (status === 404) {
        generateAlert('error', {
          html: `Non ci sono utenti registrati con l'email ${email.value}. Crea un account <a href="/register" style="text-decoration: underline">qui</a>.`
        })
      } else if (code === 'google_only') {
        generateAlert('error', {
          html: `Questo account usa l'accesso con Google. Accedi con Google, oppure imposta una password <a href="/password_reset" style="text-decoration: underline">qui</a>.`
        })
      } else if (status === 401) {
        // Moodle accounts take the Moodle password here
        generateAlert('error', 'La password non è corretta.')
      } else if (backendMsg) {
        generateAlert('error', backendMsg)
      } else {
        generateAlert('error', 'Si è verificato un errore. Riprova più tardi.')
      }
      resetLoading(submitBtnRef.value, btnParams.value)
    }
  }

  function onTogglePsw() {
    togglePasswordVisibility(pswInputRef.value, pswIconRef.value)
  }

  // ------- Moodle -------
  const moodleMode = ref(route.query.moodle === '1')
  const moodleUser = ref('')
  const moodlePassword = ref('')
  const moodleUserRef = ref(null)
  const moodlePswRef = ref(null)
  const moodlePswIconRef = ref(null)
  const moodleBtnRef = ref(null)
  const moodleBtnParams = ref(null)

  async function setMoodleMode(on) {
    moodleMode.value = on
    await nextTick()
    if (on) {
      initPasswordIconForEdge(moodlePswIconRef.value)
      moodleUserRef.value?.focus()
    } else {
      initPasswordIconForEdge(pswIconRef.value)
    }
  }

  function onToggleMoodlePsw() {
    togglePasswordVisibility(moodlePswRef.value, moodlePswIconRef.value)
  }

  async function onMoodleSubmit() {
    if (!moodleBtnRef.value) return
    if (!moodleBtnParams.value) moodleBtnParams.value = saveBtnParams(moodleBtnRef.value)
    loading(moodleBtnRef.value)
    try {
      const { signup } = await user.loginWithMoodle(moodleUser.value.trim(), moodlePassword.value)
      moodlePassword.value = ''
      // New account: the profile step asks what the school site does not tell us.
      if (signup) await router.push({ name: 'complete-profile', query: { moodle: '1' } })
      else await router.push(consumeRedirect())
    } catch (error) {
      if (!error?.response) generateAlert('error', 'Impossibile contattare il server. Controlla la connessione e riprova.')
      else generateAlert('error', error.response.data?.error || 'Si è verificato un errore. Riprova più tardi.')
      resetLoading(moodleBtnRef.value, moodleBtnParams.value)
    }
  }

  function onGoogle() {
    user.loginWithGoogle()
  }

  function handleConfirmQuery() {
    const q = route.query || {}
    const error = typeof q.error === 'string' ? q.error : undefined
    const confirmError = typeof q.confirmError === 'string' ? q.confirmError : undefined
    const confirmed = q.confirmed === '1'

    if (error || confirmError) {
      generateAlert('error', error || confirmError)
      router.replace({ query: { ...q, error: undefined, confirmError: undefined } })
    } else if (confirmed) {
      generateAlert('success', 'Account confermato con successo! Ora puoi effettuare il login.')
      router.replace({ query: { ...q, confirmed: undefined } })
    }
  }

  onMounted(() => {
    // Hide the custom icon on Edge which auto-adds its own toggle
    initPasswordIconForEdge(moodleMode.value ? moodlePswIconRef.value : pswIconRef.value)
    handleConfirmQuery()
  })

  watch(
    () => [route.query?.error, route.query?.confirmError, route.query?.confirmed],
    () => handleConfirmQuery()
  )
</script>
