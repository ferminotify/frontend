<template>
    <div class="sub-section">
        <h2>
            <span class="material-symbols-outlined">notifications</span>
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
                    <p><strong>{{ d.device_info }}</strong></p>
                    <small>dal {{ formatDate(d.created_at) }}</small>
                    <small style="font-size:12px;color:var(--on-surface); display:flex; gap:6px">
                        <span class="material-symbols-outlined">schedule_send</span>
                        {{ d.send_push_with_notifications ? 'Invia insieme a email/telegram' : "Invia all'aggiunta della variazione" }}
                    </small>
                    
                </div>
                <button class="btn outlined" @click="removeDevice(d)" :disabled="d.device_id === currentDeviceId || removing[d.device_id]">
                    <span v-if="removing[d.device_id]" class="submit-lds-grid" style="width:20px;height:20px"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></span>
                    <span v-else>Rimuovi</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { generateAlert } from '@/utils/alertbanner.js'
import { getPushDevices, deletePushDevice } from '@/stores/push.js'

const devices = ref([])
const loadingDevices = ref(false)
const removing = ref({})
const currentDeviceId = localStorage.getItem('device_id') || ''
// no local editable state needed for per-device delivery mode (read-only)

onMounted(() => {
    loadDevices()
})

async function loadDevices() {
    loadingDevices.value = true
    try {
        devices.value = await getPushDevices()
    } catch (e) {
        console.error('[push] fetchDevices error', e)
        generateAlert('error', e.message || 'Errore caricando i dispositivi.')
    } finally {
        loadingDevices.value = false
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
    if (!confirm('Rimuovere il dispositivo?')) return
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
    border-top: 1px solid var(--on-surface);
    max-width: 50%;
}
.push-list .push-device:last-child{
    border-bottom: 1px solid var(--on-surface);
}
</style>