import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

if (!window.IntersectionObserver) {
  class IntersectionObserverMock {
    constructor(callback) {
      this.callback = callback
    }

    observe() {}

    unobserve() {}

    disconnect() {}
  }
  window.IntersectionObserver = IntersectionObserverMock
  global.IntersectionObserver = IntersectionObserverMock
}

// jsdom has no layout engine; keep chart containers from measuring 0x0.
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
