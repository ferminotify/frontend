<template>
  <div class="section flex-center-y" style="min-height: 60vh; justify-content: center">
    <img src="@/assets/icons/logo-long.svg" alt="Fermi Notify Logo" class="form-logo logo" />
    <p style="margin-top: 20px; color: var(--muted)">Accesso in corso&hellip;</p>
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import { generateAlert } from '@/utils/alertbanner.js'

  const route = useRoute()
  const router = useRouter()
  const user = useUserStore()

  onMounted(async () => {
    // The backend already set the httpOnly refreshToken cookie on the API domain.
    // Mint an access token from it, then load the profile to decide where to go.
    try {
      await user.refreshAccessToken()
      await user.fetchProfile()

      const needsCompletion = user.user?.profile_complete === false || route.query.new === '1'
      if (needsCompletion) {
        await router.replace({ name: 'complete-profile' })
      } else {
        await router.replace({ name: 'dashboard' })
      }
    } catch (err) {
      console.error('Google auth callback failed:', err)
      generateAlert('error', "Accesso con Google non riuscito. Riprova.")
      await router.replace({ name: 'login' })
    }
  })
</script>
