import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { usePasswordDetection } from '../usePasswordDetection'
import * as userApi from '@/lib/api/user'
import * as apiError from '@/lib/utils/api-error'

vi.mock('@/lib/api/user', () => ({
  setPassword: vi.fn<() => Promise<void>>(),
}))

vi.mock('@/lib/utils/api-error', () => ({
  extractErrorCode: vi.fn<(error: unknown) => string | undefined>(),
  isApiError: vi.fn<(error: unknown) => boolean>(),
}))

const mockSetPassword = vi.mocked(userApi.setPassword)
const mockExtractErrorCode = vi.mocked(apiError.extractErrorCode)
const mockIsApiError = vi.mocked(apiError.isApiError)

/**
 * Mounts the composable inside a minimal test component.
 * No auto-call — recheck() must be invoked explicitly.
 */
function mountComposable() {
  let result!: ReturnType<typeof usePasswordDetection>

  const TestComponent = defineComponent({
    setup() {
      result = usePasswordDetection()
      return () => h('div')
    },
  })

  const wrapper = mount(TestComponent)
  return { wrapper, ...result }
}

describe('usePasswordDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSetPassword.mockResolvedValue()
    mockExtractErrorCode.mockReturnValue(undefined)
    mockIsApiError.mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state (no auto-call)', () => {
    it('starts with hasPassword as null', () => {
      const { hasPassword } = mountComposable()
      expect(hasPassword.value).toBeNull()
    })

    it('starts with isChecking as false', () => {
      const { isChecking } = mountComposable()
      expect(isChecking.value).toBe(false)
    })

    it('starts with checkError as null', () => {
      const { checkError } = mountComposable()
      expect(checkError.value).toBeNull()
    })

    it('does NOT call setPassword on mount', () => {
      mountComposable()
      expect(mockSetPassword).not.toHaveBeenCalled()
    })
  })

  describe('USER_015 branch — user has a password', () => {
    it('sets hasPassword to true when extractErrorCode returns USER_015', async () => {
      const apiError_ = { statusCode: 409, data: { code: 'USER_015' } }
      mockSetPassword.mockRejectedValue(apiError_)
      mockExtractErrorCode.mockReturnValue('USER_015')

      const { hasPassword, isChecking, recheck } = mountComposable()
      await recheck()
      await flushPromises()

      expect(hasPassword.value).toBe(true)
      expect(isChecking.value).toBe(false)
    })

    it('does not set checkError for USER_015', async () => {
      const apiError_ = { statusCode: 409, data: { code: 'USER_015' } }
      mockSetPassword.mockRejectedValue(apiError_)
      mockExtractErrorCode.mockReturnValue('USER_015')

      const { checkError, recheck } = mountComposable()
      await recheck()
      await flushPromises()

      expect(checkError.value).toBeNull()
    })
  })

  describe('Other API error branch — user does NOT have a password', () => {
    it('sets hasPassword to false for non-USER_015 API error (e.g. COMMON_003)', async () => {
      const apiError_ = { statusCode: 400, data: { code: 'COMMON_003' } }
      mockSetPassword.mockRejectedValue(apiError_)
      mockExtractErrorCode.mockReturnValue('COMMON_003')
      mockIsApiError.mockReturnValue(true)

      const { hasPassword, isChecking, recheck } = mountComposable()
      await recheck()
      await flushPromises()

      expect(hasPassword.value).toBe(false)
      expect(isChecking.value).toBe(false)
    })

    it('does not set checkError for non-USER_015 API errors', async () => {
      const apiError_ = { statusCode: 400, data: { code: 'COMMON_003' } }
      mockSetPassword.mockRejectedValue(apiError_)
      mockExtractErrorCode.mockReturnValue('COMMON_003')
      mockIsApiError.mockReturnValue(true)

      const { checkError, recheck } = mountComposable()
      await recheck()
      await flushPromises()

      expect(checkError.value).toBeNull()
    })
  })

  describe('Network/unknown error branch', () => {
    it('sets checkError when error is not an API error', async () => {
      const networkError = new TypeError('Network down')
      mockSetPassword.mockRejectedValue(networkError)
      mockExtractErrorCode.mockReturnValue(undefined)
      mockIsApiError.mockReturnValue(false)

      const { checkError, isChecking, recheck } = mountComposable()
      await recheck()
      await flushPromises()

      expect(checkError.value).toBe('Unable to check password status. Please try again.')
      expect(isChecking.value).toBe(false)
    })

    it('leaves hasPassword unchanged (still null) on network error', async () => {
      const networkError = new TypeError('Network down')
      mockSetPassword.mockRejectedValue(networkError)
      mockExtractErrorCode.mockReturnValue(undefined)
      mockIsApiError.mockReturnValue(false)

      const { hasPassword, recheck } = mountComposable()
      await recheck()
      await flushPromises()

      expect(hasPassword.value).toBeNull()
    })
  })

  describe('Successful setPassword call (unlikely with empty password)', () => {
    it('sets hasPassword to false when setPassword resolves', async () => {
      mockSetPassword.mockResolvedValue()

      const { hasPassword, isChecking, recheck } = mountComposable()
      await recheck()
      await flushPromises()

      expect(hasPassword.value).toBe(false)
      expect(isChecking.value).toBe(false)
    })

    it('does not set checkError on success', async () => {
      mockSetPassword.mockResolvedValue()

      const { checkError, recheck } = mountComposable()
      await recheck()
      await flushPromises()

      expect(checkError.value).toBeNull()
    })
  })

  describe('recheck function', () => {
    it('calls setPassword with empty string', async () => {
      mockSetPassword.mockResolvedValue()

      const { recheck } = mountComposable()
      expect(mockSetPassword).not.toHaveBeenCalled()

      await recheck()
      expect(mockSetPassword).toHaveBeenCalledWith('')
      expect(mockSetPassword).toHaveBeenCalledTimes(1)
    })

    it('recheck updates hasPassword from null to false when setPassword resolves', async () => {
      mockSetPassword.mockResolvedValue()

      const { hasPassword, recheck } = mountComposable()
      expect(hasPassword.value).toBeNull()

      await recheck()
      await flushPromises()
      expect(hasPassword.value).toBe(false)
    })

    it('recheck updates hasPassword from false to true when USER_015 appears later', async () => {
      mockSetPassword.mockResolvedValue()

      const { hasPassword, recheck } = mountComposable()
      await recheck()
      await flushPromises()
      expect(hasPassword.value).toBe(false)

      // Simulate a later check where the user now has a password
      const apiError_ = { statusCode: 409, data: { code: 'USER_015' } }
      mockSetPassword.mockRejectedValueOnce(apiError_)
      mockExtractErrorCode.mockReturnValueOnce('USER_015')

      await recheck()
      expect(hasPassword.value).toBe(true)
    })

    it('recheck clears previous checkError', async () => {
      const networkError = new TypeError('Network down')
      mockSetPassword.mockRejectedValueOnce(networkError)
      mockExtractErrorCode.mockReturnValue(undefined)
      mockIsApiError.mockReturnValue(false)

      const { checkError, recheck } = mountComposable()
      await recheck()
      await flushPromises()

      expect(checkError.value).toBe('Unable to check password status. Please try again.')

      // Successful recheck should clear checkError
      mockSetPassword.mockResolvedValueOnce()
      await recheck()
      expect(checkError.value).toBeNull()
    })
  })

  describe('isChecking state transitions', () => {
    it('starts false and transitions to true when recheck is called', async () => {
      let resolve!: () => void
      mockSetPassword.mockImplementation(
        () =>
          new Promise<void>((r) => {
            resolve = r
          }),
      )

      const { isChecking, recheck } = mountComposable()
      expect(isChecking.value).toBe(false)

      void recheck()
      await Promise.resolve()
      expect(isChecking.value).toBe(true)

      resolve()
      await flushPromises()
      expect(isChecking.value).toBe(false)
    })

    it('transitions from true to false even when setPassword rejects', async () => {
      let reject!: (error: unknown) => void
      mockSetPassword.mockImplementation(
        () =>
          new Promise<void>((_r, rej) => {
            reject = rej
          }),
      )
      mockExtractErrorCode.mockReturnValue(undefined)
      mockIsApiError.mockReturnValue(false)

      const { isChecking, recheck } = mountComposable()
      expect(isChecking.value).toBe(false)

      void recheck()
      await Promise.resolve()
      expect(isChecking.value).toBe(true)

      reject(new TypeError('Network down'))
      await flushPromises()
      expect(isChecking.value).toBe(false)
    })

    it('transitions back to true when recheck is called again', async () => {
      mockSetPassword.mockResolvedValue()

      const { isChecking, recheck } = mountComposable()
      await recheck()
      expect(isChecking.value).toBe(false)

      let resolve!: () => void
      mockSetPassword.mockImplementationOnce(
        () =>
          new Promise<void>((r) => {
            resolve = r
          }),
      )

      void recheck()
      await Promise.resolve()
      expect(isChecking.value).toBe(true)

      resolve()
      await flushPromises()
      expect(isChecking.value).toBe(false)
    })
  })

  describe('concurrent recheck guard', () => {
    it('skips second recheck if first is still in progress', async () => {
      let resolve!: () => void
      mockSetPassword.mockImplementation(
        () =>
          new Promise<void>((r) => {
            resolve = r
          }),
      )

      const { isChecking, recheck } = mountComposable()
      expect(isChecking.value).toBe(false)

      // First call — starts the async operation
      void recheck()
      await Promise.resolve()
      expect(isChecking.value).toBe(true)
      expect(mockSetPassword).toHaveBeenCalledTimes(1)

      // Second call — should be skipped because isChecking is true
      void recheck()
      await Promise.resolve()
      expect(mockSetPassword).toHaveBeenCalledTimes(1)

      // Complete the first call
      resolve()
      await flushPromises()
      expect(isChecking.value).toBe(false)
    })
  })

  describe('return value shape', () => {
    it('returns hasPassword, isChecking, checkError, and recheck', () => {
      const result = mountComposable()

      expect(result.hasPassword).toBeDefined()
      expect(result.isChecking).toBeDefined()
      expect(result.checkError).toBeDefined()
      expect(typeof result.recheck).toBe('function')
    })
  })
})
