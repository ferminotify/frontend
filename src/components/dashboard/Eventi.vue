<template>
  <div class="sub-section" id="eventi">
    <h2>
      <span class="material-symbols-outlined">calendar_month</span>
      Eventi in programma
    </h2>
    <CercaEventiCore v-if="hasKeywords" :keywords="keywords" :opt-in="optIn" paged />
    <p v-else style="color: var(--on-surface-primary)">Nessuna keyword inserita</p>
  </div>
</template>

<script setup>
  import CercaEventiCore from '@/components/common/CercaEventiCore.vue'
  import { computed } from 'vue'
  import { useUserStore } from '@/stores/user'

  const { keywords } = defineProps({
    keywords: {
      type: Array,
      default: () => [],
    },
  })

  const hasKeywords = computed(() => Array.isArray(keywords) && keywords.length > 0)
  const store = useUserStore()
  const optIn = computed(() => store.user?.notify_optin || [])
</script>

<style scoped src="@/assets/css/dashboard.css"></style>
