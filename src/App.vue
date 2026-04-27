<script setup>
  import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
  import { RouterLink, RouterView, useRoute } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import { generateAlert } from '@/utils/alertbanner.js'
  import SondaggioDesktop from './components/SondaggioDesktop.vue'

  const route = useRoute()
  const user = useUserStore()

  // Initial loading screen for icons
  const iconsReady = ref(false)
  const skipLoading = ref(false)
  // random loading text
  const loadingText = ref('')
  {
    const loadingMessages = [
      'Stiamo preparando l\'app...',
      'Caricamento Fermi Notify...',
      'Caricamento in corso...',
      'Quasi pronto...',
      'Raccogliendo gli eventi...',
      'Sincronizzazione dei dati...',
      'Preparazione della dashboard...',
    ]
    loadingText.value = loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
  }
  const showSkipButton = ref(false)

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

  // Sliding indicator state
  const sidebarInner = ref(null)
  const indicatorStyle = ref({})
  const indicatorReady = ref(false)

  const updateIndicator = (initialLoad = false) => {
    if (!sidebarInner.value) return
    const activeEl = sidebarInner.value.querySelector('.sidebar-link.active')
    if (activeEl) {
      const parentRect = sidebarInner.value.getBoundingClientRect()
      // On mobile/tablet (<=1049px), target just the icon; on desktop target the whole link
      const isMobileOrTablet = window.innerWidth <= 1049
      const targetEl = isMobileOrTablet ? activeEl.querySelector('.sidebar-icon') : activeEl
      if (!targetEl) {
        indicatorStyle.value = { opacity: 0 }
        return
      }
      const targetRect = targetEl.getBoundingClientRect()
      
      if (initialLoad) {
        // First set position with scale 0, then animate to scale 1
        indicatorStyle.value = {
          top: `${targetRect.top - parentRect.top}px`,
          left: `${targetRect.left - parentRect.left}px`,
          width: `${targetRect.width}px`,
          height: `${targetRect.height}px`,
          opacity: 1,
          borderRadius: isMobileOrTablet ? '16px' : '999px',
          transform: 'scale(0)',
          transition: 'none'
        }
        // Trigger reflow, then animate
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            indicatorStyle.value = {
              ...indicatorStyle.value,
              transform: 'scale(1)',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1)'
            }
            nextTick(() => {
              indicatorReady.value = true
            })
          })
        })
      } else {
        indicatorStyle.value = {
          top: `${targetRect.top - parentRect.top}px`,
          left: `${targetRect.left - parentRect.left}px`,
          width: `${targetRect.width}px`,
          height: `${targetRect.height}px`,
          opacity: 1,
          borderRadius: isMobileOrTablet ? '16px' : '999px',
          transform: 'scale(1)'
        }
      }
    } else {
      indicatorStyle.value = { opacity: 0 }
    }
  }

  watch(() => route.path, () => {
    nextTick(updateIndicator)
  })

  // Mobile hide-on-scroll state
  const isMobile = ref(typeof window !== 'undefined' && window.innerWidth <= 600)
  const hideSidebarText = ref(false)
  let prevScroll = typeof window !== 'undefined' ? window.pageYOffset : 0

  // Hamburger menu state
  const menuOpen = ref(false)

  const closeMenu = () => {
    if (menuOpen.value) toggleMenu()
  }

  const toggleMenu = () => {
    const navLinks = document.querySelector('.nav-links')
    const hamburger = document.querySelector('.hamburger')
    const ul = navLinks?.querySelector('ul')
    const lis = ul?.querySelectorAll('li') || []

    if (menuOpen.value) {
      // Close menu with staggered animation
      Array.from(lis).reverse().forEach((li, i) => {
        setTimeout(() => {
          li.classList.add('li-inactive')
          li.classList.remove('li-active')
          li.style.visibility = 'hidden'
        }, 250 * i)
      })

      setTimeout(() => {
        navLinks?.classList.remove('active')
        navLinks?.classList.add('inactive')
      }, 250 * lis.length)

      hamburger?.querySelectorAll('.line').forEach(line => {
        line.classList.remove('line-pazzo')
      })

      menuOpen.value = false
    } else {
      // Open menu with staggered animation
      navLinks?.classList.remove('inactive')
      navLinks?.classList.add('active')

      hamburger?.querySelectorAll('.line').forEach(line => {
        line.classList.add('line-pazzo')
      })

      Array.from(lis).forEach((li, i) => {
        setTimeout(() => {
          li.classList.remove('li-inactive')
          li.classList.add('li-active')
          li.style.visibility = 'visible'
        }, 250 * i)
      })

      menuOpen.value = true
    }
  }

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
    nextTick(updateIndicator)
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

  const waitForIconsToLoad = () => {
    return new Promise((resolve) => {
      if (typeof document === 'undefined' || !document.fonts) {
        // Fallback for browsers without Font Loading API
        console.log('[icons] Font Loading API not available, proceeding')
        resolve()
        return
      }

      const timeout = setTimeout(() => {
        console.warn('[icons] Icon loading timeout, proceeding anyway')
        showSkipButton.value = true
        resolve()
      }, 5000)

      // Show skip button after 3 seconds
      const skipTimeout = setTimeout(() => {
        showSkipButton.value = true
      }, 3000)

      // Explicitly load the fonts we need
      const fontPromises = [
        document.fonts.load('16px "Material Symbols Outlined"'),
        // Try multiple Font Awesome variants
        Promise.any([
          document.fonts.load('16px "Font Awesome 6 Brands"'),
          document.fonts.load('16px "Font Awesome 5 Brands"'),
          document.fonts.load('16px FontAwesome')
        ]).catch(() => Promise.resolve()) // Don't fail if FA isn't found
      ]

      Promise.all(fontPromises)
        .then(() => {
          clearTimeout(timeout)
          clearTimeout(skipTimeout)
          console.log('[icons] All icons loaded successfully')
          resolve()
        })
        .catch((err) => {
          clearTimeout(timeout)
          clearTimeout(skipTimeout)
          console.warn('[icons] Font loading failed, proceeding anyway', err)
          resolve()
        })
    })
  }

  onMounted(async () => {
    if (typeof window === 'undefined') return

    // Wait for icons to load before showing the app
    // Ensure the loading screen is visible for at least minLoadingMs milliseconds
    const minLoadingMs = 500
    const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
    await waitForIconsToLoad()
    const end = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
    const elapsed = end - start
    if (elapsed < minLoadingMs) {
      await new Promise((r) => setTimeout(r, Math.ceil(minLoadingMs - elapsed)))
    }
    iconsReady.value = true

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

    // Initialize indicator position without transition (small delay to ensure DOM is ready)
    setTimeout(() => updateIndicator(true), 50)
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
  <!-- Loading screen for icons -->
  <div v-if="!iconsReady && !skipLoading" class="icon-loading-screen">
    <div class="icon-loading-container">
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
        <p class="loading-text">{{ loadingText }}</p>
        <button v-if="showSkipButton" @click="skipLoading = true" class="skip-loading-btn">
          Salta attesa
        </button>
      </div>
    </div>
  </div>

  <header v-show="iconsReady || skipLoading">
    <div class="sidebar" :class="{ compact: hideSidebarText, mobile: isMobile }" style="padding-right: 6px; /* padding for bounce animation */">
      <div class="sidebar-inner" ref="sidebarInner">
        <div class="sidebar-indicator" :style="indicatorStyle"></div>
        <RouterLink to="/" custom v-slot="{ href, navigate, isExactActive }">
          <a :href="href" @click="navigate" class="sidebar-link" id="cercaeventi" :class="{ active: isExactActive }" >
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

        <RouterLink v-if="!isStandalone" to="/app" custom v-slot="{ href, navigate, isExactActive }">
          <a :href="href" @click="installApp(navigate, $event)" class="sidebar-link" id="app" :class="{ active: isExactActive }">
            <span class="material-symbols-outlined sidebar-icon">download</span>
            <span class="sidebar-link-text">Installa l'app</span>
          </a>
        </RouterLink>

        <RouterLink to="/faq" custom v-slot="{ href, navigate, isExactActive }">
          <a :href="href" @click="navigate" class="sidebar-link sidebar-desktop" id="faq" :class="{ active: isExactActive }">
            <span class="material-symbols-outlined sidebar-icon">help_center</span>
            <span class="sidebar-link-text">FAQ</span>
          </a>
        </RouterLink>

        <RouterLink to="/supporters" custom v-slot="{ href, navigate, isExactActive }">
          <a :href="href" @click="navigate" class="sidebar-link sidebar-desktop" id="supporters" :class="{ active: isExactActive }">
            <span class="material-symbols-outlined sidebar-icon">favorite</span>
            <span class="sidebar-link-text">Supporta</span>
          </a>
        </RouterLink>

        <RouterLink to="/team" custom v-slot="{ href, navigate, isExactActive }">
          <a :href="href" @click="navigate" class="sidebar-link sidebar-desktop" id="team" :class="{ active: isExactActive }">
            <span class="material-symbols-outlined sidebar-icon">group</span>
            <span class="sidebar-link-text">Team</span>
          </a>
        </RouterLink>

        <RouterLink to="/archive" custom v-slot="{ href, navigate, isExactActive }">
          <a :href="href" @click="navigate" class="sidebar-link sidebar-desktop" id="archive" :class="{ active: isExactActive }">
            <span class="material-symbols-outlined sidebar-icon">archive</span>
            <span class="sidebar-link-text">Archivio</span>
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

        <div class="sidebar-link sidebar-menu sidebar-mobile" id="menu">
          <a class="hamburger" @click="toggleMenu">
            <span class="line"></span>
            <span class="line"></span>
            <span class="line"></span>
          </a>
          <div class="nav-links">
            <ul>
              <li>
                <RouterLink to="/faq" class="sidebar-menu-link" @click="closeMenu">
                  <span class="material-symbols-outlined">help_center</span> FAQ
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/supporters" class="sidebar-menu-link" @click="closeMenu">
                  <span class="material-symbols-outlined">favorite</span> Supporta
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/team" class="sidebar-menu-link" @click="closeMenu">
                  <span class="material-symbols-outlined">group</span> Team
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/archive" class="sidebar-menu-link" @click="closeMenu">
                  <span class="material-symbols-outlined">archive</span> Archivio
                </RouterLink>
              </li>
              <li>
                <div class="sidebar-link sidebar-contatti">
                  <RouterLink to="/ig" target="_blank" @click="closeMenu">
                    <font-awesome-icon :icon="['fab', 'instagram']" />
                  </RouterLink>
                  <RouterLink to="/gh" target="_blank" @click="closeMenu">
                    <font-awesome-icon :icon="['fab', 'github']" />
                  </RouterLink>
                </div>
              </li>
            </ul>
          </div>
          <span class="sidebar-link-text">Menu</span>
        </div>
      </div>
      <SondaggioDesktop />
    </div>
  </header>

  <div class="main-container" v-show="iconsReady || skipLoading">
    <main class="main">
      <RouterView v-slot="{ Component, route: viewRoute }">
        <Transition appear mode="out-in" name="fade-up">
          <div :key="viewRoute.path" style="width: 100%;">
            <component :is="Component" />
          </div>
        </Transition>
      </RouterView>
      <!--div v-if="showBigAlert" class="bigalert" id="alert_new_app_beta_251216">
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
      </div-->
      
    </main>
  </div>
</template>

<style scoped>
/* Sliding indicator for active sidebar link */
.sidebar-indicator {
  position: absolute;
  background: var(--primary);
  border-radius: 999px;
  opacity: 0; /* Start hidden, JS will reveal it */
  transition: top 0.5s cubic-bezier(0.34, 1.4, 0.64, 1),
              left 0.5s cubic-bezier(0.34, 1.4, 0.64, 1),
              width 0.5s cubic-bezier(0.34, 1.4, 0.64, 1),
              height 0.5s cubic-bezier(0.34, 1.4, 0.64, 1),
              transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1),
              border-radius 0.3s ease,
              opacity 0.3s ease;
  z-index: 0;
  pointer-events: none;
}

.sidebar-inner {
  position: relative;
}

.sidebar-link {
  position: relative;
  z-index: 1;
  -webkit-tap-highlight-color: transparent;
}

/* Let desktop sidebar widgets overflow above main content (handle sondaggio) */
@media screen and (min-width: 1050px) {
  .sidebar {
    overflow: visible;
  }
}

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

/* Mobile/Desktop visibility */
.sidebar-mobile {
  display: none;
}

@media screen and (max-width: 700px) {
  .sidebar-desktop {
    display: none !important;
  }
  .sidebar-mobile {
    display: flex !important;
  }
}

/* Hamburger menu link styling */
.sidebar-menu-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  color: var(--on-surface);
  text-decoration: none;
  white-space: nowrap;
}
.sidebar-menu-link:hover {
  color: var(--on-surface-primary);
}
.sidebar-menu-link .material-symbols-outlined {
  font-size: 20px;
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

/* Icon Loading Screen */
.icon-loading-screen {
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

.icon-loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
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
  min-height: 24px;
  min-width: 240px;
  animation: fadeInOut 0.6s ease-in-out infinite;
}

.skip-loading-btn {
  margin-top: 12px;
  padding: 10px 24px;
  background-color: var(--primary);
  color: var(--on-primary);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: slideUp 0.3s ease;
}

.skip-loading-btn:hover {
  background-color: var(--primary-dark, var(--primary));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.skip-loading-btn:active {
  transform: translateY(0);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInOut {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

/* LDS Grid animation */
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

.lds-grid div:nth-child(1) {
  left: 8px;
  top: 8px;
  animation-delay: 0s;
}

.lds-grid div:nth-child(2) {
  left: 32px;
  top: 8px;
  animation-delay: -0.4s;
}

.lds-grid div:nth-child(3) {
  left: 56px;
  top: 8px;
  animation-delay: -0.8s;
}

.lds-grid div:nth-child(4) {
  left: 8px;
  top: 32px;
  animation-delay: -0.4s;
}

.lds-grid div:nth-child(5) {
  left: 32px;
  top: 32px;
  animation-delay: -0.8s;
}

.lds-grid div:nth-child(6) {
  left: 56px;
  top: 32px;
  animation-delay: -1.2s;
}

.lds-grid div:nth-child(7) {
  left: 8px;
  top: 56px;
  animation-delay: -0.8s;
}

.lds-grid div:nth-child(8) {
  left: 32px;
  top: 56px;
  animation-delay: -1.2s;
}

.lds-grid div:nth-child(9) {
  left: 56px;
  top: 56px;
  animation-delay: -1.6s;
}

@keyframes lds-grid {
  0%, 100% {
    opacity: 1;
  }
  33.33% {
    opacity: 0.5;
  }
  66.66% {
    opacity: 0.1;
  }
}
</style>
