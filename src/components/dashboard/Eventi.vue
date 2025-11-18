<template>
  <div class="sub-section" id="events">
    <h2>
      <span class="material-symbols-outlined">calendar_month</span>
      Eventi in programma
    </h2>
    <CercaEventiCore v-if="hasKeywords" :keywords="keywords" />
    <p v-else style="color: var(--on-surface-primary)">Nessuna keyword inserita</p>
  </div>
</template>

<script setup>
  import CercaEventiCore from '@/components/CercaEventiCore.vue'
  import { computed } from 'vue'

  const { keywords } = defineProps({
    keywords: {
      type: Array,
      default: () => [],
    },
  })

  const hasKeywords = computed(() => Array.isArray(keywords) && keywords.length > 0)
</script>

<style scoped src="@/assets/css/dashboard.css"></style>
