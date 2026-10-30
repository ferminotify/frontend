<template>
  <div class="section flex-center-y">
    <img src="@/assets/icons/logo-long.svg" alt="Fermi Notify Logo" class="form-logo logo" />
    <div class="rounded-container" style="margin: 25px; width: min(100%, 480px)">
      <div class="rounded-inner">
        <form class="basic-form" @submit.prevent="onConfirm">
          <div class="us-head">
            <span class="us-icon material-symbols-outlined" aria-hidden="true">{{ done ? 'mark_email_read' : 'unsubscribe' }}</span>
            <h1 class="firstTitle">{{ done ? 'Email disattivate' : 'Disattiva le email' }}</h1>
          </div>
          <template v-if="invalid">
            <p class="us-text">Il link non è valido. Puoi cambiare le preferenze delle notifiche dalla Dashboard.</p>
            <RouterLink to="/dashboard" class="btn filled submit-btn us-link">Vai alla Dashboard</RouterLink>
          </template>
          <template v-else-if="done">
            <p class="us-text">
              Non riceverai più notifiche via email.<template v-if="telegram"> Le notifiche su Telegram restano attive.</template>
              Puoi riattivarle quando vuoi dalla Dashboard.
            </p>
            <RouterLink to="/dashboard" class="btn text submit-btn us-link">Vai alla Dashboard</RouterLink>
          </template>
          <template v-else>
            <p class="us-text">Non riceverai più le notifiche di Fermi Notify via email.</p>
            <button class="btn filled submit-btn" ref="submitBtnRef" type="submit">Disattiva le email</button>
          </template>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/page.css"></style>
<style scoped>
  .us-head {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .us-head .firstTitle {
    margin: 0;
    font-size: 1.75rem;
  }
  .us-icon {
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
  .us-text {
    margin: 0;
    line-height: 1.5;
  }
  .us-link {
    text-align: center;
    text-decoration: none;
  }
</style>

<script setup>
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { loading, saveBtnParams, resetLoading } from '@/utils/loading.js'
  import { generateAlert } from '@/utils/alertbanner.js'
  import { API_URL } from '@/utils/config'

  // Link from the email footer: /auth/unsubscribe?id=…&token=… (the backend's one-click URL too)
  const route = useRoute()
  const id = typeof route.query.id === 'string' ? route.query.id : ''
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  const invalid = ref(!/^\d+$/.test(id) || !token)
  const done = ref(false)
  const telegram = ref(false)
  const submitBtnRef = ref(null)
  let btnParams = null

  async function onConfirm() {
    if (!submitBtnRef.value) return
    btnParams ||= saveBtnParams(submitBtnRef.value)
    loading(submitBtnRef.value)
    try {
      const q = new URLSearchParams({ id, token })
      const res = await fetch(`${API_URL}/unsubscribe?${q}`, { method: 'POST', credentials: 'omit' })
      if (res.status === 400 || res.status === 404) {
        invalid.value = true
        return
      }
      if (!res.ok) throw new Error(`Errore ${res.status}`)
      telegram.value = Boolean((await res.json()).telegram)
      done.value = true
    } catch (error) {
      console.warn('Unsubscribe failed', error)
      generateAlert('error', 'Si è verificato un errore. Riprova più tardi.')
      resetLoading(submitBtnRef.value, btnParams)
    }
  }
</script>
