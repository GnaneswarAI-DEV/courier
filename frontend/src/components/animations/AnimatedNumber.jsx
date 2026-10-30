import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const defaultFormat = (current) => Math.round(current).toLocaleString()

/**
 * Counts a statistic up with Anime.js.
 *
 * The animated value is written straight to the DOM node: driving this through
 * React state would re-render the surrounding card ~60 times per second for a
 * purely decorative effect.
 */
export default function AnimatedNumber({
  value = 0,
  duration = 1000,
  format = defaultFormat,
  className,
  animateOnView = false,
}) {
  const target = Number(value) || 0
  const reduced = useReducedMotion()
  const nodeRef = useRef(null)
  const formatRef = useRef(format)
  formatRef.current = format

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return undefined

    const write = (current) => {
      node.textContent = formatRef.current(current)
    }

    if (reduced || target === 0) {
      write(target)
      return undefined
    }

    let animation = null
    let observer = null

    const start = () => {
      const counter = { v: 0 }
      write(0)
      animation = animate(counter, {
        v: target,
        duration,
        ease: 'outExpo',
        onUpdate: () => write(counter.v),
        onComplete: () => write(target),
      })
    }

    if (!animateOnView) {
      start()
    } else {
      write(0)
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return
          observer.disconnect()
          observer = null
          start()
        },
        { threshold: 0.4 },
      )
      observer.observe(node)
    }

    return () => {
      if (observer) observer.disconnect()
      if (animation) animation.pause()
    }
  }, [target, duration, reduced, animateOnView])

  return (
    <span className={className}>
      <span className="sr-only">{format(target)}</span>
      <span ref={nodeRef} aria-hidden="true">
        {format(target)}
      </span>
    </span>
  )
}
