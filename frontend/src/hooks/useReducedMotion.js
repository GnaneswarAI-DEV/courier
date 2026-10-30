import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Synchronous check used when the very first render has to decide whether an
 * animation runs at all (for example the landing-page intro).
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  const media = window.matchMedia(QUERY)
  return Boolean(media?.matches)
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const media = window.matchMedia(QUERY)
    if (!media || typeof media.addEventListener !== 'function') return undefined

    const handler = (event) => setReduced(event.matches)
    setReduced(Boolean(media.matches))
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  return Boolean(reduced)
}
