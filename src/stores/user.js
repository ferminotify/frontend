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
      const res = await axios.post(`${API_URL}/user/auth/login`, { email, password })
      this.token = res.data.token
      this.refreshToken = res.data.refreshToken
      localStorage.setItem('token', this.token)
      localStorage.setItem('refreshToken', this.refreshToken)
      await this.fetchProfile()
    },

    async refreshAccessToken() {
      const res = await axios.post(`${API_URL}/user/auth/refresh_token`, {
        refreshToken: this.refreshToken,
      })
      this.token = res.data.token
      localStorage.setItem('token', this.token)
    },

    async fetchProfile() {
      const res = await api.get(`${API_URL}/user/auth/profile`)
      this.user = res.data
    },

    async addKeyword(keyword) {
      if (!keyword) return
      await api.put(`${API_URL}/user/keyword/add`, { keyword })
      const current = Array.isArray(this.user?.keywords) ? this.user.keywords : []
      this.user = { ...(this.user || {}), keywords: [...current, keyword] }
    },

    async deleteKeyword(keyword) {
      if (!keyword) return
      await api.delete(`${API_URL}/user/keyword/delete`, { data: { keyword } })
      const current = Array.isArray(this.user?.keywords) ? this.user.keywords : []
      this.user = { ...(this.user || {}), keywords: current.filter((k) => k !== keyword) }
    },

    async updateNotificationPreferences(preferences) {
      let option;
      try{
        if(preferences.email && preferences.telegram) // email + telegram
            option = 3;
        else if(preferences.email && !preferences.telegram) // email
            option = 2;
        else if(!preferences.email && preferences.telegram) // telegram
            option = 1;
        else if(!preferences.email && !preferences.telegram) // none
            option = 0;
      } catch (error) {
        console.error('Error determining notification preferences option:', error);
        return;
      }
      try {
        await api.post(`${API_URL}/user/notification-preferences`, { "option": option })
        if (this.user) {
          this.user = { ...this.user, notification_preferences: preferences }
        }
      } catch (error) {
        console.error('Error updating notification preferences:', error);
      }
    },

    async toggleProbableNotifications() {
      await api.post(`${API_URL}/user/toggle-probable-notifications`)
      if (this.user) {
        this.user = { ...this.user, include_similar_tags: !this.user.include_similar_tags }
      }
    },

    async updateNotificationTime(time, dayBefore) {
      await api.post(`${API_URL}/user/notification-time`, { time, day: dayBefore })
      if (this.user) {
        this.user = { ...this.user, notification_time: time, notification_day_before: dayBefore }
      }
    },

    async updateProfile(data) {
      await api.post(`${API_URL}/user/edit`, data)
      if (this.user) {
        this.user = { ...this.user, ...data }
      }
    },

    async logout() {
      if (this.refreshToken) {
        await axios.post(`${API_URL}/user/auth/logout`, { refreshToken: this.refreshToken })
      }
      this.token = null
      this.refreshToken = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },
  },
})
