import { useEffect, useRef } from 'react'
import { animate, stagger, utils } from 'animejs'
import { useReducedMotion } from './useReducedMotion'

/**
 * Scroll-triggered reveal powered by IntersectionObserver + Anime.js.
 *
 * Every element matching `selector` inside the returned ref fades and rises in
 * with a stagger the first time the container enters the viewport. With
 * reduced motion enabled the final state is applied immediately.
 */
export function useReveal({
  selector = '[data-reveal]',
  y = 20,
  duration = 720,
  staggerMs = 80,
  threshold = 0.15,
} = {}) {
  const rootRef = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const targets = Array.from(root.querySelectorAll(selector))
    if (targets.length === 0) return undefined

    if (reduced) {
      utils.set(targets, { opacity: 1, translateY: 0 })
      return undefined
    }

    utils.set(targets, { opacity: 0, translateY: y })

    let revealed = false
    const observer = new IntersectionObserver(
      (entries) => {
        if (revealed) return
        if (!entries.some((entry) => entry.isIntersecting)) return
        revealed = true
        animate(targets, {
          opacity: [0, 1],
          translateY: [y, 0],
          duration,
          delay: stagger(staggerMs),
          ease: 'outCubic',
        })
        observer.disconnect()
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [selector, y, duration, staggerMs, threshold, reduced])

  return rootRef
}
