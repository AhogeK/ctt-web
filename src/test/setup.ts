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

globalThis.ResizeObserver = vi.fn<() => ResizeObserver>().mockImplementation(() => ({
  observe: vi.fn<() => void>(),
  unobserve: vi.fn<() => void>(),
  disconnect: vi.fn<() => void>(),
}))
