<template>
  <div class="section flex-center-y">
    <img src="@/assets/icons/logo-long.svg" alt="Fermi Notify Logo" class="form-logo logo" />
    <div class="rounded-container" style="margin: 25px; width: min(100%, 450px)">
      <div class="rounded-inner">
        <form class="basic-form" @submit.prevent="onSubmit">
          <h1 class="firstTitle flex-center-x">Accedi</h1>
          <div class="input-container">
            <div class="material-textfield">
              <input v-model="email" placeholder="" type="email" required name="email" />
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
                placeholder=""
                type="password"
                required
                name="password"
                id="password"
                ref="pswInputRef" />
              <label>Password</label>
              <span id="PSWShowHideIcon" ref="pswIconRef" @click="onTogglePsw">
                <span class="material-symbols-outlined" aria-hidden="true">visibility_off</span>
              </span>
            </div>
            <p class="firstSubtitle">
              <a href="/password_reset" class="link">Password dimenticata?</a>
            </p>
          </div>
          <button class="btn filled submit-btn" ref="submitBtnRef">Accedi</button>
          <p style="font-size: 0.84rem; color: var(--muted)">
            <span class="material-symbols-outlined" aria-hidden="true">info</span>
            Fermi Notify non &egrave; un servizio ufficiale del Fermi: non &egrave; possibile accedere con l'account
            scolastico (di Moodle). Crea un nuovo account
            <a href="/register" style="text-decoration: underline">qui</a>
            .
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/page.css"></style>

<script setup>
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    loading,
    togglePasswordVisibility,
    initPasswordIconForEdge,
    saveBtnParams,
    resetLoading,
  } from '@/utils/forms.js'
  import { useUserStore } from '@/stores/user'
  import { generateAlert } from '@/utils/alertbanner.js'

  const submitBtnRef = ref(null)
  const pswInputRef = ref(null)
  const pswIconRef = ref(null)
  const user = useUserStore()
  const email = ref('')
  const password = ref('')
  const router = useRouter()
  const btnParams = ref(null)

  async function onSubmit() {
    if (!submitBtnRef.value) return
    if (!btnParams.value) btnParams.value = saveBtnParams(submitBtnRef.value)
    loading(submitBtnRef.value)
    try {
      await user.login(email.value, password.value)
      await router.push('/dashboard')
    } catch (error) {
      // Better normalization: handle network/CORS errors and backend messages
      const status = error?.response?.status
      const backendMsg = error?.response?.data?.error || error?.response?.data?.message

      if (!error?.response) {
        // Network/CORS/timeout
        console.error('Login network error:', error)
        generateAlert('error', 'Impossibile contattare il server. Controlla la connessione e riprova.')
      } else if (status === 404) {
        generateAlert(
          'error',
          `Non ci sono utenti registrati con l'email ${email.value}. Crea un account <a href="/register">qui</a>.`
        )
      } else if (status === 401) {
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

  onMounted(() => {
    // Hide the custom icon on Edge which auto-adds its own toggle
    initPasswordIconForEdge(pswIconRef.value)
  })
</script>
