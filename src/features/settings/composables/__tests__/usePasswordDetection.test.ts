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
 * Mounts the composable inside a minimal test component so that
 * `onMounted` fires and the auto password check runs.
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
    // Default: setPassword resolves (no error)
    mockSetPassword.mockResolvedValue()
    // Default: extractErrorCode returns undefined, isApiError returns false
    mockExtractErrorCode.mockReturnValue(undefined)
    mockIsApiError.mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('starts with hasPassword as false before mount completes', async () => {
      mockSetPassword.mockImplementation(
        () => new Promise(() => {}), // never resolves so check stays pending
      )

      const { hasPassword } = mountComposable()

      expect(hasPassword.value).toBe(false)
    })

    it('starts with isChecking as true (before mount resolves)', async () => {
      mockSetPassword.mockImplementation(
        () => new Promise(() => {}), // never resolves so isChecking stays true
      )

      const { isChecking } = mountComposable()

      expect(isChecking.value).toBe(true)
    })

    it('starts with checkError as null (before mount resolves)', async () => {
      mockSetPassword.mockImplementation(() => new Promise(() => {}))

      const { checkError } = mountComposable()

      expect(checkError.value).toBeNull()
    })
  })

  describe('USER_015 branch — user has a password', () => {
    it('sets hasPassword to true when extractErrorCode returns USER_015', async () => {
      const apiError_ = { statusCode: 409, data: { code: 'USER_015' } }
      mockSetPassword.mockRejectedValue(apiError_)
      mockExtractErrorCode.mockReturnValue('USER_015')

      const { hasPassword, isChecking } = mountComposable()
      await flushPromises()

      expect(hasPassword.value).toBe(true)
      expect(isChecking.value).toBe(false)
    })

    it('does not set checkError for USER_015', async () => {
      const apiError_ = { statusCode: 409, data: { code: 'USER_015' } }
      mockSetPassword.mockRejectedValue(apiError_)
      mockExtractErrorCode.mockReturnValue('USER_015')

      const { checkError } = mountComposable()
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

      const { hasPassword, isChecking } = mountComposable()
      await flushPromises()

      expect(hasPassword.value).toBe(false)
      expect(isChecking.value).toBe(false)
    })

    it('does not set checkError for non-USER_015 API errors', async () => {
      const apiError_ = { statusCode: 400, data: { code: 'COMMON_003' } }
      mockSetPassword.mockRejectedValue(apiError_)
      mockExtractErrorCode.mockReturnValue('COMMON_003')
      mockIsApiError.mockReturnValue(true)

      const { checkError } = mountComposable()
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

      const { checkError, isChecking } = mountComposable()
      await flushPromises()

      expect(checkError.value).toBe('Unable to check password status. Please try again.')
      expect(isChecking.value).toBe(false)
    })

    it('leaves hasPassword unchanged (still false) on network error', async () => {
      const networkError = new TypeError('Network down')
      mockSetPassword.mockRejectedValue(networkError)
      mockExtractErrorCode.mockReturnValue(undefined)
      mockIsApiError.mockReturnValue(false)

      const { hasPassword } = mountComposable()
      await flushPromises()

      expect(hasPassword.value).toBe(false)
    })
  })

  describe('Successful setPassword call (unlikely with empty password)', () => {
    it('sets hasPassword to false when setPassword resolves', async () => {
      mockSetPassword.mockResolvedValue()

      const { hasPassword, isChecking } = mountComposable()
      await flushPromises()

      expect(hasPassword.value).toBe(false)
      expect(isChecking.value).toBe(false)
    })

    it('does not set checkError on success', async () => {
      mockSetPassword.mockResolvedValue()

      const { checkError } = mountComposable()
      await flushPromises()

      expect(checkError.value).toBeNull()
    })
  })

  describe('onMounted auto-trigger', () => {
    it('calls setPassword with empty string on mount', async () => {
      mockSetPassword.mockResolvedValue()

      mountComposable()
      await flushPromises()

      expect(mockSetPassword).toHaveBeenCalledWith('')
    })

    it('calls setPassword exactly once on mount', async () => {
      mockSetPassword.mockResolvedValue()

      mountComposable()
      await flushPromises()

      expect(mockSetPassword).toHaveBeenCalledTimes(1)
    })
  })

  describe('recheck function', () => {
    it('exposes recheck that calls setPassword again', async () => {
      mockSetPassword.mockResolvedValue()

      const { recheck } = mountComposable()
      await flushPromises()

      expect(mockSetPassword).toHaveBeenCalledTimes(1)

      await recheck()
      expect(mockSetPassword).toHaveBeenCalledTimes(2)
    })

    it('recheck updates hasPassword from false to true when USER_015 appears later', async () => {
      mockSetPassword.mockResolvedValue()
      mockExtractErrorCode.mockReturnValue(undefined)
      mockIsApiError.mockReturnValue(false)

      const { hasPassword, recheck } = mountComposable()
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
      await flushPromises()

      expect(checkError.value).toBe('Unable to check password status. Please try again.')

      // Successful recheck should clear checkError
      mockSetPassword.mockResolvedValueOnce()
      await recheck()
      expect(checkError.value).toBeNull()
    })
  })

  describe('isChecking state transitions', () => {
    it('transitions from true to false after check completes', async () => {
      // Use a controllable promise so we can observe the intermediate state
      let resolve!: () => void
      mockSetPassword.mockImplementation(
        () =>
          new Promise<void>((r) => {
            resolve = r
          }),
      )

      const { isChecking } = mountComposable()
      expect(isChecking.value).toBe(true)

      resolve()
      await flushPromises()
      expect(isChecking.value).toBe(false)
    })

    it('transitions from true to false even when setPassword rejects', async () => {
      mockSetPassword.mockRejectedValue(new TypeError('Network down'))
      mockExtractErrorCode.mockReturnValue(undefined)
      mockIsApiError.mockReturnValue(false)

      const { isChecking } = mountComposable()
      expect(isChecking.value).toBe(true)

      await flushPromises()
      expect(isChecking.value).toBe(false)
    })

    it('transitions back to true when recheck is called', async () => {
      mockSetPassword.mockResolvedValue()

      const { isChecking, recheck } = mountComposable()
      await flushPromises()
      expect(isChecking.value).toBe(false)

      let resolve!: () => void
      mockSetPassword.mockImplementationOnce(
        () =>
          new Promise<void>((r) => {
            resolve = r
          }),
      )

      void recheck()
      // Yield to allow the sync portion of checkPasswordStatus to run
      await Promise.resolve()
      expect(isChecking.value).toBe(true)

      resolve()
      await flushPromises()
      expect(isChecking.value).toBe(false)
    })
  })

  describe('return value shape', () => {
    it('returns hasPassword, isChecking, checkError, and recheck', () => {
      mockSetPassword.mockImplementation(() => new Promise(() => {}))

      const result = mountComposable()

      expect(result.hasPassword).toBeDefined()
      expect(result.isChecking).toBeDefined()
      expect(result.checkError).toBeDefined()
      expect(typeof result.recheck).toBe('function')
    })
  })
})
