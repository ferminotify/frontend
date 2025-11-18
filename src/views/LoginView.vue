<script setup>
  import { onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import LoginForm from '../components/LoginForm.vue'
  import RegisterForm from '../components/RegisterForm.vue'
  import { useUserStore } from '@/stores/user'

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()

  onMounted(() => {
    if (route.name === 'email-confirmation') {
      // url /user/auth/register/confirmation/:code
      const code = route.params.code
      userStore
        .confirmEmail(code)
        .then(() => {
          router.replace({ name: 'login', query: { confirmed: '1' } })
        })
        .catch((err) => {
          const message = err?.message || err?.response?.data?.error || 'Errore di conferma.'
          router.replace({ name: 'login', query: { error: message } })
        })
    }
  })
</script>

<template>
  <RegisterForm v-if="route.name === 'register' || route.path === '/register'" />
  <LoginForm v-else />
</template>
