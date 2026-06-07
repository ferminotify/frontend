<template>
  <div class="sub-section">
    <h2>
      <span class="material-symbols-outlined">event_available</span>
      Calendario (iCal)
    </h2>
    <p style="margin-bottom: 15px">
      Aggiungi le tue variazioni al calendario del telefono (Google, Apple&hellip;). Si
      aggiornano da sole.
    </p>

    <div v-if="icalToken">
      <p class="telegramCodeContainer" @click="copyLink" style="cursor: pointer; word-break: break-all">
        <span class="material-symbols-outlined material-space-right" aria-hidden="true">content_copy</span>
        <code>{{ feedUrl }}</code>
      </p>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px">
        <a class="btn filled submit-btn" :href="webcalUrl">Aggiungi al calendario</a>
        <button class="btn outlined" @click="copyLink">Copia link</button>
        <button class="btn text" @click="onRegenerate" :disabled="regenerating">Rigenera link</button>
      </div>
      <p style="font-size: 0.84rem; color: var(--muted); margin-top: 12px">
        <span class="material-symbols-outlined" aria-hidden="true">info</span>
        Chiunque abbia questo link vede le tue variazioni. Se lo condividi per sbaglio,
        usa &laquo;Rigenera link&raquo;.
      </p>
    </div>
    <p v-else style="color: var(--on-surface-primary)">Caricamento&hellip;</p>
  </div>
</template>

<style scoped src="@/assets/css/dashboard.css"></style>

<script setup>
  import { computed, ref } from 'vue'
  import { useUserStore } from '@/stores/user'
  import { API_URL } from '@/utils/config'
  import { generateAlert } from '@/utils/alertbanner.js'

  const store = useUserStore()
  const regenerating = ref(false)

  const icalToken = computed(() => store.user?.ical_token || '')
  const feedUrl = computed(() => `${API_URL}/user/calendar/${icalToken.value}.ics`)
  // webcal:// makes the OS open the calendar app to subscribe directly.
  const webcalUrl = computed(() => feedUrl.value.replace(/^https?:\/\//, 'webcal://'))

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(feedUrl.value)
      generateAlert('success', 'Link copiato negli appunti!')
    } catch {
      generateAlert('error', 'Impossibile copiare il link.')
    }
  }

  async function onRegenerate() {
    if (regenerating.value) return
    regenerating.value = true
    try {
      await store.regenerateIcalToken()
      generateAlert('success', 'Link rigenerato. Il vecchio non funziona più.')
    } catch {
      generateAlert('error', 'Errore durante la rigenerazione. Riprova.')
    } finally {
      regenerating.value = false
    }
  }
</script>
