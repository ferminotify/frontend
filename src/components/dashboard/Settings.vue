<template>
  <div class="sub-section">
    <h2>
      <font-awesome-icon :icon="faGear" style="color: var(--on-surface-primary)" />
      Impostazioni
    </h2>

    <div class="impostazioni-container">
      <!-- Notification Channels -->
      <div class="invioNotificheContainer impostazioni-sect" id="canali">
        <p style="padding-bottom: 10px">
          <font-awesome-icon :icon="faMessage" class="primary-text" />
          <span>Canali notifiche</span>
        </p>
        <div class="checkNot-container sendEmail">
          Email
          <label class="switch">
            <input
              type="checkbox"
              v-model="preferences.email"
              @change="updatePreferences"
              class="checkbox"
              id="sendEmail" />
            <span class="slider round"></span>
          </label>
        </div>
        <div v-if="hasTelegram" class="checkNot-container sendTelegram">
          Telegram
          <label class="switch">
            <input
              type="checkbox"
              v-model="preferences.telegram"
              @change="updatePreferences"
              class="checkbox"
              id="sendTelegram" />
            <span class="slider round"></span>
          </label>
        </div>
      </div>

      <!-- Probable Variations -->
      <div class="impostazioni-sect invioNotificheContainer" id="variazioni" style="padding-bottom: 15px">
        <p style="padding-bottom: 10px">
          <font-awesome-icon :icon="faBell" class="primary-text" />
          <span>Variazioni dell'orario</span>
        </p>
        <div class="checkNot-container sendEmail" style="display: flex; align-items: flex-start">
          Invia variazioni probabili
          <label class="switch">
            <input id="sendSimilar" type="checkbox" v-model="includeSimilar" @change="toggleSimilar" class="checkbox" />
            <span class="slider round"></span>
          </label>
        </div>
        <p style="font-size: 12px; color: var(--on-surface)">
          Ricevi notifiche anche delle variazioni dell'orario che potrebbero essere associate alle tue keyword.
        </p>
        <p style="font-size: 12px; color: var(--on-surface)">
          <font-awesome-icon :icon="faArrowRight" />
          Esempio: con keyword
          <code>5 CIN</code>
          invia le variazioni sulla
          <code>5CIIN</code>
          .
        </p>
        <p style="font-size: 12px; color: var(--on-surface)">
          Utile per includere le variazioni con errori di battitura.
        </p>
      </div>

      <!-- Notification Time -->
      <div
        class="invioNotificheContainer impostazioni-sect"
        id="orario"
        style="position: relative; padding-bottom: 10px">
        <p style="padding-bottom: 10px; border-bottom: 1px solid var(--on-surface)">
          <font-awesome-icon :icon="faClock" class="primary-text" />
          <span>Orario Daily Notification</span>
        </p>

        <div class="notTime" style="margin: 10px 0">
          <div class="giorno">
            <label for="day">Giorno</label>
            <div class="flex-y-center">
              <select class="dashboard-select" v-model="notificationDay" :disabled="!isEditingTime">
                <option value="false">Alla mattina</option>
                <option value="true">Il giorno prima</option>
              </select>
            </div>
          </div>

          <div class="ora">
            <label>Ora</label>
            <div class="flex-y-center">
              <input
                type="text"
                ref="timepickerInput"
                class="dashboard-input dashboard-time"
                :disabled="!isEditingTime"
                style="width: 120px"
                readonly />
            </div>
          </div>

          <div class="dashboard-edit-btn-container">
            <div v-if="!isEditingTime" class="dashboard-toEdit-btns dashboard-toEdit-btns-notTime flex-y-center">
              <a class="btn text notTime-edit-btn" @click="startEditTime">
                <font-awesome-icon :icon="faPen" />
              </a>
            </div>
            <div v-else class="dashboard-editing-btns dashboard-editing-btns-notTime" style="display: flex">
              <button class="btn text" @click="cancelEditTime">
                <font-awesome-icon :icon="faXmark" />
              </button>
              <button class="btn text" @click="saveNotificationTime" :disabled="isSavingTime">
                <font-awesome-icon v-if="!isSavingTime" :icon="faCheck" />
                <span v-else class="spinner-small"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button class="btn outlined logout-btn" style="margin-top: 30px" @click="onLogout">
      <font-awesome-icon :icon="faSignOut" aria-hidden="true" />
      Logout
    </button>
  </div>
</template>

<script setup>
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
  import {
    faGear,
    faMessage,
    faBell,
    faClock,
    faArrowRight,
    faPen,
    faXmark,
    faCheck,
    faSignOut,
  } from '@fortawesome/free-solid-svg-icons'
  import { ref, computed, onMounted, watch, nextTick } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import { generateAlert } from '@/utils/alertbanner.js'

  const store = useUserStore()
  const router = useRouter()

  const preferences = ref({ email: false, telegram: false })
  const includeSimilar = ref(false)
  const notificationTime = ref('06:00')
  const notificationDay = ref('false')
  const isEditingTime = ref(false)
  const isSavingTime = ref(false)
  const timepickerInput = ref(null)

  // Store original values for canceling
  const originalTime = ref('06:00')
  const originalDay = ref('false')

  let timepickerInstance = null

  const hasTelegram = computed(() => {
    const tg = store.user?.telegram || ''
    return tg.charAt(0) !== 'X'
  })

  onMounted(() => {
    // Load mdtimepicker script
    loadTimepickerScript()

    if (store.user) {
      loadUserPreferences()
    }
  })

  function loadTimepickerScript() {
    // Check if mdtimepicker is already loaded
    if (window.mdtimepicker) {
      initTimepicker()
      return
    }

    // Load the script
    const script = document.createElement('script')
    script.src = '/mdtimepicker.js'
    script.onload = () => {
      initTimepicker()
    }
    document.head.appendChild(script)
  }

  function initTimepicker() {
    if (!timepickerInput.value || !window.mdtimepicker) return

    const dayBefore = notificationDay.value === 'true'
    const config = {
      is24hour: true,
      theme: 'dark',
      clearBtn: false,
      minTime: '0:00',
      maxTime: dayBefore ? '23:55' : '08:10',
    }

    timepickerInstance = window.mdtimepicker(timepickerInput.value, config)

    // Set initial value
    if (notificationTime.value) {
      window.mdtimepicker(timepickerInput.value, 'setValue', notificationTime.value)
    }

    // Listen for value changes
    timepickerInput.value.addEventListener('timechanged', (e) => {
      notificationTime.value = e.detail.value
    })
  }

  function destroyTimepicker() {
    if (timepickerInstance && window.mdtimepicker) {
      try {
        window.mdtimepicker(timepickerInput.value, 'destroy')
      } catch (e) {
        console.warn('Error destroying timepicker:', e)
      }
    }
  }

  function reinitTimepicker() {
    nextTick(() => {
      destroyTimepicker()
      initTimepicker()
    })
  }

  // Watch for day change to update timepicker constraints
  watch(notificationDay, (newDay) => {
    if (!isEditingTime.value) return
    reinitTimepicker()
  })

  function loadUserPreferences() {
    const user = store.user

    // Load notification preferences (0=none, 1=telegram, 2=email, 3=both)
    const pref = user.notification_preferences || 0
    preferences.value = {
      email: pref === 2 || pref === 3,
      telegram: pref === 1 || pref === 3,
    }

    // Load similar tags preference
    includeSimilar.value = user.include_similar_tags || false

    // Load notification time
    if (user.notification_time) {
      const time = user.notification_time
      notificationTime.value = time.slice(0, 5) // HH:mm format
    }
    notificationDay.value = String(user.notification_day_before || false)

    // Store originals
    originalTime.value = notificationTime.value
    originalDay.value = notificationDay.value

    // Update timepicker if already initialized
    if (timepickerInput.value && window.mdtimepicker) {
      nextTick(() => {
        window.mdtimepicker(timepickerInput.value, 'setValue', notificationTime.value)
      })
    }
  }

  async function updatePreferences() {
    try {
      const prefValue = preferences.value
      await store.updateNotificationPreferences(prefValue)
    } catch (err) {
      console.error('Failed to update preferences:', err)
      generateAlert('error', 'Si è verificato un errore. Riprova più tardi.')
      // Revert on error
      loadUserPreferences()
    }
  }

  async function toggleSimilar() {
    try {
      await store.toggleProbableNotifications()
    } catch (err) {
      console.error('Failed to toggle similar notifications:', err)
      generateAlert('error', 'Si è verificato un errore. Riprova più tardi.')
      // Revert on error
      includeSimilar.value = !includeSimilar.value
    }
  }

  function startEditTime() {
    isEditingTime.value = true
    nextTick(() => {
      reinitTimepicker()
    })
  }

  function cancelEditTime() {
    notificationTime.value = originalTime.value
    notificationDay.value = originalDay.value
    isEditingTime.value = false

    // Update timepicker display
    if (timepickerInput.value && window.mdtimepicker) {
      window.mdtimepicker(timepickerInput.value, 'setValue', originalTime.value)
    }
  }

  async function saveNotificationTime() {
    const time = notificationTime.value
    const dayBefore = notificationDay.value === 'true'

    // Validation
    if (!time) {
      generateAlert('error', 'Inserisci un orario valido.')
      return
    }

    // If same day (morning), time must be before 08:10
    if (!dayBefore && time > '08:10') {
      generateAlert('error', 'Per notifiche alla mattina, inserisci un orario prima delle 08:10.')
      return
    }

    try {
      isSavingTime.value = true
      await store.updateNotificationTime(time, dayBefore)

      // Update originals
      originalTime.value = time
      originalDay.value = String(dayBefore)

      isEditingTime.value = false
      generateAlert('success', 'Orario aggiornato con successo!')
    } catch (err) {
      console.error('Failed to update notification time:', err)
      generateAlert('error', 'Si è verificato un errore. Riprova più tardi.')
    } finally {
      isSavingTime.value = false
    }
  }

  async function onLogout() {
    try {
      await store.logout()
    } finally {
      router.push('/login')
    }
  }
</script>

<style scoped src="@/assets/css/mdtimepicker.css"></style>
<style scoped src="@/assets/css/dashboard.css"></style>