<template>
  <div class="sub-section">
    <h2>
      <span class="material-symbols-outlined">notifications</span>
      Notifiche
    </h2>
    <span>&gt Hai ricevuto {{ store.user?.notifications || 0 }} notifiche</span>
  </div>
</template>

<style scoped src="@/assets/css/dashboard.css"></style>

<script setup>
  import { useUserStore } from '@/stores/user'
  const store = useUserStore()
</script>
