import { describe, it, expect, vi, beforeEach, afterEach } from 'vite-plus/test'
import { queryClient } from '../query'

describe('QueryClient Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Query Options', () => {
    it('has correct staleTime (30s)', () => {
      const defaultOptions = queryClient.getDefaultOptions()
      expect(defaultOptions.queries?.staleTime).toBe(1000 * 30)
    })

    it('has correct gcTime (5min)', () => {
      const defaultOptions = queryClient.getDefaultOptions()
      expect(defaultOptions.queries?.gcTime).toBe(1000 * 60 * 5)
    })

    it('has refetchOnWindowFocus disabled', () => {
      const defaultOptions = queryClient.getDefaultOptions()
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false)
    })

    it('has retry set to 1', () => {
      const defaultOptions = queryClient.getDefaultOptions()
      expect(defaultOptions.queries?.retry).toBe(1)
    })

    it('has refetchOnMount enabled', () => {
      const defaultOptions = queryClient.getDefaultOptions()
      expect(defaultOptions.queries?.refetchOnMount).toBe(true)
    })

    it('has refetchOnReconnect enabled', () => {
      const defaultOptions = queryClient.getDefaultOptions()
      expect(defaultOptions.queries?.refetchOnReconnect).toBe(true)
    })
  })

  describe('Mutation fallback', () => {
    it('keeps the mutation defaults free of an error handler', () => {
      // A default `onError` merges into every mutation's options, which is exactly what the
      // fallback reads to decide whether a mutation already has its own handler. Defining one here
      // would make every mutation look handled — and silence the fallback for all of them.
      expect(queryClient.getDefaultOptions().mutations?.onError).toBeUndefined()
    })

    it('installs the last-resort handler on the mutation cache', () => {
      expect(typeof queryClient.getMutationCache().config.onError).toBe('function')
    })
  })

  describe('QueryClient Instance', () => {
    it('is a valid QueryClient instance', () => {
      expect(queryClient).toBeDefined()
      expect(typeof queryClient.getDefaultOptions).toBe('function')
    })

    it('can get and set default options', () => {
      const originalRetry = queryClient.getDefaultOptions().queries?.retry

      queryClient.setDefaultOptions({
        queries: {
          retry: 3,
        },
      })

      expect(queryClient.getDefaultOptions().queries?.retry).toBe(3)

      queryClient.setDefaultOptions({
        queries: {
          retry: originalRetry,
        },
      })
    })

    it('maintains query cache', () => {
      expect(queryClient.getQueryCache()).toBeDefined()
    })

    it('maintains mutation cache', () => {
      expect(queryClient.getMutationCache()).toBeDefined()
    })
  })
})
