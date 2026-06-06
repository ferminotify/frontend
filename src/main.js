// Import stylesheets
import './assets/css/style.css'
import './assets/css/dark.css'
import './assets/css/material-icons.css'
import './assets/css/alertbanner.css'

import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'

import App from './App.vue'
import { routes, setupRouter } from './router'

import { useUserStore } from '@/stores/user'
import { subscribeUser } from '@/stores/push'

// Font Awesome
import { library, config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faInstagram, faGithub, faXTwitter, faGoogle } from '@fortawesome/free-brands-svg-icons'
library.add(faInstagram, faGithub, faXTwitter, faGoogle)

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js')
    try {
      const storedEndpoint = localStorage.getItem('endpoint') || null
      const existingSub = await registration.pushManager.getSubscription()
      if (!existingSub || existingSub.endpoint !== storedEndpoint) {
        await subscribeUser(true)
      } else {
        console.log('[push] Existing subscription matches stored endpoint — skipping subscribeUser')
      }
    } catch (e) {
      console.warn('[push] Error checking push subscription after SW registration', e)
    }
  } catch (err) {
    console.error('SW registration failed:', err)
  }
}

export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL },
  ({ app, router }) => {
    const pinia = createPinia()
    app.use(pinia)

    app.component('font-awesome-icon', FontAwesomeIcon)

    setupRouter(router)

    if (!import.meta.env.SSR) {
      const store = useUserStore(pinia)
      if (store.token) {
        store.fetchProfile().catch(() => store.logout())
      }

      if (document.readyState === 'complete') {
        registerServiceWorker()
      } else {
        window.addEventListener('load', registerServiceWorker)
      }
    }
  },
)
