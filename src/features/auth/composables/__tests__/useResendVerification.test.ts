import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useResendVerification } from '../useResendVerification'
import * as authApi from '@/lib/api/auth'
import type { EmptyResponse } from '@/lib/schemas/api.schema'

vi.mock('@/lib/api/auth', () => ({
  resendVerification:
    vi.fn<() => Promise<{ success: boolean; message: string; timestamp: string }>>(),
}))

vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn<(message: string, options?: { description?: string }) => void>(),
    error: vi.fn<(message: string, options?: { description?: string }) => void>(),
    info: vi.fn<(message: string, options?: { description?: string }) => void>(),
  },
}))

import { toast } from 'vue-sonner'

describe('useResendVerification', () => {
  const testEmail = 'test@example.com'

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('returns object with resend, countdown, and isPending', () => {
      const { resend, countdown, isPending } = useResendVerification()

      expect(typeof resend).toBe('function')
      expect(countdown.value).toBe(0)
      expect(isPending.value).toBe(false)
    })
  })

  describe('successful resend', () => {
    it('calls resendVerification API with correct email', async () => {
      vi.mocked(authApi.resendVerification).mockResolvedValueOnce({
        success: true,
        message: 'Verification email sent',
        timestamp: new Date().toISOString(),
      })

      const { resend } = useResendVerification()
      await resend(testEmail)

      expect(authApi.resendVerification).toHaveBeenCalledWith(testEmail)
    })

    it('shows success toast on successful resend', async () => {
      vi.mocked(authApi.resendVerification).mockResolvedValueOnce({
        success: true,
        message: 'Verification email sent',
        timestamp: new Date().toISOString(),
      })

      const { resend } = useResendVerification()
      await resend(testEmail)

      expect(toast.success).toHaveBeenCalledWith('Verification email sent', {
        description: 'Please check your inbox',
      })
    })

    it('starts 60-second countdown after successful resend', async () => {
      vi.mocked(authApi.resendVerification).mockResolvedValueOnce({
        success: true,
        message: 'Verification email sent',
        timestamp: new Date().toISOString(),
      })

      const { resend, countdown } = useResendVerification()
      await resend(testEmail)

      expect(countdown.value).toBe(60)

      await vi.advanceTimersByTimeAsync(30_000)
      expect(countdown.value).toBe(30)

      await vi.advanceTimersByTimeAsync(30_000)
      expect(countdown.value).toBe(0)
    })

    it('sets isPending to true during API call, then false after', async () => {
      let resolvePromise: (value: unknown) => void
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(authApi.resendVerification).mockReturnValueOnce(
        pendingPromise as Promise<EmptyResponse>,
      )

      const { resend, isPending } = useResendVerification()

      const resendPromise = resend(testEmail)

      expect(isPending.value).toBe(true)

      resolvePromise!({ success: true, message: 'OK', timestamp: new Date().toISOString() })
      await resendPromise

      expect(isPending.value).toBe(false)
    })
  })

  describe('countdown behavior', () => {
    it('prevents resend while countdown is active', async () => {
      vi.mocked(authApi.resendVerification).mockResolvedValueOnce({
        success: true,
        message: 'Verification email sent',
        timestamp: new Date().toISOString(),
      })

      const { resend, countdown } = useResendVerification()

      await resend(testEmail)
      expect(countdown.value).toBe(60)

      vi.mocked(authApi.resendVerification).mockClear()

      await resend(testEmail)
      expect(authApi.resendVerification).not.toHaveBeenCalled()
    })

    it('allows resend after countdown reaches zero', async () => {
      vi.mocked(authApi.resendVerification)
        .mockResolvedValueOnce({
          success: true,
          message: 'First sent',
          timestamp: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          success: true,
          message: 'Second sent',
          timestamp: new Date().toISOString(),
        })

      const { resend, countdown } = useResendVerification()

      await resend(testEmail)
      expect(countdown.value).toBe(60)

      await vi.advanceTimersByTimeAsync(60_000)
      expect(countdown.value).toBe(0)

      await resend(testEmail)
      expect(authApi.resendVerification).toHaveBeenCalledTimes(2)
      expect(countdown.value).toBe(60)
    })

    it('decrements countdown by 1 every second', async () => {
      vi.mocked(authApi.resendVerification).mockResolvedValueOnce({
        success: true,
        message: 'Verification email sent',
        timestamp: new Date().toISOString(),
      })

      const { resend, countdown } = useResendVerification()
      await resend(testEmail)

      expect(countdown.value).toBe(60)

      await vi.advanceTimersByTimeAsync(1_000)
      expect(countdown.value).toBe(59)

      await vi.advanceTimersByTimeAsync(10_000)
      expect(countdown.value).toBe(49)

      await vi.advanceTimersByTimeAsync(49_000)
      expect(countdown.value).toBe(0)
    })
  })

  describe('error handling', () => {
    it('shows error toast on generic API failure', async () => {
      // Mock a real API error with statusCode so isApiError recognizes it
      vi.mocked(authApi.resendVerification).mockRejectedValueOnce({
        statusCode: 500,
        message: 'Network error',
      })

      const { resend } = useResendVerification()
      await resend(testEmail)

      expect(toast.error).toHaveBeenCalledWith('Failed to resend verification email', {
        description: 'Network error',
      })
    })

    it('shows default error message when error has no message', async () => {
      vi.mocked(authApi.resendVerification).mockRejectedValueOnce({})

      const { resend } = useResendVerification()
      await resend(testEmail)

      expect(toast.error).toHaveBeenCalledWith('Failed to resend verification email', {
        description: 'Please try again later',
      })
    })

    it('handles 429 rate limit error with 60-second countdown', async () => {
      vi.mocked(authApi.resendVerification).mockRejectedValueOnce({
        statusCode: 429,
        message: 'Too many requests',
      })

      const { resend, countdown } = useResendVerification()
      await resend(testEmail)

      expect(toast.error).toHaveBeenCalledWith('Too many requests', {
        description: 'Please wait 60 seconds before trying again',
      })
      expect(countdown.value).toBe(60)
    })

    it('handles 409 USER_002 error (email already verified)', async () => {
      vi.mocked(authApi.resendVerification).mockRejectedValueOnce({
        statusCode: 409,
        error: 'USER_002',
        message: 'Email already verified',
      })

      const { resend, countdown } = useResendVerification()
      await resend(testEmail)

      expect(toast.info).toHaveBeenCalledWith('Email already verified', {
        description: 'Please proceed to login',
      })
      expect(countdown.value).toBe(0)
    })

    it('handles 409 non-USER_002 error as generic error', async () => {
      vi.mocked(authApi.resendVerification).mockRejectedValueOnce({
        statusCode: 409,
        error: 'OTHER_ERROR',
        message: 'Some conflict',
      })

      const { resend } = useResendVerification()
      await resend(testEmail)

      expect(toast.error).toHaveBeenCalledWith('Failed to resend verification email', {
        description: 'Some conflict',
      })
    })

    it('does not start countdown on generic error', async () => {
      vi.mocked(authApi.resendVerification).mockRejectedValueOnce({
        message: 'Server error',
      })

      const { resend, countdown } = useResendVerification()
      await resend(testEmail)

      expect(countdown.value).toBe(0)
    })
  })

  describe('concurrent calls', () => {
    it('prevents resend while another resend is pending', async () => {
      let resolvePromise: (value: unknown) => void
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(authApi.resendVerification).mockReturnValue(
        pendingPromise as Promise<EmptyResponse>,
      )

      const { resend } = useResendVerification()

      const firstPromise = resend(testEmail)

      await resend(testEmail)

      expect(authApi.resendVerification).toHaveBeenCalledTimes(1)

      resolvePromise!({ success: true, message: 'OK', timestamp: new Date().toISOString() })
      await firstPromise
    })
  })
})
