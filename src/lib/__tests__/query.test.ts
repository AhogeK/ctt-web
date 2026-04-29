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

  describe('Mutation Options', () => {
    it('has mutation error handler', () => {
      const defaultOptions = queryClient.getDefaultOptions()
      expect(defaultOptions.mutations?.onError).toBeDefined()
    })

    it('mutation error handler logs to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn())

      const defaultOptions = queryClient.getDefaultOptions()
      const errorHandler = defaultOptions.mutations?.onError as (
        error: Error,
        variables: unknown,
        context: unknown,
        mutation: unknown,
      ) => void

      const mockError = new Error('Test mutation error')
      const mockMutation = { state: { error: mockError } }

      errorHandler(mockError, {}, undefined, mockMutation)

      expect(consoleSpy).toHaveBeenCalledWith('[Mutation Error]:', mockError)
      consoleSpy.mockRestore()
    })

    it('mutation error handler accepts various error types', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn())

      const defaultOptions = queryClient.getDefaultOptions()
      const errorHandler = defaultOptions.mutations?.onError as (
        error: Error,
        variables: unknown,
        context: unknown,
        mutation: unknown,
      ) => void
      const mockMutation = { state: {} }

      const error1 = new Error('First error')
      errorHandler(error1, {}, undefined, mockMutation)
      expect(consoleSpy).toHaveBeenCalled()

      const error2 = new Error('Second error')
      errorHandler(error2, {}, undefined, mockMutation)
      expect(consoleSpy).toHaveBeenCalledTimes(2)

      consoleSpy.mockRestore()
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
