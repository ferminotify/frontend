import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { API_URL } from '@/utils/config'
import router from '@/router'

axios.defaults.withCredentials = true; // send cookies with requests

const api = axios.create({
  baseURL: API_URL,
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const store = useUserStore()
  if (store.token) {
    config.headers.Authorization = `Bearer ${store.token}`
  }
  return config
})

// Handle expired tokens automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const store = useUserStore()
    const originalRequest = error.config
    // Prevent multiple redirect loops
    if (!api._redirecting) api._redirecting = false

    // If token expired
    const status = error?.response?.status
    if (error.response && (status === 403 || status === 401) && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await store.refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${store.token}`
        return api(originalRequest)
      } catch (err) {
        if (!api._redirecting) {
          api._redirecting = true
          await store.logout()
          // Use client-side navigation to avoid full-page reloads
          router.push('/login').finally(() => {
            api._redirecting = false
          })
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
