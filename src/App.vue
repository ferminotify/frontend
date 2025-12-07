<script setup>
  import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
  import { RouterLink, RouterView, useRoute } from 'vue-router'
  import { useUserStore } from '@/stores/user'

  const route = useRoute()
  const user = useUserStore()

  const isLoggedIn = computed(() => !!user.token)
  const isDashboard = computed(() => route.path.startsWith('/dashboard'))
  const isAuthActive = computed(() =>
    isLoggedIn.value
      ? isDashboard.value
      : route.path === '/login' || route.path === '/register'
  )
  const authTo = computed(() => (isLoggedIn.value ? '/dashboard' : '/login'))
  const authIcon = computed(() => (isLoggedIn.value ? 'space_dashboard' : 'login'))
  const authLabel = computed(() => (isLoggedIn.value ? 'Dashboard' : 'Accesso'))

  // Mobile hide-on-scroll state
  const isMobile = ref(typeof window !== 'undefined' && window.innerWidth <= 600)
  const hideSidebarText = ref(false)
  let prevScroll = typeof window !== 'undefined' ? window.pageYOffset : 0

  // PWA install state
  const deferredPrompt = ref(null)
  const isStandalone = ref(false)

  const handleScroll = () => {
    if (!isMobile.value) return
    const currentScroll = window.pageYOffset
    const atBottom =
      window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 1

    hideSidebarText.value = !(prevScroll > currentScroll || atBottom || currentScroll < 10)
    prevScroll = currentScroll
  }

  const handleResize = () => {
    isMobile.value = window.innerWidth <= 600
    if (!isMobile.value) hideSidebarText.value = false
  }

  const beforeInstallHandler = (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    console.log('[pwa] beforeinstallprompt captured')
  }

  const appInstalledHandler = () => {
    deferredPrompt.value = null
    isStandalone.value = true
    console.log('[pwa] appinstalled')
  }

  const checkStandalone = () => {
    if (typeof window === 'undefined') return
    const displayModeStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches
    const iosStandalone = window.navigator?.standalone === true
    isStandalone.value = !!(displayModeStandalone || iosStandalone)
  }

  onMounted(() => {
    if (typeof window === 'undefined') return

    prevScroll = window.pageYOffset
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    handleResize()

    checkStandalone()
    window.addEventListener('beforeinstallprompt', beforeInstallHandler)
    window.addEventListener('appinstalled', appInstalledHandler)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return

    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('beforeinstallprompt', beforeInstallHandler)
    window.removeEventListener('appinstalled', appInstalledHandler)
  })

  // Trigger the PWA install prompt (fallbacks to navigation)
  const installApp = async (navigate, event) => {
    if (deferredPrompt.value) {
      event?.preventDefault()
      try {
        deferredPrompt.value.prompt()
        const { outcome } = await deferredPrompt.value.userChoice
        console.log(
          `[pwa] user ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`
        )
      } catch (err) {
        console.warn('[pwa] error prompting install', err)
      } finally {
        deferredPrompt.value = null
      }
    } else if (isStandalone.value) {
      // app is already installed: try to focus/open the existing app window (IDK if this works)
      if (window && window.location && window.location.origin) {
        const url = '/'
        // For most platforms, clicking the icon opens the app;
        // here we just ensure we're on the root of the app.
        if (window.location.pathname !== url) {
          window.location.href = url
        }
      }
    } else {
      // no install prompt available and not standalone: fallback to navigate to /app route
      navigate()
    }
  }
</script>

<template>
  <header>
    <div class="sidebar" :class="{ compact: hideSidebarText, mobile: isMobile }">
      <div class="sidebar-inner">
        <RouterLink to="/" custom v-slot="{ href, navigate, isExactActive }">
          <a :href="href" @click="navigate" class="sidebar-link" id="cercaeventi" :class="{ active: isExactActive }">
            <span class="material-symbols-outlined sidebar-icon">search</span>
            <span class="sidebar-link-text">Cerca Eventi</span>
          </a>
        </RouterLink>

        <RouterLink :to="authTo" custom v-slot="{ href, navigate }">
          <a :href="href" @click="navigate" class="sidebar-link" id="login" :class="{ active: isAuthActive }">
            <span class="material-symbols-outlined sidebar-icon">{{ authIcon }}</span>
            <span class="sidebar-link-text">{{ authLabel }}</span>
          </a>
        </RouterLink>

        <RouterLink to="/faq" custom v-slot="{ href, navigate, isExactActive }">
          <a :href="href" @click="navigate" class="sidebar-link" id="faq" :class="{ active: isExactActive }">
            <span class="material-symbols-outlined sidebar-icon">help_center</span>
            <span class="sidebar-link-text">FAQ</span>
          </a>
        </RouterLink>

        <RouterLink v-if="!isStandalone" to="/app" custom v-slot="{ href, navigate, isExactActive }">
          <a :href="href" @click="installApp(navigate, $event)" class="sidebar-link" id="app" :class="{ active: isExactActive }">
            <span class="material-symbols-outlined sidebar-icon">download</span>
            <span class="sidebar-link-text">Installa l'app</span>
          </a>
        </RouterLink>

        <div class="sidebar-link sidebar-contatti sidebar-desktop">
          <a href="https://www.instagram.com/ferminotify/" target="_blank">
            <font-awesome-icon :icon="['fab', 'instagram']" />
          </a>
          <a href="https://github.com/ferminotify" target="_blank">
            <font-awesome-icon :icon="['fab', 'github']" />
          </a>
        </div>

        <!--div class="sidebar-link sidebar-menu" id="manu">
          <a class="hamburger">
            <span class="line"></span>
            <span class="line"></span>
            <span class="line"></span>
          </a>
          <div class="nav-links">
            <ul>
              <li>
                <div class="sidebar-link sidebar-contatti">
                  <a href="https://www.instagram.com/ferminotify/" target="_blank">
                    <font-awesome-icon :icon="['fab', 'instagram']" />
                  </a>
                  <a href="https://github.com/ferminotify" target="_blank">
                    <font-awesome-icon :icon="['fab', 'github']" />
                  </a>
                </div>
              </li>
            </ul>
          </div>
          <span class="sidebar-link-text">Menu</span>
        </div-->
      </div>
    </div>
  </header>

  <div class="main-container">
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* Only apply when JS detects mobile layout to avoid clashing with global media rules */
.sidebar.mobile .sidebar-inner {
  transition: transform 300ms ease, box-shadow 180ms ease;
}
.sidebar.mobile .sidebar-link-text {
  display: block;
  max-height: 40px;
  opacity: 1;
  transition: max-height 300ms ease, opacity 300ms ease;
  overflow: hidden;
}
.sidebar.mobile.compact .sidebar-link-text {
  max-height: 0;
  opacity: 0;
}

/* keep default desktop behaviour untouched */
.sidebar .sidebar-link-text {
  transition: none;
}
</style>
