import { animate, createTimeline, stagger, utils } from 'animejs'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * Reusable animation utilities for a polished animejs-inspired experience
 */

// Check for reduced motion preference
export function shouldReduceMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Apply reduced motion safe values
export function setReduced(targets) {
  utils.set(targets, { opacity: 1, translateY: 0, translateX: 0, scale: 1, rotate: 0 })
}

// Hero entrance animation
export function animateHeroEntrance(root, reduced = false) {
  if (!root) return null
  const targets = root.querySelectorAll('[data-hero]')
  if (targets.length === 0) return null

  if (reduced) {
    setReduced(targets)
    return null
  }

  utils.set(targets, { opacity: 0, translateY: 40 })
  
  const timeline = createTimeline({ defaults: { ease: 'outExpo', duration: 900 } })
  
  timeline
    .add('[data-hero="eyebrow"]', { opacity: [0, 1], translateY: [20, 0], duration: 700 }, 0)
    .add('[data-hero="title"]', { opacity: [0, 1], translateY: [60, 0], duration: 1100 }, 150)
    .add('[data-hero="subtitle"]', { opacity: [0, 1], translateY: [30, 0], duration: 900 }, 400)
    .add('[data-hero="search"]', { opacity: [0, 1], translateY: [40, 0], scale: [0.98, 1], duration: 900 }, 600)
    .add('[data-hero="meta"]', { opacity: [0, 1], translateY: [20, 0], duration: 700 }, 800)
    .add('[data-hero="panel"]', { opacity: [0, 1], translateY: [50, 0], scale: [0.96, 1], duration: 1100 }, 650)
    .add('[data-hero="panel-row"]', { opacity: [0, 1], translateX: [-15, 0], delay: stagger(120) }, 900)
  
  // Background elements
  const glow1 = root.querySelector('[data-glow="1"]')
  if (glow1) {
    animate(glow1, {
      translateX: [0, 40, -20, 0],
      translateY: [0, -30, 20, 0],
      scale: [1, 1.15, 0.95, 1],
      duration: 20000,
      loop: true,
      ease: 'linear',
    })
  }
  
  const glow2 = root.querySelector('[data-glow="2"]')
  if (glow2) {
    animate(glow2, {
      translateX: [0, -30, 20, 0],
      translateY: [0, 40, -20, 0],
      scale: [1, 0.9, 1.1, 1],
      duration: 25000,
      loop: true,
      ease: 'linear',
    })
  }
  
  return timeline
}

// Scroll reveal animation
export function animateScrollReveal(elements, options = {}, reduced = false) {
  if (!elements || elements.length === 0) return null
  if (reduced) {
    setReduced(elements)
    return null
  }
  
  const {
    y = 40,
    x = 0,
    duration = 800,
    staggerMs = 100,
    ease = 'outExpo',
    scale = null,
  } = options
  
  const props = { opacity: [0, 1] }
  if (y !== 0) props.translateY = [y, 0]
  if (x !== 0) props.translateX = [x, 0]
  if (scale !== null) props.scale = [scale, 1]
  
  return animate(elements, {
    ...props,
    duration,
    delay: stagger(staggerMs),
    ease,
  })
}

// Card hover animation
export function animateCardHover(card, isHovering, reduced = false) {
  if (!card || reduced) return null
  
  if (isHovering) {
    return animate(card, {
      translateY: -8,
      scale: 1.02,
      duration: 400,
      ease: 'outCubic',
    })
  } else {
    return animate(card, {
      translateY: 0,
      scale: 1,
      duration: 400,
      ease: 'outCubic',
    })
  }
}

// Button hover animation
export function animateButtonHover(button, isHovering, reduced = false) {
  if (!button || reduced) return null
  
  if (isHovering) {
    return animate(button, {
      scale: 1.05,
      duration: 250,
      ease: 'outBack',
    })
  } else {
    return animate(button, {
      scale: 1,
      duration: 250,
      ease: 'outBack',
    })
  }
}

// Text reveal character by character
export function animateTextReveal(element, reduced = false) {
  if (!element || reduced) {
    if (element) utils.set(element, { opacity: 1 })
    return null
  }
  
  const text = element.textContent
  element.textContent = ''
  
  const chars = text.split('').map((char) => {
    const span = document.createElement('span')
    span.textContent = char === ' ' ? '\u00A0' : char
    span.style.opacity = '0'
    span.style.display = 'inline-block'
    element.appendChild(span)
    return span
  })
  
  return animate(chars, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 600,
    delay: stagger(15),
    ease: 'outExpo',
  })
}

// Counter animation
export function animateCounter(element, targetValue, options = {}, reduced = false) {
  if (!element || reduced) {
    if (element) element.textContent = targetValue
    return null
  }
  
  const {
    duration = 1500,
    ease = 'outExpo',
    format = (v) => Math.floor(v).toLocaleString(),
  } = options
  
  const obj = { value: 0 }
  return animate(obj, {
    value: targetValue,
    duration,
    ease,
    onUpdate: () => {
      element.textContent = format(obj.value)
    },
  })
}

// Parallax effect
export function animateParallax(element, scrollY, speed = 0.5, reduced = false) {
  if (!element || reduced) return
  const yPos = scrollY * speed
  element.style.transform = `translateY(${yPos}px)`
}

// Menu transition
export function animateMenuOpen(menu, reduced = false) {
  if (!menu || reduced) {
    if (menu) menu.style.opacity = '1'
    return null
  }
  
  utils.set(menu, { opacity: 0, scaleY: 0.95, transformOrigin: 'top' })
  return animate(menu, {
    opacity: [0, 1],
    scaleY: [0.95, 1],
    duration: 300,
    ease: 'outCubic',
  })
}

// Cleanup animation
export function cleanupAnimation(animation) {
  if (animation && typeof animation.pause === 'function') {
    animation.pause()
  }
}
