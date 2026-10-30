import { useEffect, useRef } from 'react'
import { animateScrollReveal } from '../../utils/animations'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export default function AnimatedSection({
  children,
  className = '',
  selector = '[data-animate-item]',
  direction = 'up',
  stagger = 80,
  threshold = 0.1,
  ...props
}) {
  const sectionRef = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const items = section.querySelectorAll(selector)
    if (items.length === 0) return

    if (reduced) {
      items.forEach((item) => {
        item.style.opacity = '1'
        item.style.transform = 'none'
      })
      return
    }

    // Set initial state
    items.forEach((item) => {
      item.style.opacity = '0'
      if (direction === 'up') item.style.transform = 'translateY(40px)'
      else if (direction === 'down') item.style.transform = 'translateY(-40px)'
      else if (direction === 'left') item.style.transform = 'translateX(40px)'
      else if (direction === 'right') item.style.transform = 'translateX(-40px)'
      else if (direction === 'fade') item.style.transform = 'none'
      else item.style.transform = 'translateY(40px)'
    })

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          animateScrollReveal(items, { 
            y: direction === 'up' ? 40 : direction === 'down' ? -40 : 0,
            x: direction === 'left' ? 40 : direction === 'right' ? -40 : 0,
            staggerMs: stagger,
            duration: 800,
          }, reduced)
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [selector, direction, stagger, threshold, reduced])

  return (
    <section ref={sectionRef} className={className} {...props}>
      {children}
    </section>
  )
}
