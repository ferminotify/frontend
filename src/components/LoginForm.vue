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
                ref="pswInputRef"
              />
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
            <span class="material-symbols-outlined" aria-hidden="true">info</span> Fermi Notify non
            &egrave; un servizio ufficiale del Fermi: non &egrave; possibile accedere con l'account
            scolastico (di Moodle). Crea un nuovo account
            <a href="/register" style="text-decoration: underline">qui</a>.
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style src="@/assets/css/page.css"></style>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { loading, togglePasswordVisibility, initPasswordIconForEdge } from '@/utils/forms.js'
import { useAuthStore } from '@/stores/auth'
import { generateAlert } from '@/utils/alertbanner.js'

const submitBtnRef = ref(null)
const pswInputRef = ref(null)
const pswIconRef = ref(null)
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const router = useRouter()

async function onSubmit() {
  if (!submitBtnRef.value) return
  loading(submitBtnRef.value)
  try {
    await auth.login(email.value, password.value)
    await router.push('/dashboard')
  } catch (error) {
    // Normalize error handling; api/auth.js throws generic Error on !ok
    const status = error?.response?.status
    if (status === 404) {
      generateAlert(
        'error',
        `Non ci sono utenti registrati con l'email ${email.value}. Crea un account <a href="/register">qui</a>.`,
      )
    } else if (status === 401) {
      generateAlert('error', 'La password non è corretta.')
    } else {
      generateAlert('error', 'Si &egrave; verificato un errore. Riprova pi&ugrave; tardi.')
    }
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
