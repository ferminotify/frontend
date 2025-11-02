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

// Font Awesome imports
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faInstagram, faGithub } from '@fortawesome/free-brands-svg-icons'
import { faRightToBracket } from '@fortawesome/free-solid-svg-icons'

// Add icons to library
library.add(faInstagram, faGithub, faRightToBracket)

// Create the Vue app
const app = createApp(App)

// Register global plugins
app.use(createPinia())
app.use(router)

// Register FontAwesome component globally
app.component('font-awesome-icon', FontAwesomeIcon)

// Mount the app
app.mount('#app')
