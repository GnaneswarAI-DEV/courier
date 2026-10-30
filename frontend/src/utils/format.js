const DATE_OPTIONS = { day: 'numeric', month: 'short', year: 'numeric' }
const TIME_OPTIONS = { hour: 'numeric', minute: '2-digit' }

/**
 * The API returns naive UTC timestamps (no offset). Appending "Z" keeps the
 * browser from interpreting them as local time.
 */
export function parseApiDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value)
  const date = new Date(hasZone ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value) {
  const date = parseApiDate(value)
  return date ? date.toLocaleDateString(undefined, DATE_OPTIONS) : '—'
}

export function formatDateTime(value) {
  const date = parseApiDate(value)
  if (!date) return '—'
  return `${date.toLocaleDateString(undefined, DATE_OPTIONS)}, ${date.toLocaleTimeString(
    undefined,
    TIME_OPTIONS,
  )}`
}

export function formatRelative(value) {
  const date = parseApiDate(value)
  if (!date) return '—'
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.round(diffMs / 60000)
  if (Math.abs(minutes) < 1) return 'just now'
  if (Math.abs(minutes) < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return `${days}d ago`
  return formatDate(value)
}

export function formatWeight(kg) {
  const value = Number(kg)
  if (!Number.isFinite(value)) return '—'
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`
}

export function formatNumber(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0'
  return number.toLocaleString()
}

export function formatPercent(value) {
  if (value === null || value === undefined) return '—'
  return `${Number(value).toFixed(1)}%`
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function titleCase(value = '') {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
