<template>
	<div class="section">
        <Title
			:title="`Dashboard di ${user.name || ''}`"
				:subtitle="greeting"
        />
        <p class="information"><span class="material-symbols-outlined" style="color: var(--on-surface-primary);" aria-hidden="true">warning</span> Il sistema non è ufficialmente riconosciuto dalla presidenza dell'Istituto Superiore "Enrico Fermi" di Mantova. Eventuali malfunzionamenti sono a carico dello staff e non sono valide giustificazioni in uffici di segreteria e presidenza.</p>
        
        <!-- Keyword form -->
				<div class="sub-section">
						<h2 style="margin-bottom: 10px;"><font-awesome-icon :icon="faKey" style="color: var(--on-surface-primary)" /> Le tue keywords</h2>
						<div class="keywords-container">
								<button
									class="btn keyword-edit-btn"
									:class="isEditing ? 'filled' : 'outlined'"
									@click="toggleKeywordEdit"
									:aria-pressed="isEditing"
								>
									<span class="material-symbols-outlined">edit_square</span>
								</button>
								<ul id="keyword-list">
										<li
											v-for="(keyword, index) in keywords"
											:key="index"
											class="keyword"
											:class="{ 'keyword-editing': isEditing }"
											@click="onKeywordClick(keyword)"
										>
												<span class="keyword-list-bullet">
													<font-awesome-icon :icon="isEditing ? faTrash : faSquare" />
												</span>
												{{ keyword }}
										</li>
								</ul>
								<div class="keywords-form-container">
										<div class="keywords material-textfield" id="submitForm">
												<input
													type="text"
													id="keyword"
													name="keyword"
													placeholder="Es. 5CIIN"
													class="keyword-input"
													required
													v-model="keywordInput"
													@input="toUppercase"
													@keyup.enter="addKeyword"
													style="text-transform: uppercase;"
												/>
												<a class="btn filled addButton submit-btn" @click="addKeyword" :disabled="isSubmitting">
													<span class="material-symbols-outlined">arrow_forward_ios</span>
												</a>
										</div>
								</div>
						</div>
				</div>
	</div>
  
</template>

<style src="@/assets/css/page.css"></style>
<style scoped src="@/assets/css/dashboard.css"></style>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faKey, faSquare, faTrash } from '@fortawesome/free-solid-svg-icons'
import Title from '@/components/Title.vue'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { generateAlert } from '@/utils/alertbanner.js'

const store = useUserStore()
const router = useRouter()
const loading = ref(false)
const user = computed(() => store.user || {})
const keywords = computed(() => Array.isArray(store.user?.tags) ? store.user.tags : (store.user?.keywords || []))
const isEditing = ref(false)
const keywordInput = ref('')
const isSubmitting = ref(false)

const greeting = computed(() => {
	const today = new Date()
	const hour = today.getHours()
	let base = ''
	if (hour < 12) base = 'Buongiorno'
	else if (hour < 18) base = 'Buon pomeriggio'
	else base = 'Buona sera'
	return store.user && store.user.name ? `${base} ${store.user.name}` : base
})

onMounted(async () => {
	if (!store.user && store.token) {
		try {
			loading.value = true
			await store.fetchProfile()
		} finally {
			loading.value = false
		}
	}
})

async function onLogout() {
	try {
		await store.logout()
	} finally {
		router.push('/login')
	}
}

function toggleKeywordEdit() {
	isEditing.value = !isEditing.value
}

function toUppercase() {
	keywordInput.value = (keywordInput.value || '').toUpperCase().replace(/\s+/g, '')
}

async function addKeyword() {
	const kw = (keywordInput.value || '').trim()
	if (!kw) return
	// prevent duplicates (case-insensitive)
	const exists = (keywords.value || []).some((k) => (k || '').toUpperCase() === kw.toUpperCase())
	if (exists) {
		generateAlert('error', 'La keyword è già presente.')
		return
	}
	try {
		isSubmitting.value = true
		await store.addKeyword(kw)
		keywordInput.value = ''
		// Optionally refresh similar suggestions in the future
	} catch (err) {
		console.warn('Failed to add keyword', err)
		generateAlert('error', 'Si è verificato un errore. Riprova più tardi.')
	} finally {
		isSubmitting.value = false
	}
}

async function deleteKeyword(kw) {
	try {
		await store.deleteKeyword(kw)
	} catch (err) {
		console.warn('Failed to delete keyword', err)
		generateAlert('error', 'Si è verificato un errore. Riprova più tardi.')
	}
}

function onKeywordClick(kw) {
	if (!isEditing.value) return
	deleteKeyword(kw)
}
</script>
