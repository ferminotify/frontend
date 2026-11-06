<template>
  <div class="section flex-center-y">
    <img src="@/assets/icons/logo-long.svg" alt="Fermi Notify Logo" class="form-logo logo" />
    <div class="rounded-container" style="margin: 25px; width: min(100%, 480px)">
      <div class="rounded-inner">
        <!-- A button, not on load: mail scanners open links, only the owner confirms -->
        <form class="basic-form" @submit.prevent="onConfirm">
          <div class="lm-head">
            <span class="lm-icon material-symbols-outlined" aria-hidden="true">link</span>
            <h1 class="firstTitle">Collega Moodle</h1>
          </div>
          <p v-if="info" class="lm-text">
            Collega l’account Moodle <strong>{{ info.schoolUsername }}</strong> al tuo account Fermi Notify: potrai accedere anche con
            Moodle.
          </p>
          <p v-else-if="invalid" class="lm-text">{{ invalid }}</p>
          <button v-if="info" class="btn filled submit-btn" ref="submitBtnRef" type="submit">Collega</button>
          <RouterLink v-else-if="invalid" to="/login?moodle=1" class="btn filled submit-btn lm-link">Accedi con Moodle</RouterLink>
          <p v-if="info" class="lm-note">Non sei stato tu? Chiudi questa pagina: il tuo account resta com’è.</p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/page.css"></style>
<style scoped>
  .lm-head {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .lm-head .firstTitle {
    margin: 0;
    font-size: 1.75rem;
  }
  .lm-icon {
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
  .lm-text {
    margin: 0;
    line-height: 1.5;
  }
  .lm-note {
    margin: 0;
    color: var(--muted);
    font-size: 0.8125rem;
  }
  .lm-link {
    text-align: center;
    text-decoration: none;
  }
</style>

<script setup>
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { loading, saveBtnParams, resetLoading } from '@/utils/loading.js'
  import { generateAlert } from '@/utils/alertbanner.js'
  import { useUserStore } from '@/stores/user'

  const route = useRoute()
  const router = useRouter()
  const user = useUserStore()
  const token = typeof route.query.t === 'string' ? route.query.t : ''
  const info = ref(null)
  const invalid = ref('')
  const submitBtnRef = ref(null)
  let btnParams = null

  const INVALID = 'Link scaduto o non valido: accedi di nuovo con Moodle per riceverne uno nuovo.'

  onMounted(async () => {
    if (!token) {
      invalid.value = INVALID
      return
    }
    try {
      info.value = await user.moodleLinkInfo(token)
    } catch {
      invalid.value = INVALID
    }
  })

  async function onConfirm() {
    if (!submitBtnRef.value) return
    btnParams ||= saveBtnParams(submitBtnRef.value)
    loading(submitBtnRef.value)
    try {
      await user.linkMoodle(token)
      generateAlert('success', 'Moodle collegato! Ora puoi accedere anche con Moodle.')
      await router.replace('/dashboard')
    } catch (error) {
      generateAlert('error', error?.response?.data?.error || 'Si è verificato un errore. Riprova più tardi.')
      resetLoading(submitBtnRef.value, btnParams)
    }
  }
</script>
