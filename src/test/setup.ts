import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/vue'
import { afterEach, vi } from 'vite-plus/test'

// Auto-cleanup DOM after each test to prevent memory leaks
afterEach(() => {
  cleanup()
})

// Mock browser APIs required by Radix UI / Shadcn (jsdom doesn't provide them)
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn<(query: string) => MediaQueryList>().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn<() => void>(), // deprecated
    removeListener: vi.fn<() => void>(), // deprecated
    addEventListener: vi.fn<() => void>(),
    removeEventListener: vi.fn<() => void>(),
    dispatchEvent: vi.fn<() => boolean>(),
  })),
})

/**
 * `ResizeObserver` has to be a **class**: components construct it (`new ResizeObserver(...)` in
 * `ScrollFadeList`), and a `vi.fn()` implementation that returns an object literal is not
 * constructible — the call site fails with "is not a constructor" before any assertion runs. The
 * landing stage renders the dashboard's list components, which is where this surfaces.
 */
class ResizeObserverMock {
  observe = vi.fn<() => void>()
  unobserve = vi.fn<() => void>()
  disconnect = vi.fn<() => void>()
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

/**
 * `IntersectionObserver` is missing from jsdom the same way, and needs the same shape: the landing page
 * constructs one to fade its phone pieces, so a `vi.fn()` that returns an object literal would fail at
 * the call site. The callback is never invoked here — pieces keep their script-free state (visible),
 * which is exactly the fallback the stylesheet is written for.
 */
class IntersectionObserverMock {
  observe = vi.fn<() => void>()
  unobserve = vi.fn<() => void>()
  disconnect = vi.fn<() => void>()
  takeRecords = vi.fn<() => []>(() => [])
}
globalThis.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver
