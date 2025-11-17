<template>
  <div class="sub-section" id="events">
    <h2>
      <span class="material-symbols-outlined">calendar_month</span>
      Eventi in programma
    </h2>
    <CercaEventiCore :keywords="keywords" />
  </div>
</template>

<script setup>
  import CercaEventiCore from '@/components/CercaEventiCore.vue'
  defineProps({
    keywords: {
      type: Array,
      required: true,
    },
  })
</script>

<style scoped src="@/assets/css/dashboard.css"></style>
