import { api } from './api'

export const dashboardService = {
  summary: () => api.get('/dashboard/summary').then((response) => response.data),
}

export const usersService = {
  list: (params = {}) => api.get('/users', { params }).then((response) => response.data),
  drivers: () => api.get('/users/drivers').then((response) => response.data),
  create: (payload) => api.post('/users', payload).then((response) => response.data),
  update: (userId, payload) =>
    api.patch(`/users/${userId}`, payload).then((response) => response.data),
  deactivate: (userId) =>
    api.post(`/users/${userId}/deactivate`).then((response) => response.data),
  remove: (userId) => api.delete(`/users/${userId}`).then((response) => response.data),
}

export const reportsService = {
  overview: (days = 30) =>
    api.get('/reports/overview', { params: { days } }).then((response) => response.data),
}
