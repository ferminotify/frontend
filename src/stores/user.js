import { defineStore } from 'pinia'
import api from '@/api/axios'
import axios from 'axios'
import { API_URL } from '@/utils/config'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: null,
  }),

  actions: {
    async login(email, password) {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password })
      this.token = res.data.token
      this.refreshToken = res.data.refreshToken
      localStorage.setItem('token', this.token)
      localStorage.setItem('refreshToken', this.refreshToken)
      await this.fetchProfile()
    },

    async refreshAccessToken() {
      const res = await axios.post(`${API_URL}/auth/refresh_token`, {
        refreshToken: this.refreshToken,
      })
      this.token = res.data.token
      localStorage.setItem('token', this.token)
    },

    async fetchProfile() {
      const res = await api.get(`${API_URL}/auth/profile`)
      this.user = res.data
    },

    async addKeyword(keyword) {
      if (!keyword) return
      await api.put(`${API_URL}/keyword/add`, { keyword })
      const current = Array.isArray(this.user?.tags) ? this.user.tags : []
      this.user = { ...(this.user || {}), tags: [...current, keyword] }
    },

    async deleteKeyword(keyword) {
      if (!keyword) return
      await api.delete(`${API_URL}/keyword/delete`, { data: { keyword } })
      const current = Array.isArray(this.user?.tags) ? this.user.tags : []
      this.user = { ...(this.user || {}), tags: current.filter((k) => k !== keyword) }
    },

    async logout() {
      if (this.refreshToken) {
        await axios.post(`${API_URL}/auth/logout`, { refreshToken: this.refreshToken })
      }
      this.token = null
      this.refreshToken = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },
  },
})
