<template>
    <div class="sub-section">
        <h2>
            <span class="material-symbols-outlined">devices</span>
            Dispositivi Push
        </h2>
        <p>Gestisci i dispositivi registrati per le notifiche push.</p>
        <div v-if="loadingDevices" class="submit-lds-grid" style="margin:15px 0">
            <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
        </div>
        <div v-else class="push-list">
            <div v-if="devices.length === 0" style="padding:15px;color:var(--on-surface)">
                Nessun dispositivo registrato.
            </div>
            <div
                v-for="d in devices"
                :key="d.device_id"
                class="push-device"
                :class="{ current: d.device_id === currentDeviceId }"
            >
                <div class="device-info">
                    <div class="device-info-name">
                        <div
                            :id="d.device_id"
                            :contenteditable="editingId === d.device_id"
                            @input="onContentInput($event, d.device_id)"
                            @keydown.enter.prevent="saveEdit(d)"
                            @keydown.esc.prevent="cancelEdit"
                            tabindex="0"
                            class="device-info-input"
                        >{{ d.device_info }}</div>
                        <div v-if="editingId === d.device_id" style="display:flex; gap:15px; align-items:center;">
                            <button class="btn text" @click="saveEdit(d)"><span class="material-symbols-outlined">check</span></button>
                            <button class="btn" @click="cancelEdit"><span class="material-symbols-outlined">close</span></button>
                        </div>
                        <div v-else>
                            <a v-if="d.device_id === currentDeviceId" class="btn text material-symbols-outlined" @click="startEdit(d)">edit</a>
                        </div>
                        <small v-if="d.device_id === currentDeviceId" class="pill">Questo dispositivo</small>
                    </div>
                    <small>dal {{ formatDate(d.created_at) }}</small>
                    <small style="font-size:12px;color:var(--on-surface); display:flex; gap:6px">
                        <span class="material-symbols-outlined">schedule_send</span>
                        {{ d.send_push_with_notifications ? 'Invia insieme a email/telegram' : "Invia all'aggiunta della variazione" }}
                    </small>
                    
                </div>
                <div>
                    <button v-if="d.device_id !== currentDeviceId" class="btn outlined" @click="removeDevice(d)" ref="submitBtnRef">Rimuovi</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import Modal from '@/components/common/Modal.vue'
import { ref, onMounted, onBeforeUnmount, nextTick, createApp } from 'vue'
import { generateAlert } from '@/utils/alertbanner.js'
import { getPushDevices, deletePushDevice, updatePushDeviceInfo } from '@/stores/push.js'
import { loading, saveBtnParams, resetLoading } from '@/utils/loading.js'

const devices = ref([])
const loadingDevices = ref(false)
const removing = ref({})
const currentDeviceId = localStorage.getItem('device_id') || ''
const editingId = ref(null)
const editText = ref('')
const btnParams = ref(null)
const submitBtnRef = ref(null)

onMounted(() => {
    loadDevices()
})

function onPushChanged(e) {
    // Simply reload devices when push subscription state changes elsewhere
    try {
        // If the event provides an updated devices array, use it to avoid refetch
        const payload = e?.detail || {}
        if (payload.devices && Array.isArray(payload.devices)) {
            devices.value = payload.devices
            loadingDevices.value = false
        } else {
            loadDevices()
        }
    } catch (err) {
        console.warn('Error reloading push devices after change event', err)
    }
}

onMounted(() => {
    window.addEventListener('push:changed', onPushChanged)
})

onBeforeUnmount(() => {
    window.removeEventListener('push:changed', onPushChanged)
})

async function loadDevices() {
    loadingDevices.value = true
    try {
        devices.value = await getPushDevices()
        // After fetching devices, verify current device subscription state
        // and remove DB record if push subscription is not active for this device.
        try {
            await verifyAndCleanupCurrentDevice()
        } catch (e) {
            console.warn('[push] verifyAndCleanupCurrentDevice error', e)
        }
    } catch (e) {
        console.error('[push] fetchDevices error', e)
        generateAlert('error', e.message || 'Errore caricando i dispositivi.')
    } finally {
        loadingDevices.value = false
    }
}

// Check whether the current device still has an active push subscription
// If not active (no registration/subscription or endpoint mismatch) delete
// the corresponding DB record for this device_id.
async function verifyAndCleanupCurrentDevice() {
    if (!currentDeviceId) return
    // find current device record returned by backend
    const deviceRecord = (devices.value || []).find(x => x.device_id === currentDeviceId)
    if (!deviceRecord) return

    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            // Browser no longer supports push → remove server record
            await attemptDeleteCurrentDevice('browser-no-push')
            return
        }

        const registration = await navigator.serviceWorker.getRegistration()
        if (!registration) {
            // No service worker registered for this scope → remove server record
            await attemptDeleteCurrentDevice('no-service-worker')
            return
        }

        const subscription = await registration.pushManager.getSubscription()
        // stored endpoint (used when subscribing)
        const storedEndpoint = localStorage.getItem('endpoint') || ''

        if (!subscription) {
            // no active subscription in the browser
            await attemptDeleteCurrentDevice('no-subscription')
            return
        }

        const subJson = subscription && typeof subscription.toJSON === 'function' ? subscription.toJSON() : subscription
        if (storedEndpoint && subJson.endpoint && storedEndpoint !== subJson.endpoint) {
            // endpoint changed or mismatch — treat as inactive/stale and remove DB record
            await attemptDeleteCurrentDevice('endpoint-mismatch')
            return
        }

        // subscription appears active and matches stored endpoint — nothing to do
        return
    } catch (e) {
        console.error('[push] verify current subscription failed', e)
        // don't throw further — we don't want to break UI loading
    }
}

async function attemptDeleteCurrentDevice(reason) {
    try {
        const deleted = await deletePushDevice(currentDeviceId)
        if (deleted) {
            // remove from list shown in UI
            devices.value = devices.value.filter(x => x.device_id !== currentDeviceId)
            // clear local stored subscription metadata but keep device_id (so it stays stable)
            localStorage.removeItem('vapidPublicKey')
            localStorage.removeItem('endpoint')
            console.log('[push] Removed current device due to:', reason)
        } else {
            console.warn('[push] Server reported device not deleted for reason:', reason)
        }
    } catch (e) {
        console.error('[push] attemptDeleteCurrentDevice error', e)
    }
}

function startEdit(d) {
    if (d.device_id !== currentDeviceId) {
        generateAlert('error', 'Puoi modificare solo il dispositivo corrente.')
        return
    }
    editingId.value = d.device_id
    editText.value = d.device_info || ''
    nextTick(() => {
        const el = document.getElementById(d.device_id)
        if (el) {
            el.focus()
            placeCaretAtEnd(el)
        }
    })
}

function onContentInput(event) {
    // keep editText in sync with the contenteditable div
    editText.value = (event.target && event.target.innerText) ? event.target.innerText : ''
}

function cancelEdit() {
    // restore original text in the element
    try {
        if (editingId.value) {
            const el = document.getElementById(editingId.value)
            const device = devices.value.find(x => x.device_id === editingId.value)
            if (el && device) el.innerText = device.device_info
        }
    } catch (e) {
        console.error('[push] cancelEdit restore error', e)
    }
    editingId.value = null
    editText.value = ''
}

async function saveEdit(d) {
    try {
        const device = devices.value.find(x => x.device_id === d.device_id)
        if (!device) return
        // Prefer the editText value, fallback to element content
        const el = document.getElementById(d.device_id)
        const raw = (editText.value || (el && el.innerText) || '').trim()
        if (!raw) {
            generateAlert('error', 'Il nome dispositivo non può essere vuoto.')
            return
        }
        device.device_info = raw
        if (el) el.innerText = raw
        editingId.value = null
        editText.value = ''
        // store update
        await updatePushDeviceInfo(d.device_id, raw)
    } catch (e) {
        console.error('[push] saveEdit error', e)
        generateAlert('error', e.message || 'Errore salvando il dispositivo.')
    }
}

function placeCaretAtEnd(el) {
    try {
        const range = document.createRange()
        range.selectNodeContents(el)
        range.collapse(false)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
    } catch (e) {
        // ignore
    }
}

function formatDate(ts) {
    try {
        if (!ts) return ''
        return new Date(ts).toLocaleDateString('it-IT')
    } catch {
        return ts
    }
}

async function removeDevice(d) {
    // show modal confirmation
    const confirmed = await new Promise((resolve) => {
        const modal = createApp(Modal, {
            title: 'Conferma rimozione dispositivo',
            subject: `Rimuovere ${d.device_info} dalle notifiche push?`,
            confirmLabel: 'Rimuovi',
            cancelLabel: 'Annulla',
            onConfirm: () => {
                resolve(true)
                modal.unmount()
                document.body.removeChild(container)
            },
            onCancel: () => {
                resolve(false)
                modal.unmount()
                document.body.removeChild(container)
            }
        })
        const container = document.createElement('div')
        document.body.appendChild(container)
        modal.mount(container)
    })
    if (!confirmed) return
    // loading state
    if (!btnParams.value) btnParams.value = saveBtnParams(submitBtnRef.value)
    loading(submitBtnRef.value)
    removing.value[d.device_id] = true
    try {
        const deleted = await deletePushDevice(d.device_id)
        if (deleted) {
            devices.value = devices.value.filter(x => x.device_id !== d.device_id)
        } else {
            throw new Error('Il dispositivo non è stato eliminato.')
        }
    } catch (e) {
        console.error('[push] removeDevice error', e)
        generateAlert('error', e.message || 'Errore rimuovendo il dispositivo.')
        resetLoading(btnParams.value)
    } finally {
        removing.value[d.device_id] = false
    }
}

// per-device toggle removed: delivery mode is displayed read-only here
</script>

<style scoped src="@/assets/css/dashboard.css"></style>
<style scoped>
.push-list{
    display: flex;
    flex-direction: column;
    margin-top: 15px;
}
.push-device{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-top: 1px solid var(--divider);
}
.push-list .push-device:last-child{
    border-bottom: 1px solid var(--divider);
}
.device-info-name{
    display: flex;
    align-items: center;
    gap: 15px;
    font-weight: 600;
}
.device-info-input:focus{
    background: transparent;
    color: var(--on-surface);
    outline: 0;
    border-bottom: 1px solid var(--divider);
    padding: 2px 0;
}
.pill{
    background-color: var(--primary);
    color: var(--on-primary);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 5px 10px;
    border-radius: 15px;
    text-align: center;
}
</style>