<template>
  <div class="auth-loading-screen">
    <div class="loading-content">
      <div class="lds-grid">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <p class="loading-text">Caricamento dashboard&hellip;</p>
    </div>
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

<style scoped>
  .auth-loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--surface);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .loading-text {
    color: var(--on-surface);
    font-size: 16px;
    text-align: center;
    margin: 0;
  }

  .lds-grid {
    display: inline-block;
    position: relative;
    width: 80px;
    height: 80px;
  }

  .lds-grid div {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--on-surface-primary);
    animation: lds-grid 1.2s linear infinite;
  }

  .lds-grid div:nth-child(1) { left: 8px;  top: 8px;  animation-delay: 0s; }
  .lds-grid div:nth-child(2) { left: 32px; top: 8px;  animation-delay: -0.4s; }
  .lds-grid div:nth-child(3) { left: 56px; top: 8px;  animation-delay: -0.8s; }
  .lds-grid div:nth-child(4) { left: 8px;  top: 32px; animation-delay: -0.4s; }
  .lds-grid div:nth-child(5) { left: 32px; top: 32px; animation-delay: -0.8s; }
  .lds-grid div:nth-child(6) { left: 56px; top: 32px; animation-delay: -1.2s; }
  .lds-grid div:nth-child(7) { left: 8px;  top: 56px; animation-delay: -0.8s; }
  .lds-grid div:nth-child(8) { left: 32px; top: 56px; animation-delay: -1.2s; }
  .lds-grid div:nth-child(9) { left: 56px; top: 56px; animation-delay: -1.6s; }

  @keyframes lds-grid {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
