.
<template>
  <form class="basic-form" id="form" @submit.prevent="onSubmit" autocomplete="off">
    <h1 class="firstTitle flex-center-x">Verifica OTP</h1>
    <div class="input-container">
      <p class="firstSubtitle mb-10px" style="text-align: center">Inserisci il codice OTP ricevuto via email</p>
      <div class="otp-input-fields inputs">
        <input
          required
          class="otp-input"
          type="text"
          maxlength="1"
          id="otp1"
          @input="onInput($event, 1)"
          @keydown="onKeyDown($event, 1)"
          @focus="onFocus($event)"
          @paste="onPaste($event, 1)"
          v-model="otp1" />
        <input
          required
          class="otp-input"
          type="text"
          maxlength="1"
          id="otp2"
          @input="onInput($event, 2)"
          @keydown="onKeyDown($event, 2)"
          @focus="onFocus($event)"
          @paste="onPaste($event, 2)"
          v-model="otp2" />
        <input
          required
          class="otp-input"
          type="text"
          maxlength="1"
          id="otp3"
          @input="onInput($event, 3)"
          @keydown="onKeyDown($event, 3)"
          @focus="onFocus($event)"
          @paste="onPaste($event, 3)"
          v-model="otp3" />
        <input
          required
          class="otp-input"
          type="text"
          maxlength="1"
          id="otp4"
          @input="onInput($event, 4)"
          @keydown="onKeyDown($event, 4)"
          @focus="onFocus($event)"
          @paste="onPaste($event, 4)"
          v-model="otp4" />
        <input
          required
          class="otp-input"
          type="text"
          maxlength="1"
          id="otp5"
          @input="onInput($event, 5)"
          @keydown="onKeyDown($event, 5)"
          @focus="onFocus($event)"
          @paste="onPaste($event, 5)"
          v-model="otp5" />
        <input
          required
          class="otp-input"
          type="text"
          maxlength="1"
          id="otp6"
          @input="onInput($event, 6)"
          @keydown="onKeyDown($event, 6)"
          @focus="onFocus($event)"
          @paste="onPaste($event, 6)"
          v-model="otp6" />
      </div>
    </div>
    <button class="btn filled submit-btn" ref="submitBtnRef">Continua</button>
  </form>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import axios from 'axios'
  import { API_URL } from '@/utils/config'
  import { loading, saveBtnParams, resetLoading } from '@/utils/loading.js'
  import { generateAlert } from '@/utils/alertbanner.js'

  const props = defineProps({
    email: { type: String, required: true },
  })
  const emit = defineEmits(['verified'])

  const submitBtnRef = ref(null)

  const otp1 = ref('')
  const otp2 = ref('')
  const otp3 = ref('')
  const otp4 = ref('')
  const otp5 = ref('')
  const otp6 = ref('')

  // map for indexed access without eval
  const otpMap = {
    1: otp1,
    2: otp2,
    3: otp3,
    4: otp4,
    5: otp5,
    6: otp6,
  }

  function onInput(event, index) {
    // keep a single uppercase character
    let v = (event.target.value || '').toString().toUpperCase().replace(/\s+/g, '')
    v = v.slice(0, 1)
    otpMap[index].value = v
    if (v.length === 1 && index < 6) {
      const next = document.getElementById(`otp${index + 1}`)
      if (next) next.focus()
    }
  }

  function onFocus(event /*, index */) {
    // select existing content so typing overwrites it
    try {
      event.target.select()
    } catch (e) {
      // ignore
    }
  }

  function onKeyDown(event, index) {
    const key = event.key
    if (key === 'Backspace') {
      // if current is empty, go back
      if ((otpMap[index].value || '').length === 0 && index > 1) {
        const prev = document.getElementById(`otp${index - 1}`)
        if (prev) {
          prev.focus()
          // also clear previous so typing will overwrite
          otpMap[index - 1].value = ''
        }
      }
    }
  }

  function onPaste(event, index) {
    event.preventDefault()
    const paste = (event.clipboardData || window.clipboardData).getData('text') || ''
    const cleaned = paste.replace(/\s+/g, '').toUpperCase()
    for (let i = 0; i < cleaned.length && index + i <= 6; i++) {
      const char = cleaned[i]
      otpMap[index + i].value = char
      const el = document.getElementById(`otp${index + i}`)
      if (el) el.value = char
    }
    // focus the next empty or last
    for (let j = index; j <= 6; j++) {
      if ((otpMap[j].value || '').length === 0) {
        const el = document.getElementById(`otp${j}`)
        if (el) { el.focus(); return }
      }
    }
    const last = document.getElementById('otp6')
    if (last) last.focus()
  }

  async function onSubmit() {
    const btnParams = saveBtnParams(submitBtnRef.value)
    loading(submitBtnRef.value)

    const otp = otp1.value + otp2.value + otp3.value + otp4.value + otp5.value + otp6.value

    try {
      const payload = { email: props.email, otp: otp.trim().toUpperCase() }
      const res = await axios.post(`${API_URL}/user/auth/otp-change-password`, payload)
      if (res.status === 200) {
        emit('verified', payload.otp)
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Si è verificato un errore. Riprova più tardi.'
      generateAlert('error', msg)
    } finally {
      resetLoading(submitBtnRef.value, btnParams)
    }
  }
</script>

<style scoped>
  input {
    width: calc(100% - 30px);
    padding: 15px;
    margin: 5px 0 0 0;
    display: inline-block;
    border: none;
    border-radius: 10px;
    border: 1px solid #dadce0;
    background: #fff;
    height: 18px;
  }
  input:focus {
    outline-color: var(--primary);
    background-color: #fff;
  }
  .otp-input-fields {
    margin: auto;
    width: auto;
    max-width: 350px;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
  }
  .otp-input-fields input {
    height: auto;
    width: 30%;
    aspect-ratio: 1/1;
    border-radius: 4px;
    text-align: center;
    font-size: 16px;
    background-color: #fff;
    text-transform: uppercase;
  }
  .otp-input-fields input::-webkit-outer-spin-button,
  .otp-input-fields input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
</style>
