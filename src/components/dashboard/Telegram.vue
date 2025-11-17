<template>
  <div class="sub-section">
    <h2>
      <font-awesome-icon :icon="faTelegram" style="color: var(--on-surface-primary)" />
      Telegram
    </h2>
    <div id="telegram-inner">
      <!-- Not connected to Telegram -->
      <div v-if="!isTelegramConnected">
        <p style="margin-bottom: 20px">Ricevi la notifica tramite messaggio su Telegram.</p>
        <p>
          Per essere notificat{{ userGenderLetter }} su Telegram, manda
        </p>
        <p v-on:click="copy()" class="telegramCodeContainer">
          <span class="material-symbols-outlined material-space-right" aria-hidden="true" style="cursor: pointer;">
            content_copy
          </span>
          <span id="telegramCode">
            <code>{{ telegram }}</code>
          </span>
        </p>
        <p>
          a
          <b><a href="https://t.me/FermiNotifierBot" target="_blank" class="link">@FermiNotifierBot</a></b>
          .
        </p>
      </div>

      <!-- Connected to Telegram -->
      <div v-else>
        <p style="margin-bottom: 15px">
          Il tuo account telegram risulta correttamente collegato! (ID:
          <code>{{ telegram }}</code>
          )
        </p>
        <button class="btn filled submit-btn" @click="disconnectTelegram">Disconnetti</button>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/dashboard.css"></style>

<script setup>
  import { ref, computed } from 'vue'
  import { useUserStore } from '@/stores/user'
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
  import { faTelegram } from '@fortawesome/free-brands-svg-icons'
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { generateAlert } from '@/utils/alertbanner.js'
  import api from '@/api/axios'
  import { API_URL } from '@/utils/config'

  library.add(faTelegram)

  const store = useUserStore()
  const telegram = computed(() => store.user?.telegram || '')

  // use centralized store getter for gender letter
  const userGenderLetter = computed(() => store.genderLetter)

  // Check if telegram is connected (starts with a number instead of 'X')
  const isTelegramConnected = computed(() => {
    const tg = telegram.value
    return tg && tg.length > 0 && tg.charAt(0) !== 'X'
  })

  async function disconnectTelegram() {
    try {
      await api.post(`${API_URL}/user/telegram/disconnect`)
      await store.fetchProfile()
      generateAlert('success', 'Account Telegram disconnesso con successo!')
    } catch (err) {
      console.error('Failed to disconnect Telegram:', err)
      generateAlert('error', 'Si è verificato un errore. Riprova più tardi.')
    }
  }

  function copy() {
    const tgCode = telegram.value
    if (!tgCode) return
    navigator.clipboard.writeText(tgCode).then(
      () => {
        generateAlert('success', 'Codice copiato negli appunti!')
      },
      (err) => {
        console.error('Could not copy text: ', err)
        generateAlert('error', 'Non è stato possibile copiare il codice. Riprova più tardi.')
      }
    )
  }
</script>
