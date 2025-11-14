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
      const current = Array.isArray(this.user?.keywords) ? this.user.keywords : []
      this.user = { ...(this.user || {}), keywords: [...current, keyword] }
    },

    async deleteKeyword(keyword) {
      if (!keyword) return
      await api.delete(`${API_URL}/keyword/delete`, { data: { keyword } })
      const current = Array.isArray(this.user?.keywords) ? this.user.keywords : []
      this.user = { ...(this.user || {}), keywords: current.filter((k) => k !== keyword) }
    },

    async updateNotificationPreferences(preferences) {
      await api.post(`${API_URL}/auth/notification-preferences`, preferences)
      if (this.user) {
        this.user = { ...this.user, notification_preferences: preferences }
      }
    },

    async toggleProbableNotifications() {
      await api.post(`${API_URL}/auth/toggle-probable-notifications`)
      if (this.user) {
        this.user = { ...this.user, include_similar_tags: !this.user.include_similar_tags }
      }
    },

    async updateNotificationTime(time, dayBefore) {
      await api.post(`${API_URL}/auth/notification-time`, { time, day: dayBefore })
      if (this.user) {
        this.user = { ...this.user, notification_time: time, notification_day_before: dayBefore }
      }
    },

    async updateProfile(data) {
      await api.post(`${API_URL}/auth/edit`, data)
      if (this.user) {
        this.user = { ...this.user, ...data }
      }
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
