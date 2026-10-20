import { defineStore } from 'pinia'
import api from '@/api/axios'
import axios from 'axios'
import { API_URL } from '@/utils/config'

const MOODLE_SIGNUP_KEY = 'moodleSignup'

export const useUserStore = defineStore('user', {
  getters: {
    genderLetter: (state) => {
      const g = state.user?.gender
      if (!g) return 'ǝ'
      if (g === 'M') return 'o'
      if (g === 'F') return 'a'
      return 'ǝ'
    },
    telegramConnected: (state) => {
      const tg = state.user?.telegram || ''
      return tg.length > 0 && tg.charAt(0) !== 'X'
    },
  },
  state: () => {
    const isClient = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function'
    return {
      token: isClient ? localStorage.getItem('token') : null,
      refreshToken: isClient ? localStorage.getItem('refreshToken') : null,
      user: null,
      firstLogin: false,
    }
  },

  actions: {
    async register({ name, surname, email, password, password2, gender }) {
      try {
        const res = await axios.put(`${API_URL}/user/auth/register`, {
          name,
          surname,
          email,
          password,
          password2,
          gender,
        })
        return res.data
      } catch (err) {
        const msg = err?.response?.data?.error || 'Errore durante la registrazione'
        throw new Error(msg)
      }
    },
    async confirmEmail(code) {
      try {
        const res = await axios.get(`${API_URL}/user/auth/register/confirmation/${code}`)
        return res.data
      } catch (err) {
        const msg = err?.response?.data?.error || 'Errore durante la conferma email'
        throw new Error(msg)
      }
    },
    async login(email, password) {
      const res = await axios.post(`${API_URL}/user/auth/login`, { email, password }) // POST login endpoint
      this.token = res.data.token // JWT token 1h
      this.onboarding = !!res.data.onboarding
      // Moodle account: the password was checked on the school site, keep that session
      if (res.data.ticket) {
        const { setSchoolTicket } = await import('@/api/timetable')
        setSchoolTicket(res.data.ticket)
      }
      localStorage.setItem('token', this.token)
      await this.fetchProfile()
      return res.data
    },
    async requestPasswordReset(email) {
      try{
        const res = await axios.post(`${API_URL}/user/auth/request-change-password`, { email })
        return res.data
      } catch (err) {
        const msg = err?.response?.data?.error || 'Errore durante la richiesta di reset della password'
        throw new Error(msg)
      }
    },

    async refreshAccessToken() {
      const res = await axios.post(`${API_URL}/user/auth/refresh_token`, {}, { withCredentials: true }) // send cookies
      this.token = res.data.token
      localStorage.setItem('token', this.token)
    },

    async fetchProfile() {
      const res = await api.get(`${API_URL}/user/profile`)
      this.user = res.data
    },

    // Redirect the browser to the backend Google OAuth entry point.
    loginWithGoogle() {
      window.location.href = `${API_URL}/user/auth/google`
    },

    // "Accedi con Moodle": checked on the school site by the backend. A known account is
    // logged in; a new one gets a signup token and goes to the profile step.
    // Either way the school session (ticket) is kept, so the timetable shows teachers
    // from the user's own session.
    async loginWithMoodle(username, password) {
      const res = await axios.post(`${API_URL}/user/auth/moodle`, { username, password })
      const { setSchoolTicket } = await import('@/api/timetable')
      if (res.data.ticket) setSchoolTicket(res.data.ticket)
      if (res.data.signup) {
        sessionStorage.setItem(MOODLE_SIGNUP_KEY, res.data.signup)
        return { signup: true }
      }
      this.token = res.data.token
      this.onboarding = !!res.data.onboarding
      localStorage.setItem('token', this.token)
      await this.fetchProfile()
      return { signup: false }
    },

    hasMoodleSignup() {
      try {
        return Boolean(sessionStorage.getItem(MOODLE_SIGNUP_KEY))
      } catch {
        return false
      }
    },

    async completeMoodleSignup({ name, surname, gender, email }) {
      const signup = sessionStorage.getItem(MOODLE_SIGNUP_KEY)
      const res = await axios.post(`${API_URL}/user/auth/moodle/complete`, { signup, name, surname, gender, email })
      sessionStorage.removeItem(MOODLE_SIGNUP_KEY)
      // The email already has an account: its owner links Moodle from the email we sent.
      // New account: it enters once the email is confirmed (no session yet).
      if (res.data.linkSent || res.data.confirmSent) return res.data
      this.token = res.data.token
      this.onboarding = !!res.data.onboarding
      localStorage.setItem('token', this.token)
      await this.fetchProfile()
      return res.data
    },

    // "Collega Moodle" (link from the email): links Moodle to the account and logs in.
    async linkMoodle(token) {
      const res = await axios.post(`${API_URL}/user/auth/moodle/link`, { token })
      this.token = res.data.token
      this.onboarding = !!res.data.onboarding
      localStorage.setItem('token', this.token)
      await this.fetchProfile()
    },

    async moodleLinkInfo(token) {
      const res = await axios.post(`${API_URL}/user/auth/moodle/link/info`, { token })
      return res.data
    },

    async completeProfile({ name, surname, gender, password, password2 }) {
      const res = await api.post(`${API_URL}/user/complete-profile`, { name, surname, gender, password, password2 })
      this.onboarding = !!res.data?.onboarding
      if (this.user) {
        this.user = { ...this.user, name, surname, gender, profile_complete: true }
      }
      return res.data
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
        await api.post(`${API_URL}/user/preferences/notification-preferences`, { "option": option })
        if (this.user) {
          this.user = { ...this.user, notification_preferences: option }
        }
      } catch (error) {
        console.error('Error updating notification preferences:', error);
      }
    },

    async toggleProbableNotifications() {
      await api.post(`${API_URL}/user/preferences/toggle-probable-notifications`)
      if (this.user) {
        this.user = { ...this.user, include_similar_tags: !this.user.include_similar_tags }
      }
    },

    async updateNotificationTime(time, dayBefore) {
      await api.post(`${API_URL}/user/preferences/notification-time`, { time, day: dayBefore })
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
        // use the authenticated api instance so the access token (Bearer) is sent
        await api.post(`${API_URL}/user/auth/logout`, { refreshToken: this.refreshToken })
      }
      // The school session from "Accedi con Moodle" goes too
      const { schoolLogout, schoolTicket } = await import('@/api/timetable')
      if (schoolTicket.value) await schoolLogout()
      this.token = null
      this.refreshToken = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },
  },
})
