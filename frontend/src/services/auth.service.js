import { api } from './api'

export const authService = {
  login: ({ email, password }) =>
    api.post('/auth/login', { email, password }).then((response) => response.data),
  register: (payload) => api.post('/auth/register', payload).then((response) => response.data),
  me: () => api.get('/auth/me').then((response) => response.data),
  changePassword: (payload) =>
    api.post('/auth/change-password', payload).then((response) => response.data),
}
