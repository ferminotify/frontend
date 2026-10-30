import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  // Dev server behind a reverse proxy (staging): set VITE_ALLOWED_HOSTS / VITE_HMR_CLIENT_PORT.
  server: {
    allowedHosts: process.env.VITE_ALLOWED_HOSTS?.split(','),
    hmr: process.env.VITE_HMR_CLIENT_PORT ? { clientPort: Number(process.env.VITE_HMR_CLIENT_PORT) } : undefined,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    dirStyle: 'nested',
    includedRoutes(paths, routes) {
      return ['/', '/orario', '/faq', '/app', '/team', '/supporters', '/archive']
    },
  },
})
