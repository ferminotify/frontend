<script setup>
  import { useRoute, useRouter } from 'vue-router'
  import ResetPassword from '@/components/ResetPassword.vue'

  const route = useRoute()
  const router = useRouter()
</script>

<template>
  <ResetPassword />
</template>
