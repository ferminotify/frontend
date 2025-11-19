<template>
  <form class="basic-form" id="form" @submit.prevent="onSubmit" autocomplete="off">
    <h1 class="firstTitle flex-center-x">Reset password</h1>
    <div class="input-container">
      <p class="firstSubtitle mb-10px" style="text-align: center">
        Inserisci la email che hai utilizzato per registrarti
      </p>
      <div class="material-textfield">
        <input placeholder="" type="email" required name="user_email" v-model="email" />
        <label>Email</label>
      </div>
    </div>
    <button class="btn filled submit-btn" ref="submitBtnRef">Continua</button>
  </form>
</template>

<script setup>
  import { ref } from 'vue'
  import { loading, saveBtnParams, resetLoading } from '@/utils/loading.js'
  import { generateAlert } from '@/utils/alertbanner.js'
  import { useUserStore } from '@/stores/user.js'

  const store = useUserStore()
  const emit = defineEmits(['next-step'])

  const submitBtnRef = ref(null)
  const email = ref('')

  async function onSubmit() {
    const btnParams = saveBtnParams(submitBtnRef.value)
    loading(submitBtnRef.value)
    try {
      const res = await store.requestPasswordReset(email.value)
      generateAlert(
        'success',
        res.message || 'Ti abbiamo inviato un codice per reimpostare la password. Controlla anche lo SPAM.'
      )
      emit('next-step', email.value)
    } catch (err) {
      generateAlert('error', err.message || 'Si è verificato un errore. Riprova più tardi.')
    } finally {
      resetLoading(submitBtnRef.value, btnParams)
    }
  }
</script>
