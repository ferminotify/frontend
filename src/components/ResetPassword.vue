<template>
  <div class="section flex-center-y">
    <img src="@/assets/icons/logo-long.svg" alt="Fermi Notify Logo" class="form-logo logo" />
    <div class="rounded-container" style="margin: 25px; width: min(100%, 475px)">
      <div class="rounded-inner">
        <Request v-if="step === 1" @next-step="onEmailSubmitted" />
        <OTP v-else-if="step === 2" :email="savedEmail" @verified="onOtpVerified" />
        <NewPassword v-else-if="step === 3" :email="savedEmail" :otp="savedOtp" @completed="onCompleted" />
      </div>
    </div>
  </div>
</template>

<style src="@/assets/css/page.css"></style>

<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { generateAlert } from '@/utils/alertbanner.js'
  import Request from './change-psw/Request.vue'
  import OTP from './change-psw/OTP.vue'
  import NewPassword from './change-psw/NewPassword.vue'

  /*
  STEPS:
  1. email
  2. OTP
  3. new password
  */
  const router = useRouter()
  const step = ref(1)
  const savedEmail = ref('')
  const savedOtp = ref('')

  function onEmailSubmitted(email) {
    savedEmail.value = email
    step.value = 2
  }

  function onOtpVerified(otp) {
    savedOtp.value = otp
    step.value = 3
  }

  function onCompleted() {
    // Show a success banner and send the user to login
    generateAlert('success', 'Password cambiata con successo. Accedi con la nuova password.')
    router.push({ name: 'login' })
  }
</script>
