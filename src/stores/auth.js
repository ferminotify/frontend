import { defineStore } from 'pinia'
import { login, logout } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(email, password) {
      const data = await login(email, password)
      this.token = data.token
      this.user = data.user
      localStorage.setItem('token', data.token)
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      logout()
    },
  },
})
