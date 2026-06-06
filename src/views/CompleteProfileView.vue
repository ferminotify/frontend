<template>
  <div class="section flex-center-y">
    <img src="@/assets/icons/logo-long.svg" alt="Fermi Notify Logo" class="form-logo logo" />
    <div class="rounded-container" style="margin: 25px; width: min(100%, 600px)">
      <div class="rounded-inner">
        <form class="basic-form" @submit.prevent="onSubmit">
          <h1 class="firstTitle flex-center-x">Completa il profilo</h1>
          <p class="firstSubtitle" style="text-align: center">
            Ci servono ancora un paio di informazioni per completare la registrazione.
          </p>
          <div class="two-inputs-container">
            <div class="material-textfield">
              <input v-model="name" placeholder=" " type="text" required name="name" />
              <label>Nome</label>
            </div>
            <div class="material-textfield">
              <input v-model="surname" placeholder=" " type="text" required name="surname" />
              <label>Cognome</label>
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

          <p class="firstSubtitle" style="margin-top: 10px">
            Imposta una password per abilitare l'accesso diretto tradizionale. Potrai sempre farlo in seguito da &laquo;Password dimenticata?&raquo;. <span class="pill">facoltativo</span>
          </p>
          <div class="input-container">
            <div class="material-textfield">
              <input
                v-model="password"
                placeholder=" "
                type="password"
                name="password"
                id="password"
                ref="pswInputRef"
                @input="onPasswordInput"
                @keyup="onPasswordInput" />
              <label>Password (facoltativa)</label>
              <span id="PSWShowHideIcon" @click="onTogglePsw">
                <span class="material-symbols-outlined" aria-hidden="true" ref="pswIconRef">visibility_off</span>
              </span>
              <p class="input-warning flex-y-center" v-show="showShort">
                <span class="material-symbols-outlined primary-text material-space-right">error</span>
                La password deve essere lunga almeno 6 caratteri
              </p>
            </div>
          </div>
          <div class="input-container" v-show="password.length > 0">
            <div class="material-textfield">
              <input
                v-model="password2"
                placeholder=" "
                type="password"
                name="password2"
                id="password2"
                @input="onConfirmInput"
                @keyup="onConfirmInput" />
              <label>Conferma password</label>
              <p class="input-warning flex-y-center" v-show="showMismatch">
                <span class="material-symbols-outlined primary-text material-space-right">error</span>
                Le password non corrispondono
              </p>
            </div>
          </div>

          <button class="btn filled submit-btn" ref="submitBtnRef" type="submit">Continua</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/page.css"></style>
<style scoped>
.pill{
  display: inline-block;
  background-color: var(--primary);
  color: white;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 9999px;
}
</style>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { togglePasswordVisibility, initPasswordIconForEdge } from '@/utils/forms.js'
  import { loading, saveBtnParams, resetLoading } from '@/utils/loading.js'
  import { generateAlert } from '@/utils/alertbanner.js'
  import { useUserStore } from '@/stores/user'

  const submitBtnRef = ref(null)
  const pswInputRef = ref(null)
  const pswIconRef = ref(null)
  const name = ref('')
  const surname = ref('')
  const gender = ref('')
  const password = ref('')
  const password2 = ref('')
  const showShort = ref(false)
  const showMismatch = ref(false)
  const user = useUserStore()
  const router = useRouter()
  const btnParams = ref(null)

  const passwordLong = computed(() => (password.value?.length || 0) >= 6)
  const passwordMatch = computed(() => password.value === password2.value)

  function onPasswordInput() {
    const len = password.value?.length || 0
    showShort.value = len > 0 && len < 6
    const confirmLen = password2.value?.length || 0
    showMismatch.value = confirmLen > 0 && password.value !== password2.value
  }

  function onConfirmInput() {
    const confirmLen = password2.value?.length || 0
    showMismatch.value = confirmLen > 0 && password.value !== password2.value
  }

  function onTogglePsw() {
    togglePasswordVisibility(pswInputRef.value, pswIconRef.value)
  }

  onMounted(async () => {
    initPasswordIconForEdge(pswIconRef.value)
    if (!user.user) {
      try {
        await user.fetchProfile()
      } catch {
        await router.replace({ name: 'login' })
        return
      }
    }
    // Profile already complete → nothing to do here.
    if (user.user?.profile_complete) {
      await router.replace({ name: 'dashboard' })
      return
    }
    name.value = user.user?.name || ''
    surname.value = user.user?.surname || ''
    // 'X' is the placeholder set at signup; treat it as "not chosen yet".
    gender.value = user.user?.gender && user.user.gender !== 'X' ? user.user.gender : ''
  })

  async function onSubmit() {
    if (!submitBtnRef.value) return
    if (!btnParams.value) btnParams.value = saveBtnParams(submitBtnRef.value)

    const n = name.value.trim()
    const s = surname.value.trim()
    if (!n || !s || !gender.value) {
      generateAlert('error', 'Compila tutti i campi!')
      return
    }
    // Password is optional, but if started it must be valid.
    if (password.value.length > 0) {
      if (!passwordLong.value) {
        generateAlert('error', 'La password deve essere almeno 6 caratteri!')
        return
      }
      if (!passwordMatch.value) {
        generateAlert('error', 'Le password non corrispondono!')
        return
      }
    }

    loading(submitBtnRef.value)
    try {
      await user.completeProfile({
        name: n,
        surname: s,
        gender: gender.value,
        password: password.value || undefined,
        password2: password2.value || undefined,
      })
      await router.replace({ name: 'dashboard' })
    } catch (error) {
      const msg = error?.response?.data?.error || 'Si è verificato un errore. Riprova più tardi.'
      generateAlert('error', msg)
      resetLoading(submitBtnRef.value, btnParams.value)
    }
  }
</script>
