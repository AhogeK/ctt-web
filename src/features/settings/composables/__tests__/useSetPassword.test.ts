import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { useSetPassword } from '../useSetPassword'
import * as userApi from '@/lib/api/user'
import * as apiError from '@/lib/utils/api-error'

vi.mock('@/lib/api/user', () => ({
  setPassword: vi.fn<() => Promise<unknown>>(),
}))

vi.mock('@/lib/utils/api-error', () => ({
  extractErrorCode: vi.fn<() => string | undefined>(),
  mapApiErrorCode: vi.fn<() => string>(),
}))

vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn<(...args: unknown[]) => void>(),
    error: vi.fn<(...args: unknown[]) => void>(),
    info: vi.fn<(...args: unknown[]) => void>(),
  },
}))

const mockInvalidateQueries = vi.fn<(...args: unknown[]) => Promise<void>>()

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn<() => { invalidateQueries: typeof mockInvalidateQueries }>(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
  useMutation: vi.fn<(...args: unknown[]) => unknown>(),
  useQuery: vi.fn<(...args: unknown[]) => unknown>(),
}))

import { toast } from 'vue-sonner'
import { useMutation } from '@tanstack/vue-query'

const mockUseMutation = vi.mocked(useMutation)
const mockToast = vi.mocked(toast)
const mockExtractErrorCode = vi.mocked(apiError.extractErrorCode)
const mockMapApiErrorCode = vi.mocked(apiError.mapApiErrorCode)

type MutationConfig = {
  mutationFn?: (params: unknown) => Promise<unknown>
  onSuccess?: (data: unknown, variables: unknown) => void
  onError?: (error: unknown, variables: unknown, context: unknown) => void
}

let mutationConfigs: MutationConfig[] = []

function setupMutationMock() {
  mutationConfigs = []
  // @ts-expect-error - mock implementation doesn't need to match exact TanStack Query types
  mockUseMutation.mockImplementation((config: MutationConfig) => {
    const index = mutationConfigs.length
    mutationConfigs.push(config)
    return {
      mutate: vi.fn<(variables: unknown) => void>((variables: unknown) => {
        const cfg = mutationConfigs[index]!
        if (!cfg.mutationFn) return
        return Promise.resolve()
          .then(() => cfg.mutationFn!(variables))
          .then((result) => cfg.onSuccess?.(result, variables))
          .catch((err) => {
            cfg.onError?.(err, variables, undefined)
          })
      }),
      mutateAsync: vi.fn<(variables: unknown) => Promise<unknown>>((variables: unknown) => {
        const cfg = mutationConfigs[index]!
        if (!cfg.mutationFn) return Promise.resolve()
        return Promise.resolve()
          .then(() => cfg.mutationFn!(variables))
          .then((result) => {
            cfg.onSuccess?.(result, variables)
            return result
          })
          .catch((err) => {
            cfg.onError?.(err, variables, undefined)
            throw err
          })
      }),
      isPending: { value: false },
      reset: vi.fn<() => void>(),
    }
  })
}

describe('useSetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMutationMock()
    useSetPassword().isDialogOpen.value = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('success path', () => {
    it('calls setPassword API with the new password', async () => {
      vi.mocked(userApi.setPassword).mockResolvedValueOnce(undefined)

      const { mutation } = useSetPassword()
      await mutation.mutateAsync('newSecurePass123!')

      expect(userApi.setPassword).toHaveBeenCalledWith('newSecurePass123!')
      expect(userApi.setPassword).toHaveBeenCalledTimes(1)
    })

    it('shows success toast on successful password set', async () => {
      vi.mocked(userApi.setPassword).mockResolvedValueOnce(undefined)

      const { mutation } = useSetPassword()
      await mutation.mutateAsync('newSecurePass123!')

      expect(mockToast.success).toHaveBeenCalledWith('Password set successfully', {
        description: 'You can now sign in with your email and password.',
      })
    })

    it('closes dialog on successful password set', async () => {
      vi.mocked(userApi.setPassword).mockResolvedValueOnce(undefined)

      const { isDialogOpen: dialogState, mutation } = useSetPassword()
      dialogState.value = true
      await mutation.mutateAsync('newSecurePass123!')

      expect(dialogState.value).toBe(false)
    })

    it('invalidates user query on successful password set', async () => {
      vi.mocked(userApi.setPassword).mockResolvedValueOnce(undefined)

      const { mutation } = useSetPassword()
      await mutation.mutateAsync('newSecurePass123!')

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] })
    })
  })

  describe('USER_015 error path (already has password)', () => {
    it('shows mapped error toast for USER_015 code', async () => {
      const error = new Error('User already has password')
      vi.mocked(userApi.setPassword).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue('USER_015')
      mockMapApiErrorCode.mockReturnValue('This account already has a password set.')

      const { mutation } = useSetPassword()

      await expect(mutation.mutateAsync('newSecurePass123!')).rejects.toThrow('User already has password')

      expect(mockToast.error).toHaveBeenCalledWith('This account already has a password set.')
    })

    it('does not show generic title for USER_015', async () => {
      const error = new Error('User already has password')
      vi.mocked(userApi.setPassword).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue('USER_015')
      mockMapApiErrorCode.mockReturnValue('This account already has a password set.')

      const { mutation } = useSetPassword()

      await expect(mutation.mutateAsync('newSecurePass123!')).rejects.toThrow('User already has password')

      expect(mockToast.error).not.toHaveBeenCalledWith('Failed to set password', expect.anything())
    })

    it('calls mapApiErrorCode when handling USER_015', async () => {
      const error = new Error('User already has password')
      vi.mocked(userApi.setPassword).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue('USER_015')
      mockMapApiErrorCode.mockReturnValue('Mapped message.')

      const { mutation } = useSetPassword()
      await expect(mutation.mutateAsync('newSecurePass123!')).rejects.toThrow('User already has password')

      expect(mockMapApiErrorCode).toHaveBeenCalledWith('USER_015')
    })
  })

  describe('other error path', () => {
    it('shows generic error toast with description for unknown error codes', async () => {
      const error = new Error('Server error')
      vi.mocked(userApi.setPassword).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue(undefined)

      const { mutation } = useSetPassword()

      await expect(mutation.mutateAsync('newSecurePass123!')).rejects.toThrow('Server error')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to set password', {
        description: 'An unexpected error occurred. Please try again later.',
      })
    })

    it('shows generic error toast with mapped description for non-USER_015 codes', async () => {
      const error = new Error('Invalid format')
      vi.mocked(userApi.setPassword).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue('COMMON_003')
      mockMapApiErrorCode.mockReturnValue('Password does not meet complexity requirements.')

      const { mutation } = useSetPassword()

      await expect(mutation.mutateAsync('weak')).rejects.toThrow('Invalid format')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to set password', {
        description: 'Password does not meet complexity requirements.',
      })
    })

    it('uses generic fallback when extractErrorCode returns undefined', async () => {
      const error = new Error('Network error')
      vi.mocked(userApi.setPassword).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue(undefined)

      const { mutation } = useSetPassword()
      await expect(mutation.mutateAsync('newSecurePass123!')).rejects.toThrow('Network error')

      expect(mockMapApiErrorCode).not.toHaveBeenCalled()
    })
  })

  describe('dialog state', () => {
    it('isDialogOpen starts as false', () => {
      const { isDialogOpen: dialogState } = useSetPassword()
      expect(dialogState.value).toBe(false)
    })

    it('isDialogOpen can be set to true', () => {
      const { isDialogOpen: dialogState } = useSetPassword()
      dialogState.value = true
      expect(dialogState.value).toBe(true)
    })

    it('isDialogOpen is shared across all instances (module-level ref)', () => {
      const { isDialogOpen: dialog1 } = useSetPassword()
      const { isDialogOpen: dialog2 } = useSetPassword()

      dialog1.value = true
      expect(dialog2.value).toBe(true)

      dialog2.value = false
      expect(dialog1.value).toBe(false)
    })

    it('does not close dialog on error', async () => {
      const error = new Error('Server error')
      vi.mocked(userApi.setPassword).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue(undefined)

      const { isDialogOpen: dialogState, mutation } = useSetPassword()
      dialogState.value = true

      await expect(mutation.mutateAsync('newSecurePass123!')).rejects.toThrow('Server error')

      expect(dialogState.value).toBe(true)
    })
  })

  describe('SET_PASSWORD_ERROR_CODES', () => {
    it('exposes error code constants', () => {
      const { SET_PASSWORD_ERROR_CODES } = useSetPassword()

      expect(SET_PASSWORD_ERROR_CODES).toBeDefined()
      expect(SET_PASSWORD_ERROR_CODES.ALREADY_HAS_PASSWORD).toBe('USER_015')
    })

    it('contains USER_015 and COMMON_003 codes', () => {
      const { SET_PASSWORD_ERROR_CODES } = useSetPassword()

      expect(SET_PASSWORD_ERROR_CODES.ALREADY_HAS_PASSWORD).toBe('USER_015')
      expect(SET_PASSWORD_ERROR_CODES.INVALID_FORMAT).toBe('COMMON_003')
    })

    it('error codes are exposed consistently across instances', () => {
      const instance1 = useSetPassword()
      const instance2 = useSetPassword()

      expect(instance1.SET_PASSWORD_ERROR_CODES).toBe(instance2.SET_PASSWORD_ERROR_CODES)
    })
  })

  describe('return value shape', () => {
    it('returns all required properties', () => {
      const result = useSetPassword()

      expect(result.mutation).toBeDefined()
      expect(result.isDialogOpen).toBeDefined()
      expect(result.SET_PASSWORD_ERROR_CODES).toBeDefined()
    })

    it('exposes mutateAsync on the mutation', () => {
      const { mutation } = useSetPassword()

      expect(mutation.mutateAsync).toBeDefined()
      expect(typeof mutation.mutateAsync).toBe('function')
    })
  })
})
