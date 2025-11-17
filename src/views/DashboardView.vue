<template>
  <div class="section">
    <Title :title="`Dashboard di ${user.name || ''}`" :subtitle="greeting" />
    <p class="information">
      <span class="material-symbols-outlined" style="color: var(--on-surface-primary)" aria-hidden="true">warning</span>
      Il sistema non è ufficialmente riconosciuto dalla presidenza dell'Istituto Superiore "Enrico Fermi" di Mantova.
      Eventuali malfunzionamenti sono a carico dello staff e non sono valide giustificazioni in uffici di segreteria e
      presidenza.
    </p>

    <!-- Keyword form -->
    <KeywordForm />

    <!-- Events -->
    <Eventi :keywords="keywords" />

    <!-- Settings -->
    <Settings />

    <!-- Telegram -->
    <Telegram />

    <!-- User Info -->
    <UserInfo />

    <Notifiche />
  </div>
</template>

<style src="@/assets/css/page.css"></style>
<style scoped src="@/assets/css/dashboard.css"></style>

<script setup>
  import KeywordForm from '@/components/dashboard/KeywordForm.vue'
  import Eventi from '@/components/dashboard/Eventi.vue'
  import Title from '@/components/Title.vue'
  import Settings from '@/components/dashboard/Settings.vue'
  import Telegram from '@/components/dashboard/Telegram.vue'
  import UserInfo from '@/components/dashboard/UserInfo.vue'
  import Notifiche from '@/components/dashboard/Notifiche.vue'
  import { onMounted, ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/user'

  const store = useUserStore()
  const router = useRouter()
  const loading = ref(false)
  const user = computed(() => store.user || {})
  const keywords = computed(() => (Array.isArray(store.user?.keywords) ? store.user.keywords : []))

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
</script>
