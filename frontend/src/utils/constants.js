export const PARCEL_STATUS = {
  CREATED: {
    label: 'Created',
    hint: 'Awaiting pickup',
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    dot: 'bg-slate-400',
    solid: 'bg-slate-400',
  },
  PICKED_UP: {
    label: 'Picked up',
    hint: 'Collected from sender',
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    dot: 'bg-indigo-500',
    solid: 'bg-indigo-500',
  },
  IN_TRANSIT: {
    label: 'In transit',
    hint: 'Moving between hubs',
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
    solid: 'bg-sky-500',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for delivery',
    hint: 'On the final leg',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
    solid: 'bg-amber-500',
  },
  DELIVERED: {
    label: 'Delivered',
    hint: 'Handed to receiver',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    solid: 'bg-emerald-500',
  },
  FAILED: {
    label: 'Failed',
    hint: 'Delivery attempt failed',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
    solid: 'bg-rose-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    hint: 'Booking cancelled',
    badge: 'bg-slate-100 text-slate-500 ring-slate-200',
    dot: 'bg-slate-400',
    solid: 'bg-slate-400',
  },
}

export const STATUS_ORDER = [
  'CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]

export const STATUS_OPTIONS = Object.entries(PARCEL_STATUS).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

export const ROLE_LABEL = {
  admin: 'Administrator',
  driver: 'Driver',
  customer: 'Customer',
}

export const ROLE_BADGE = {
  admin: 'bg-ink-900 text-white ring-ink-900',
  driver: 'bg-sky-50 text-sky-700 ring-sky-200',
  customer: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export const CHART_COLORS = {
  CREATED: '#94a3b8',
  PICKED_UP: '#3E4BA8',
  IN_TRANSIT: '#2D7BA8',
  OUT_FOR_DELIVERY: '#B0852F',
  DELIVERED: '#2F7D5B',
  FAILED: '#8A2F42',
  CANCELLED: '#C9C2B0',
}
