<template>
  <form class="basic-form" id="form" @submit.prevent="onSubmit" autocomplete="off">
    <h1 class="firstTitle flex-center-x">Nuova password</h1>
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
        <span id="PSWShowHideIcon" @click="onTogglePsw">
          <span class="material-symbols-outlined" aria-hidden="true" ref="pswIconRef">visibility_off</span>
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
    <button class="btn filled submit-btn" ref="submitBtnRef">Continua</button>
  </form>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import axios from 'axios'
  import { API_URL } from '@/utils/config'
  import { loading, saveBtnParams, resetLoading } from '@/utils/loading.js'
  import { generateAlert } from '@/utils/alertbanner.js'
  import { togglePasswordVisibility, initPasswordIconForEdge } from '@/utils/forms.js'

  const props = defineProps({
    email: { type: String, required: true },
    otp: { type: String, required: true },
  })
  const emit = defineEmits(['completed'])

  // use `password` / `password2` (bound in the template)
  const submitBtnRef = ref(null)
  const pswInputRef = ref(null)
  const pswIconRef = ref(null)
  const password = ref('')
  const password2 = ref('')
  const showShort = ref(false)
  const showMismatch = ref(false)

  async function onSubmit() {
    if (password.value !== password2.value) {
      generateAlert('error', 'Le password non corrispondono')
      return
    }
    if (password.value.length < 6) {
      generateAlert('error', 'La password deve essere lunga almeno 6 caratteri')
      return
    }

    const btnParams = saveBtnParams(submitBtnRef.value)
    loading(submitBtnRef.value)
    try {
      const payload = {
        email: props.email,
        otp: props.otp,
        newPassword: password.value,
        newPassword2: password2.value,
      }
      const res = await axios.post(`${API_URL}/user/auth/new-change-password`, payload)
      if (res.status === 200) {
        emit('completed')
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Si è verificato un errore. Riprova più tardi.'
      generateAlert('error', msg)
    } finally {
      resetLoading(submitBtnRef.value, btnParams)
    }
  }

  function onTogglePsw() {
    togglePasswordVisibility(pswInputRef.value, pswIconRef.value)
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

  onMounted(() => {
    // Hide the custom icon on Edge which auto-adds its own toggle
    initPasswordIconForEdge(pswIconRef.value)
    // Initialize live validation state in case of prefilled values
    onPasswordInput()
    onConfirmInput()
  })
</script>
