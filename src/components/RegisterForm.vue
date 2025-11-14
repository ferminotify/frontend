<template>
  <div class="section flex-center-y">
    <img src="@/assets/icons/logo-long.svg" alt="Fermi Notify Logo" class="form-logo logo" />
    <div class="rounded-container" style="margin: 25px; width: min(100%, 600px)">
      <div class="rounded-inner">
        <form class="basic-form" @submit.prevent="onSubmit">
          <h1 class="firstTitle flex-center-x">Registrazione</h1>
          <div class="two-inputs-container">
            <div class="material-textfield">
              <input v-model="name" placeholder="" type="text" required name="name" />
              <label>Nome</label>
            </div>
            <div class="material-textfield">
              <input v-model="surname" placeholder="" type="text" required name="surname" />
              <label>Cognome</label>
            </div>
          </div>
          <div class="input-container">
            <div class="material-textfield">
              <input v-model="email" placeholder="" type="email" required name="email" />
              <label>Email</label>
            </div>
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
                @input="onPasswordInput"
                @keyup="onPasswordInput" />
              <label>Password</label>
              <span id="PSWShowHideIcon" ref="pswIconRef" @click="onTogglePsw">
                <span class="material-symbols-outlined" aria-hidden="true">visibility_off</span>
              </span>
              <p class="input-warning flex-y-center" id="psw-corta" v-show="showShort">
                <span class="material-symbols-outlined primary-text material-space-right">error</span>
                La password deve essere lunga almeno 6 caratteri
              </p>
            </div>
          </div>
          <div class="input-container">
            <div class="material-textfield">
              <input
                v-model="password2"
                placeholder=""
                type="password"
                required
                name="password2"
                id="password2"
                @input="onConfirmInput"
                @keyup="onConfirmInput" />
              <label>Conferma password</label>
              <p class="input-warning flex-y-center" id="psw-non-corrispondono" v-show="showMismatch">
                <span class="material-symbols-outlined primary-text material-space-right">error</span>
                Le password non corrispondono
              </p>
            </div>
          </div>
          <div class="input-container">
            <div class="select">
              <select class="select-text" required name="gender" v-model="gender">
                <option selected value="" style="display: none" disabled></option>
                <option id="F" value="F">Donna (F)</option>
                <option id="M" value="M">Uomo (M)</option>
                <option id="X" value="X">Altro (ǝ)</option>
              </select>
              <label class="select-label">Genere</label>
            </div>
          </div>
          <button class="btn filled submit-btn" ref="submitBtnRef" type="submit">Registrati</button>
          <p style="font-size: 0.84rem; color: var(--muted)">
            <span class="material-symbols-outlined" aria-hidden="true">info</span>
            Conserviamo le tue informazioni in modo sicuro e crittografato, consulta la nostra
            <RouterLink
              :to="{ name: 'faq', query: { page: 'privacy' } }"
              style="color: var(--muted); text-decoration: underline">
              informativa privacy
            </RouterLink>
            per ulteriori dettagli.
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/page.css"></style>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    loading,
    togglePasswordVisibility,
    initPasswordIconForEdge,
    saveBtnParams,
    resetLoading,
  } from '@/utils/forms.js'
  import { generateAlert } from '@/utils/alertbanner.js'

  const submitBtnRef = ref(null)
  const pswInputRef = ref(null)
  const pswIconRef = ref(null)
  const name = ref('')
  const surname = ref('')
  const email = ref('')
  const password = ref('')
  const password2 = ref('')
  const gender = ref('')
  const router = useRouter()
  const btnParams = ref(null)
  const showShort = ref(false)
  const showMismatch = ref(false)

  const passwordLong = computed(() => (password.value?.length || 0) >= 6)
  const passwordMatch = computed(() => password.value === password2.value && (password2.value?.length || 0) > 0)

  function serialize() {
    return {
      name: name.value.trim(),
      surname: surname.value.trim(),
      email: email.value.trim(),
      password: password.value,
      password2: password2.value,
      gender: gender.value,
    }
  }

  function onPasswordInput() {
    const len = password.value?.length || 0
    showShort.value = len > 0 && len < 6
    // If the user already typed confirmation, update mismatch live too
    const confirmLen = password2.value?.length || 0
    showMismatch.value = confirmLen > 0 && password.value !== password2.value
  }

  function onConfirmInput() {
    const confirmLen = password2.value?.length || 0
    showMismatch.value = confirmLen > 0 && password.value !== password2.value
  }

  async function onSubmit() {
    if (!submitBtnRef.value) return
    if (!btnParams.value) btnParams.value = saveBtnParams(submitBtnRef.value)
    loading(submitBtnRef.value)
    try {
      const data = serialize()
      if (!data.name || !data.surname || !data.email || !data.password || !data.password2 || !data.gender) {
        generateAlert('error', 'Compila tutti i campi!')
        resetLoading(submitBtnRef.value, btnParams.value)
        return
      }
      if (!passwordLong.value) {
        generateAlert('error', 'La password deve essere almeno 6 caratteri!')
        resetLoading(submitBtnRef.value, btnParams.value)
        return
      }
      if (!passwordMatch.value) {
        generateAlert('error', 'Le password non corrispondono!')
        resetLoading(submitBtnRef.value, btnParams.value)
        return
      }

      // TODO: implement actual registration API; for now, simulate success
      generateAlert('success', 'Registrazione completata!')
      resetLoading(submitBtnRef.value, btnParams.value)
      // Example success:
      // await auth.register(data)
      // await router.push('/dashboard')
    } catch (error) {
      generateAlert('error', 'Si &egrave; verificato un errore. Riprova pi&ugrave; tardi.')
      resetLoading(submitBtnRef.value, btnParams.value)
    }
  }

  function onTogglePsw() {
    togglePasswordVisibility(pswInputRef.value, pswIconRef.value)
  }

  onMounted(() => {
    // Hide the custom icon on Edge which auto-adds its own toggle
    initPasswordIconForEdge(pswIconRef.value)
    // Initialize live validation state in case of prefilled values
    onPasswordInput()
    onConfirmInput()
  })
</script>
