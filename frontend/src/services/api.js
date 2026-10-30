import axios from 'axios'

export const TOKEN_STORAGE_KEY = 'cpt.token'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = error?.config?.url || ''
    const isLoginAttempt = url.includes('/auth/login') || url.includes('/auth/register')
    if (status === 401 && !isLoginAttempt && localStorage.getItem(TOKEN_STORAGE_KEY)) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      window.dispatchEvent(new Event('auth:expired'))
    }
    return Promise.reject(error)
  },
)

/**
 * Turns any axios failure into a single human readable sentence.
 * Field-level validation errors from the API are joined for the form summary.
 */
export function apiError(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.error) {
    const { detail, fields } = error.response.data.error
    if (Array.isArray(fields) && fields.length > 0) {
      return fields.map((field) => `${field.field}: ${field.message}`).join(' · ')
    }
    if (detail) return detail
  }
  if (error?.code === 'ECONNABORTED') {
    return 'The server took too long to respond. Please try again.'
  }
  if (!error?.response) {
    return 'Cannot reach the server. Check your connection and try again.'
  }
  return fallback
}
