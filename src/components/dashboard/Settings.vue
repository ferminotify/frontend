<template>
  <div class="sub-section">
    <h2>
      <span class="material-symbols-outlined">settings</span>
      Impostazioni
    </h2>

    <div class="impostazioni-container">
      <!-- Notification Time -->
      <div
        class="invioNotificheContainer impostazioni-sect"
        id="orario"
        style="position: relative; padding-bottom: 10px">
        <p style="padding-bottom: 10px;" class="impostazioni-sect-title">
          <span class="material-symbols-outlined">schedule</span>
          Orario Daily Notification
        </p>

        <div class="notTime impostazioni-sect-content" style="margin: 10px 0">
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
                id="timepicker"
                class="dashboard-input dashboard-time"
                :disabled="!isEditingTime"
                style="width: 75px" />
            </div>
          </div>

          <div class="dashboard-edit-btn-container">
            <div v-if="!isEditingTime && !isSavingTime" class="dashboard-toEdit-btns flex-y-center">
              <a class="btn text" @click="startEditTime">
                <span class="material-symbols-outlined">edit</span>
              </a>
            </div>
            <div v-else-if="isSavingTime" class="dashboard-toEdit-btns flex-y-center">
              <div class="submit-lds-grid">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
            <div v-else class="dashboard-editing-btns">
              <button class="btn text" @click="cancelEditTime">
                <span class="material-symbols-outlined">close</span>
              </button>
              <button class="btn text" @click="saveNotificationTime">
                <span class="material-symbols-outlined">check</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="invioNotificheContainer impostazioni-sect" id="canali">
        <p style="padding-bottom: 10px" class="impostazioni-sect-title">
          <span class="material-symbols-outlined">notifications</span>
          Notifiche push
        </p>
        <div class="impostazioni-sect-content">
          <div class="checkNot-container">
            Attiva notifiche push
            <label class="switch">
              <input
                type="checkbox"
                v-model="preferences.push"
                @change="toggleSubscribeUser"
                class="checkbox"
                id="pushNotification" />
              <span class="slider round"></span>
            </label>
          </div>
          <div class="checkNot-container" v-show="preferences.push">
            Invia le notifiche push
            <select class="dashboard-select" v-model="preferences.pushNotificationTime" @change="updatePushDeliveryMode" style="width: fit-content" :disabled="!preferences.push">
              <!-- send_push_with_notifications -->
              <option value="false" selected>All'aggiunta della variazione</option>
              <option value="true">Insieme a email / telegram</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Notification Channels -->
      <div class="invioNotificheContainer impostazioni-sect" id="canali">
        <p style="padding-bottom: 10px" class="impostazioni-sect-title">
          <span class="material-symbols-outlined">chat_bubble</span>
          Canali notifiche
        </p>
        <div class="impostazioni-sect-content">
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
      </div>

      <!-- Probable Variations -->
      <div class="impostazioni-sect invioNotificheContainer" id="variazioni" style="padding-bottom: 15px">
        <p style="padding-bottom: 10px" class="impostazioni-sect-title">
          <span class="material-symbols-outlined">bolt</span>
          Variazioni dell'orario
        </p>
        <div class="impostazioni-sect-content">
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
          <!-- prettier-ignore -->
          <p style="font-size: 12px; color: var(--on-surface);">
            <span class="material-symbols-outlined">arrow_right_alt</span>Esempio: con keyword<code>5 CIN</code> invia le variazioni sulla <code>5CIIN</code>.
          </p>
          <p style="font-size: 12px; color: var(--on-surface)">
            Utile per includere le variazioni con errori di battitura.
          </p>
        </div>
      </div>
    </div>

    <button class="btn filled" style="margin-top: 30px" @click="onLogout" ref="logoutBtn">
      <span class="material-symbols-outlined" aria-hidden="true">logout</span>
      Logout
    </button>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch, nextTick } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import { generateAlert } from '@/utils/alertbanner.js'
  import { loading, saveBtnParams, resetLoading } from '@/utils/loading.js'
  import { subscribeUser, setSendPushWithNotifications, getPushDevices } from '@/stores/push.js'

  const store = useUserStore()
  const router = useRouter()

  const preferences = ref({ email: false, telegram: false, push: false, pushNotificationTime: 'false' })
  const includeSimilar = ref(false)
  const notificationTime = ref('06:00')
  const notificationDay = ref('false')
  const isEditingTime = ref(false)
  const isSavingTime = ref(false)
  const pushEnabled = ref(false)
  const timepickerInput = ref(null)
  const logoutBtn = ref(null)
  let logoutParams = null

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
    loadUserPreferences()
    loadUserPushSubscription()
  })

  // Watch for user data changes and reload preferences
  watch(
    () => store.user,
    (newUser) => {
      if (newUser) {
        loadUserPreferences()
        loadUserPushSubscription()
      }
    },
    { immediate: true, deep: true }
  )

  async function toggleSubscribeUser() {
    const desired = preferences.value.push
    try {
      await subscribeUser(desired)
      pushEnabled.value = desired
    } catch (err) {
      console.error('Failed to subscribe/unsubscribe user for push notifications:', err)
      generateAlert('error', err.message || 'Si è verificato un errore. Riprova più tardi.')
      // Revert on error
      preferences.value.push = !desired
      pushEnabled.value = !desired
    }
  }

  async function loadUserPushSubscription() {
    const user = store.user
    if (!user) return

    const registration = await navigator.serviceWorker.getRegistration()
    const sub = await registration?.pushManager.getSubscription()

    const device_id = localStorage.getItem('device_id') || null

    if (!sub) {
      console.warn('No push subscription found on this device')
      pushEnabled.value = false
      preferences.value.push = false
      return
    }

    // If a subscription exists but we don't have a device_id (e.g., storage cleared),
    // force re-association by re-subscribing so backend gets the payload with a new device_id
    if (!device_id) {
      try {
        await subscribeUser(true)
        pushEnabled.value = true
        preferences.value.push = true
      } catch (e) {
        console.warn('Failed to re-associate push subscription without device_id', e)
        pushEnabled.value = false
        preferences.value.push = false
      }
      return
    }
    // c'è l'iscrizione push --> controllo se l'endpoint in localStorage è ancora uguale (per browser che rigenera gli endpoint)
    const storedEndpoint = localStorage.getItem('endpoint')
    if (storedEndpoint !== sub.endpoint) {
      console.warn('Push subscription endpoint has changed')
      localStorage.setItem('endpoint', sub.endpoint)
      await subscribeUser(true) // ensure backend knows latest endpoint
    }

    // Fetch device-specific push preferences from backend via store helper
    try {
      const devices = await getPushDevices()
      const matched = devices.find((d) => d.device_id === device_id)
      if (matched) {
        pushEnabled.value = true
        preferences.value.push = true
        preferences.value.pushNotificationTime = matched.send_push_with_notifications ? 'true' : 'false'
      } else {
        pushEnabled.value = false
        preferences.value.push = false
        preferences.value.pushNotificationTime = 'false'
      }
    } catch (err) {
      console.error('Error fetching push devices:', err)
      // Fallback: keep previous state but ensure not enabled blindly
      if (!pushEnabled.value) {
        preferences.value.push = false
        preferences.value.pushNotificationTime = 'false'
      }
    }
  }

  function loadTimepickerScript() {
    // Check if mdtimepicker is already loaded
    if (window.mdtimepicker) {
      nextTick(() => initTimepicker())
      return
    }

    // Load the script
    const script = document.createElement('script')
    script.src = '/mdtimepicker.js'
    script.onload = () => {
      nextTick(() => initTimepicker())
    }
    script.onerror = () => {
      console.error('Failed to load mdtimepicker.js')
    }
    document.head.appendChild(script)
  }

  function initTimepicker() {
    if (!timepickerInput.value) {
      console.warn('Timepicker input ref not available')
      return
    }

    if (!window.mdtimepicker) {
      console.warn('mdtimepicker not loaded')
      return
    }

    try {
      const dayBefore = notificationDay.value === 'true'
      const config = {
        is24hour: true,
        theme: 'dark',
        clearBtn: false,
        minTime: '0:00',
        maxTime: dayBefore ? '23:55' : '08:10',
      }

      // Initialize using the element directly (not jQuery selector)
      timepickerInstance = window.mdtimepicker(timepickerInput.value, config)

      // Set initial value
      if (notificationTime.value) {
        window.mdtimepicker(timepickerInput.value, 'setValue', notificationTime.value)
      }

      // Listen for input changes - mdtimepicker updates the input value directly
      timepickerInput.value.addEventListener('input', (e) => {
        notificationTime.value = e.target.value
      })

      timepickerInput.value.addEventListener('change', (e) => {
        notificationTime.value = e.target.value
      })
    } catch (error) {
      console.error('Error initializing mdtimepicker:', error)
    }
  }

  function destroyTimepicker() {
    if (timepickerInput.value && window.mdtimepicker) {
      try {
        window.mdtimepicker(timepickerInput.value, 'destroy')
        timepickerInstance = null
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
    if (!user) return

    // Load notification preferences (0=none, 1=telegram, 2=email, 3=both)
    const pref = user.notification_preferences ?? 0
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
      const email_val = preferences.value.email
      const telegram_val = preferences.value.telegram
      const pref = {
        email: email_val,
        telegram: telegram_val,
      }
      await store.updateNotificationPreferences(pref)
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

  async function updatePushDeliveryMode() {
    if (!preferences.value.push) return
    const value = preferences.value.pushNotificationTime === 'true'
    try {
      await setSendPushWithNotifications(value)
    } catch (err) {
      console.error('Failed to update push delivery mode', err)
      generateAlert('error', 'Errore aggiornando preferenza push.')
      preferences.value.pushNotificationTime = value ? 'false' : 'true'
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
    // Get the current value from the input (mdtimepicker updates it directly)
    const time = timepickerInput.value?.value || notificationTime.value
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

      // Update local state
      notificationTime.value = time
      originalTime.value = time
      originalDay.value = String(dayBefore)

      // Exit edit mode on success
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
      logoutParams = saveBtnParams(logoutBtn.value)
      loading(logoutBtn.value)
      await store.logout()
    } finally {
      if (logoutParams) {
        resetLoading(logoutBtn.value, logoutParams)
      }
      router.push('/')
    }
  }
</script>

<style src="@/assets/css/mdtimepicker.css"></style>
<style scoped src="@/assets/css/dashboard.css"></style>
<style scoped>
  .impostazioni-sect-title .material-symbols-outlined {
    color: var(--on-surface-primary);
  }
  .impostazioni-sect-title{
    font-weight: 600;
    font-size: 1.1rem;
  }
  .dashboard-toEdit-btns .btn {
    color: var(--on-surface);
  }
  .impostazioni-sect-content{
    padding: 0 25px;
  }
</style>
