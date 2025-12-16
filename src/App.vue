<script setup>
  import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
  import { RouterLink, RouterView, useRoute } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import { generateAlert } from '@/utils/alertbanner.js'

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
  const showBigAlert = ref(false)

  function closeBigAlert() {
    try {
      localStorage.setItem('hide_alert_new_app_beta_251216', 'true')
    } catch (e) {
      /* ignore */
    }
    showBigAlert.value = false
  }

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
    // show the big alert once unless the user previously closed it
    try {
      const hidden = localStorage.getItem('hide_alert_new_app_beta_251216')
      showBigAlert.value = hidden !== 'true'
    } catch (e) {
      showBigAlert.value = true
    }

    // expose closeBigAlert globally so inline handlers won't throw
    try {
      window.closeBigAlert = closeBigAlert
    } catch (e) {
      /* ignore */
    }
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return

    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('beforeinstallprompt', beforeInstallHandler)
    window.removeEventListener('appinstalled', appInstalledHandler)
    // clean up global helpers
    try {
      if (window.startPwaInstall) delete window.startPwaInstall
      if (window.openPwaApp) delete window.openPwaApp
      if (window.closeBigAlert) delete window.closeBigAlert
    } catch (e) {
      /* ignore */
    }
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
      // app is already installed: inform the user and try to focus/open the existing app window
      generateAlert('info', 'App già installata')
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

  // expose simple global helpers so other views/components can trigger the install/open flow
  if (typeof window !== 'undefined') {
    window.startPwaInstall = async () => {
      // If the app is already installed, just show an info alert and try to focus/open it.
      if (isStandalone.value) {
        try {
          generateAlert('info', 'App già installata')
        } catch (e) {
          // ignore UI alert failures
        }

        try {
          if ('serviceWorker' in navigator) {
            const message = { type: 'focus-client', url: '/' }
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage(message)
              return
            }
            const regFocus = await navigator.serviceWorker.getRegistration()
            if (regFocus && regFocus.active) {
              regFocus.active.postMessage(message)
              return
            }
          }
        } catch (err) {
          console.warn('[pwa] could not message service worker to focus app', err)
        }

        window.location.href = '/'
        return
      }

      if (deferredPrompt.value) {
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
        return
      }

      // try to message the service worker to focus an existing client or open one
      try {
        if ('serviceWorker' in navigator) {
          const message = { type: 'focus-client', url: '/' }
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage(message)
            return
          }
          const reg = await navigator.serviceWorker.getRegistration()
          if (reg && reg.active) {
            reg.active.postMessage(message)
            return
          }
        }
      } catch (err) {
        console.warn('[pwa] could not message service worker', err)
      }

      // fallback navigation
      window.location.href = '/app'
    }

    window.openPwaApp = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const message = { type: 'focus-client', url: '/' }
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage(message)
            return
          }
          const reg = await navigator.serviceWorker.getRegistration()
          if (reg && reg.active) {
            reg.active.postMessage(message)
            return
          }
        }
      } catch (err) {
        console.warn('[pwa] could not message service worker', err)
      }
      window.location.href = '/'
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
          <a href="https://www.instagram.com/ferminotify/" target="_blank" rel="noopener noreferrer">
            <font-awesome-icon :icon="['fab', 'instagram']" />
          </a>
          <a href="https://github.com/ferminotify" target="_blank" rel="noopener noreferrer">
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

      <div v-if="showBigAlert" class="bigalert" id="alert_new_app_beta_251216">
        <div class="bigalert-inner">
          <div class="two-container" style="padding-bottom: 0.83em;">
            <h2 style="margin: 0;">Stai usando la nuova App! <span class="badge">beta</span></h2>
            <button @click="closeBigAlert" class="btn text" style="font-size: 1.5em;">&times;</button>
          </div>
          <h4 style="margin: 0; padding-bottom: 10px;">Novità</h4>
          <ul style="padding-bottom: 10px; margin: 0">
            <li><b>App</b>: installa la nuova App di Fermi Notify sul tuo dispositivo!</li>
            <li><b>Notifiche Push</b>: visita la dashboard per attivare le notifiche push!</li>
          </ul>
          <p style="padding-bottom: 10px;" class="primary-text"><span class="material-symbols-outlined">info</span> La nuova app è in beta testing.</p>
          <p style="padding-bottom: 10px;">Se riscontri problemi o hai suggerimenti, contattaci su Instagram
            <a class="link" href="https://www.instagram.com/ferminotify/" ><font-awesome-icon :icon="['fab', 'instagram']" ></font-awesome-icon> ferminotify</a>.</p>
          <p>Puoi usare la vecchia App su <a class="link" href="https://node.fn.lkev.in">node.fn.lkev.in</a>.</p>
          <div class="actions">
            <a class="btn outlined" href="https://github.com/ferminotify/frontend" target="_blank" rel="noopener noreferrer"><font-awesome-icon :icon="['fab', 'github']" ></font-awesome-icon> Open source</a>
            <button @click="closeBigAlert" class="btn filled">Chiudi</button>
          </div>
        </div>
      </div>
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


.bigalert{
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.bigalert-inner{
  max-width: 760px;
  width: 75%;
  padding: 25px 35px;
  border-radius: 25px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  background-color: var(--surface);
  color: #fff;
  line-height: 1.5;
  font-size: 16px;
}
.bigalert-inner p{
  text-align: justify;
}
.two-container{
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bigalert .badge{
  background-color: var(--primary);
  color: var(--on-primary);
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.5em;
}
.bigalert .actions{
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin: 15px 0;
}
.bigalert .actions .btn{
  line-height: initial;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media screen and (max-width: 400px) {
  .bigalert .btn{
    padding: 10px 15px;
  }
}
</style>
