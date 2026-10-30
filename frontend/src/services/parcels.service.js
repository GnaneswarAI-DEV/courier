import { api } from './api'

function buildQuery(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export const parcelsService = {
  list: (params) => api.get(`/parcels${buildQuery(params)}`).then((response) => response.data),
  get: (trackingNumber) =>
    api.get(`/parcels/${encodeURIComponent(trackingNumber)}`).then((response) => response.data),
  create: (payload) => api.post('/parcels', payload).then((response) => response.data),
  update: (trackingNumber, payload) =>
    api
      .patch(`/parcels/${encodeURIComponent(trackingNumber)}`, payload)
      .then((response) => response.data),
  changeStatus: (trackingNumber, payload) =>
    api
      .post(`/parcels/${encodeURIComponent(trackingNumber)}/status`, payload)
      .then((response) => response.data),
  assignDriver: (trackingNumber, driverId) =>
    api
      .post(`/parcels/${encodeURIComponent(trackingNumber)}/assign`, { driver_id: driverId })
      .then((response) => response.data),
  remove: (trackingNumber) =>
    api.delete(`/parcels/${encodeURIComponent(trackingNumber)}`).then((response) => response.data),
}

export const trackingService = {
  track: (trackingNumber) =>
    api
      .get(`/tracking/${encodeURIComponent(trackingNumber.trim().toUpperCase())}`)
      .then((response) => response.data),
}
