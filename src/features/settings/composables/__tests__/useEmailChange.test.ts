import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { useEmailChange } from '../useEmailChange'
import * as emailApi from '@/lib/api/email'
import * as apiError from '@/lib/utils/api-error'

vi.mock('@/lib/api/email', () => ({
  requestEmailChange: vi.fn<() => Promise<unknown>>(),
  confirmEmailChange: vi.fn<() => Promise<unknown>>(),
  cancelEmailChange: vi.fn<() => Promise<unknown>>(),
  resendEmailChangeVerification: vi.fn<() => Promise<unknown>>(),
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

describe('useEmailChange', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMutationMock()
    useEmailChange().isDialogOpen.value = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('request mutation', () => {
    it('calls requestEmailChange API with correct params', async () => {
      vi.mocked(emailApi.requestEmailChange).mockResolvedValueOnce({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
      })

      const { requestMutation } = useEmailChange()
      await requestMutation.mutateAsync({ newEmail: 'new@test.com', password: 'pass123' })

      expect(emailApi.requestEmailChange).toHaveBeenCalledWith({
        newEmail: 'new@test.com',
        password: 'pass123',
      })
    })

    it('shows success toast on successful request', async () => {
      vi.mocked(emailApi.requestEmailChange).mockResolvedValueOnce({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
      })

      const { requestMutation } = useEmailChange()
      await requestMutation.mutateAsync({ newEmail: 'new@test.com', password: 'pass123' })

      expect(mockToast.success).toHaveBeenCalledWith('Verification email sent', {
        description: 'Please check your new email inbox to confirm the change.',
      })
    })

    it('closes dialog on successful request', async () => {
      vi.mocked(emailApi.requestEmailChange).mockResolvedValueOnce({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
      })

      const { isDialogOpen: dialogState, requestMutation } = useEmailChange()
      dialogState.value = true
      await requestMutation.mutateAsync({ newEmail: 'new@test.com', password: 'pass123' })

      expect(dialogState.value).toBe(false)
    })

    it('invalidates user query on successful request', async () => {
      vi.mocked(emailApi.requestEmailChange).mockResolvedValueOnce({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
      })

      const { requestMutation } = useEmailChange()
      await requestMutation.mutateAsync({ newEmail: 'new@test.com', password: 'pass123' })

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] })
    })

    it('shows specific toast for USER_009 (already pending)', async () => {
      const error = new Error('Already pending')
      vi.mocked(emailApi.requestEmailChange).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue('USER_009')
      mockMapApiErrorCode.mockReturnValue('An email change request is already pending.')

      const { requestMutation } = useEmailChange()

      await expect(requestMutation.mutateAsync({ newEmail: 'new@test.com', password: 'pass123' })).rejects.toThrow(
        'Already pending',
      )

      expect(mockToast.error).toHaveBeenCalledWith('An email change request is already pending.', {
        description: 'Cancel the existing request or wait for it to expire.',
      })
    })

    it('shows specific toast for USER_013 (password required)', async () => {
      const error = new Error('Password required')
      vi.mocked(emailApi.requestEmailChange).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue('USER_013')
      mockMapApiErrorCode.mockReturnValue('Password verification required.')

      const { requestMutation } = useEmailChange()

      await expect(requestMutation.mutateAsync({ newEmail: 'new@test.com', password: 'pass123' })).rejects.toThrow(
        'Password required',
      )

      expect(mockToast.error).toHaveBeenCalledWith('Password verification required.')
    })

    it('shows specific toast for USER_014 (wrong password)', async () => {
      const error = new Error('Wrong password')
      vi.mocked(emailApi.requestEmailChange).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue('USER_014')
      mockMapApiErrorCode.mockReturnValue('Incorrect password.')

      const { requestMutation } = useEmailChange()

      await expect(requestMutation.mutateAsync({ newEmail: 'new@test.com', password: 'wrong' })).rejects.toThrow(
        'Wrong password',
      )

      expect(mockToast.error).toHaveBeenCalledWith('Incorrect password.')
    })

    it('shows generic error toast for unknown errors', async () => {
      const error = new Error('Server error')
      vi.mocked(emailApi.requestEmailChange).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue(undefined)

      const { requestMutation } = useEmailChange()

      await expect(requestMutation.mutateAsync({ newEmail: 'new@test.com', password: 'pass123' })).rejects.toThrow(
        'Server error',
      )

      expect(mockToast.error).toHaveBeenCalledWith('Failed to request email change', {
        description: 'An unexpected error occurred. Please try again later.',
      })
    })
  })

  describe('confirm mutation', () => {
    it('calls confirmEmailChange API with correct token', async () => {
      vi.mocked(emailApi.confirmEmailChange).mockResolvedValueOnce({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
      })

      const { confirmMutation } = useEmailChange()
      await confirmMutation.mutateAsync({ token: 'test-token-123' })

      expect(emailApi.confirmEmailChange).toHaveBeenCalledWith({ token: 'test-token-123' })
    })

    it('shows success toast on successful confirm', async () => {
      vi.mocked(emailApi.confirmEmailChange).mockResolvedValueOnce({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
      })

      const { confirmMutation } = useEmailChange()
      await confirmMutation.mutateAsync({ token: 'test-token-123' })

      expect(mockToast.success).toHaveBeenCalledWith('Email changed successfully', {
        description: 'Your email address has been updated.',
      })
    })

    it('invalidates user query on successful confirm', async () => {
      vi.mocked(emailApi.confirmEmailChange).mockResolvedValueOnce({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
      })

      const { confirmMutation } = useEmailChange()
      await confirmMutation.mutateAsync({ token: 'test-token-123' })

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] })
    })

    it('shows specific toast for USER_010 (expired)', async () => {
      const error = new Error('Expired')
      vi.mocked(emailApi.confirmEmailChange).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue('USER_010')
      mockMapApiErrorCode.mockReturnValue('The email change request has expired.')

      const { confirmMutation } = useEmailChange()

      await expect(confirmMutation.mutateAsync({ token: 'expired-token' })).rejects.toThrow('Expired')

      expect(mockToast.error).toHaveBeenCalledWith('The email change request has expired.', {
        description: 'Please request a new email change.',
      })
    })

    it('shows specific toast for USER_011 (invalid)', async () => {
      const error = new Error('Invalid')
      vi.mocked(emailApi.confirmEmailChange).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue('USER_011')
      mockMapApiErrorCode.mockReturnValue('Invalid email change request.')

      const { confirmMutation } = useEmailChange()

      await expect(confirmMutation.mutateAsync({ token: 'invalid-token' })).rejects.toThrow('Invalid')

      expect(mockToast.error).toHaveBeenCalledWith('Invalid email change request.', {
        description: 'Please check the link from your email.',
      })
    })

    it('shows generic error toast for unknown confirm errors', async () => {
      const error = new Error('Server error')
      vi.mocked(emailApi.confirmEmailChange).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue(undefined)

      const { confirmMutation } = useEmailChange()

      await expect(confirmMutation.mutateAsync({ token: 'bad-token' })).rejects.toThrow('Server error')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to confirm email change', {
        description: 'An unexpected error occurred. Please try again later.',
      })
    })
  })

  describe('cancel mutation', () => {
    it('calls cancelEmailChange API', async () => {
      vi.mocked(emailApi.cancelEmailChange).mockResolvedValueOnce({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
      })

      const { cancelMutation } = useEmailChange()
      await cancelMutation.mutateAsync(undefined)

      expect(emailApi.cancelEmailChange).toHaveBeenCalled()
    })

    it('shows success toast on successful cancel', async () => {
      vi.mocked(emailApi.cancelEmailChange).mockResolvedValueOnce({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
      })

      const { cancelMutation } = useEmailChange()
      await cancelMutation.mutateAsync(undefined)

      expect(mockToast.success).toHaveBeenCalledWith('Email change request cancelled')
    })

    it('invalidates user query on successful cancel', async () => {
      vi.mocked(emailApi.cancelEmailChange).mockResolvedValueOnce({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
      })

      const { cancelMutation } = useEmailChange()
      await cancelMutation.mutateAsync(undefined)

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] })
    })

    it('shows error toast on cancel failure', async () => {
      const error = new Error('Cancel failed')
      vi.mocked(emailApi.cancelEmailChange).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue(undefined)

      const { cancelMutation } = useEmailChange()

      await expect(cancelMutation.mutateAsync(undefined)).rejects.toThrow('Cancel failed')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to cancel email change', {
        description: 'An unexpected error occurred. Please try again later.',
      })
    })
  })

  describe('resend mutation', () => {
    it('calls resendEmailChangeVerification API', async () => {
      vi.mocked(emailApi.resendEmailChangeVerification).mockResolvedValueOnce({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
      })

      const { resendMutation } = useEmailChange()
      await resendMutation.mutateAsync(undefined)

      expect(emailApi.resendEmailChangeVerification).toHaveBeenCalled()
    })

    it('shows success toast on successful resend', async () => {
      vi.mocked(emailApi.resendEmailChangeVerification).mockResolvedValueOnce({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
      })

      const { resendMutation } = useEmailChange()
      await resendMutation.mutateAsync(undefined)

      expect(mockToast.success).toHaveBeenCalledWith('Verification email resent', {
        description: 'Please check your inbox.',
      })
    })

    it('does not invalidate query on resend success', async () => {
      vi.mocked(emailApi.resendEmailChangeVerification).mockResolvedValueOnce({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
      })

      const { resendMutation } = useEmailChange()
      await resendMutation.mutateAsync(undefined)

      expect(mockInvalidateQueries).not.toHaveBeenCalled()
    })

    it('shows error toast on resend failure', async () => {
      const error = new Error('Resend failed')
      vi.mocked(emailApi.resendEmailChangeVerification).mockRejectedValueOnce(error)
      mockExtractErrorCode.mockReturnValue(undefined)

      const { resendMutation } = useEmailChange()

      await expect(resendMutation.mutateAsync(undefined)).rejects.toThrow('Resend failed')

      expect(mockToast.error).toHaveBeenCalledWith('Failed to resend verification email', {
        description: 'An unexpected error occurred. Please try again later.',
      })
    })
  })

  describe('dialog state', () => {
    it('isDialogOpen starts as false', () => {
      const { isDialogOpen: dialogState } = useEmailChange()
      expect(dialogState.value).toBe(false)
    })

    it('isDialogOpen can be set to true', () => {
      const { isDialogOpen: dialogState } = useEmailChange()
      dialogState.value = true
      expect(dialogState.value).toBe(true)
    })

    it('isDialogOpen is shared across all instances (module-level ref)', () => {
      const { isDialogOpen: dialog1 } = useEmailChange()
      const { isDialogOpen: dialog2 } = useEmailChange()

      dialog1.value = true
      expect(dialog2.value).toBe(true)
    })
  })

  describe('return value shape', () => {
    it('returns all required properties', () => {
      const result = useEmailChange()

      expect(result.requestMutation).toBeDefined()
      expect(result.confirmMutation).toBeDefined()
      expect(result.cancelMutation).toBeDefined()
      expect(result.resendMutation).toBeDefined()
      expect(result.isDialogOpen).toBeDefined()
    })
  })
})
