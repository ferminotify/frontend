<script setup>
  import { useRoute } from 'vue-router'
  import LoginForm from '../components/LoginForm.vue'
  import RegisterForm from '../components/RegisterForm.vue'

  const route = useRoute()
</script>

<template>
  <LoginForm v-if="route.name === 'login' || route.path === '/login'" />
  <RegisterForm v-else />
</template>
