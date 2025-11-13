// Import stylesheets
import './assets/css/style.css'
import './assets/css/dark.css'
import './assets/css/material-icons.css'
import './assets/css/alertbanner.css'

// Vue core imports
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { useUserStore } from '@/stores/user'

// Font Awesome imports
import { library, config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
// Prevent the core from auto-injecting CSS since we import it explicitly above
config.autoAddCss = false
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faInstagram, faGithub } from '@fortawesome/free-brands-svg-icons'
// Add icons to library
library.add(faInstagram, faGithub)

// Create the Vue app
const app = createApp(App)

// Register global plugins
const pinia = createPinia()
app.use(pinia)

// Initialize store AFTER pinia is installed
const store = useUserStore(pinia)
if (store.token) {
  store.fetchProfile().catch(() => {
    store.logout()
  })
}
app.use(router)

// Register FontAwesome component globally
app.component('font-awesome-icon', FontAwesomeIcon)

// Mount the app
app.mount('#app')
