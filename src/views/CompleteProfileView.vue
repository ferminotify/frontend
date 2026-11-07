<template>
  <div class="section flex-center-y">
    <img src="@/assets/icons/logo-long.svg" alt="Fermi Notify Logo" class="form-logo logo" />
    <div class="rounded-container" style="margin: 25px; width: min(100%, 480px)">
      <div class="rounded-inner">
        <form class="basic-form" @submit.prevent="onSubmit">
          <div class="cp-head">
            <span class="cp-icon material-symbols-outlined" aria-hidden="true">{{ moodle ? 'school' : 'person' }}</span>
            <h1 class="firstTitle">Completa il profilo</h1>
          </div>

          <div class="cp-names">
            <div class="material-textfield">
              <input v-model="name" placeholder=" " type="text" required name="name" autocomplete="given-name" />
              <label>Nome</label>
            </div>
            <div class="material-textfield">
              <input v-model="surname" placeholder=" " type="text" required name="surname" autocomplete="family-name" />
              <label>Cognome</label>
            </div>
          </div>
          <div class="select">
            <select class="select-text" required name="gender" v-model="gender">
              <option selected value="" style="display: none" disabled></option>
              <option id="F" value="F">Donna (F)</option>
              <option id="M" value="M">Uomo (M)</option>
              <option id="X" value="X">Altro (ǝ)</option>
            </select>
            <label class="select-label">Genere</label>
          </div>
          <SignupKeywordField v-model="keywords" class="cp-keyword" />

          <!-- Moodle signup: the school site gives no address, and notifications need one -->
          <div v-if="moodle" class="cp-field">
            <div class="material-textfield">
              <input v-model="email" placeholder=" " type="email" required name="email" autocomplete="email" />
              <label>Email</label>
            </div>
            <p v-if="pendingEmail" class="cp-hint">
              Non hai ancora confermato l'email: il link è stato inviato a <b>{{ pendingEmail }}</b>. Se è sbagliata,
              inseriscine un'altra; altrimenti riscrivila per ricevere un nuovo link.
            </p>
          </div>

          <!-- Google signup: optional password for email + password login too -->
          <div class="material-textfield" v-if="!moodle">
            <input
              v-model="password"
              placeholder=" "
              type="password"
              name="password"
              id="password"
              autocomplete="new-password"
              ref="pswInputRef"
              @input="onPasswordInput"
              @keyup="onPasswordInput" />
            <label>Password (opzionale)</label>
            <span id="PSWShowHideIcon" @click="onTogglePsw">
              <span class="material-symbols-outlined" aria-hidden="true" ref="pswIconRef">visibility_off</span>
            </span>
            <p class="input-warning flex-y-center" v-show="showShort">
              <span class="material-symbols-outlined primary-text material-space-right">error</span>
              La password deve essere lunga almeno 6 caratteri
            </p>
          </div>
          <div class="material-textfield" v-show="password.length > 0" v-if="!moodle">
            <input
              v-model="password2"
              placeholder=" "
              type="password"
              name="password2"
              id="password2"
              autocomplete="new-password"
              @input="onConfirmInput"
              @keyup="onConfirmInput" />
            <label>Conferma password</label>
            <p class="input-warning flex-y-center" v-show="showMismatch">
              <span class="material-symbols-outlined primary-text material-space-right">error</span>
              Le password non corrispondono
            </p>
          </div>

          <button class="btn filled submit-btn" ref="submitBtnRef" type="submit">{{ moodle ? 'Crea account' : 'Continua' }}</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/page.css"></style>
<style scoped>
  .cp-head {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .cp-head .firstTitle {
    margin: 0;
    font-size: 1.75rem;
  }
  .cp-icon {
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
  .cp-names {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }
  .cp-names input,
  .cp-field input,
  .cp-keyword :deep(input) {
    width: 100%;
    box-sizing: border-box;
  }
  .select {
    width: 100%; /* page.css trims it to line up with older inputs; here inputs are full width */
  }
  .cp-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .cp-hint {
    margin: 0;
    color: var(--muted);
    font-size: 0.8125rem;
    line-height: 1.4;
  }
  @media (max-width: 500px) {
    .cp-names {
      grid-template-columns: 1fr; /* phones: one per line, room to type */
    }
    .cp-icon {
      width: 44px;
      height: 44px;
      font-size: 26px;
    }
  }
</style>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { togglePasswordVisibility, initPasswordIconForEdge } from '@/utils/forms.js'
  import { loading, saveBtnParams, resetLoading } from '@/utils/loading.js'
  import { consumeRedirect } from '@/utils/redirect.js'
  import { generateAlert } from '@/utils/alertbanner.js'
  import { useUserStore } from '@/stores/user'
  import SignupKeywordField from '@/components/common/SignupKeywordField.vue'

  const submitBtnRef = ref(null)
  const pswInputRef = ref(null)
  const pswIconRef = ref(null)
  const name = ref('')
  const surname = ref('')
  const gender = ref('')
  const keywords = ref([])
  const password = ref('')
  const password2 = ref('')
  const showShort = ref(false)
  const showMismatch = ref(false)
  const user = useUserStore()
  const router = useRouter()
  const route = useRoute()
  // Signing up with Moodle: no account yet, it is created on submit (see stores/user.js).
  const moodle = route.query.moodle === '1'
  const email = ref('')
  const pendingEmail = ref('') // masked: the address of a signup not confirmed yet
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
    if (moodle) {
      if (!user.hasMoodleSignup()) {
        generateAlert('error', 'Accesso con Moodle scaduto, accedi di nuovo.')
        await router.replace({ name: 'login', query: { moodle: '1' } })
        return
      }
      const pending = user.moodlePendingSignup()
      if (pending) {
        name.value = pending.name || ''
        surname.value = pending.surname || ''
        gender.value = pending.gender && pending.gender !== 'X' ? pending.gender : ''
        pendingEmail.value = pending.email || ''
      }
      return
    }
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
      await router.replace(consumeRedirect())
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
    if (!n || !s || !gender.value || !keywords.value.length) {
      generateAlert('error', 'Compila tutti i campi!')
      return
    }
    if (moodle) {
      const e = email.value.trim()
      if (!e) {
        generateAlert('error', 'Compila tutti i campi!')
        return
      }
      loading(submitBtnRef.value)
      try {
        const resumed = Boolean(pendingEmail.value)
        const result = await user.completeMoodleSignup({ name: n, surname: s, gender: gender.value, email: e, keywords: keywords.value })
        if (result?.linkSent) {
          generateAlert('success', 'Questa email ha già un account: ti abbiamo inviato un link per collegarlo a Moodle (controlla anche lo SPAM).')
          await router.replace({ name: 'login' })
          return
        }
        generateAlert(
          'success',
          resumed
            ? 'Ti abbiamo inviato un nuovo link a questa email: confermala, poi accedi con Moodle (controlla anche lo SPAM).'
            : 'Account creato! Conferma l’email con il link che ti abbiamo inviato, poi accedi con Moodle (controlla anche lo SPAM).'
        )
        await router.replace({ name: 'login', query: { moodle: '1' } })
      } catch (error) {
        const data = error?.response?.data || {}
        generateAlert('error', data.error || 'Si è verificato un errore. Riprova più tardi.')
        resetLoading(submitBtnRef.value, btnParams.value)
        if (data.code === 'moodle_signup_expired' || data.code === 'moodle_taken') {
          await router.replace({ name: 'login', query: { moodle: '1' } })
        }
      }
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
        keywords: keywords.value,
        password: password.value || undefined,
        password2: password2.value || undefined,
      })
      await router.replace(consumeRedirect())
    } catch (error) {
      const msg = error?.response?.data?.error || 'Si è verificato un errore. Riprova più tardi.'
      generateAlert('error', msg)
      resetLoading(submitBtnRef.value, btnParams.value)
    }
  }
</script>
