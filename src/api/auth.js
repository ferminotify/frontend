import api from '@/api/axios'
import { API_URL } from '@/utils/config'

export async function registerUser(payload) {
  const res = await api.put(`${API_URL}/user/auth/register`, payload)
  return res.data
}

export async function confirmEmail(code) {
  const res = await api.get(`${API_URL}/user/auth/register/confirmation/${code}`)
  return res.data
}

export async function loginUser(email, password) {
  const res = await api.post(`${API_URL}/user/auth/login`, { email, password })
  return res.data
}

export async function refreshAccessToken(refreshToken) {
  const res = await api.post(`${API_URL}/user/auth/refresh_token`, { refreshToken })
  return res.data
}

export async function logoutUser(refreshToken) {
  const res = await api.post(`${API_URL}/user/auth/logout`, { refreshToken })
  return res.data
}

export async function requestPasswordReset(email) {
  const res = await api.post(`${API_URL}/user/auth/reset_password`, { email })
  return res.data
}
