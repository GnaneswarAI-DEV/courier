/** Mirrors the backend heuristic: "street, city[, state/postcode]". */
export function cityOf(address = '') {
  const parts = String(address)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return 'Unknown'
  return parts.length >= 2 ? parts[1] : parts[0]
}
