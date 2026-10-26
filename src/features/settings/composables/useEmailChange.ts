import { ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { i18n } from '@/i18n'
import {
  requestEmailChange,
  confirmEmailChange,
  cancelEmailChange,
  resendEmailChangeVerification,
} from '@/lib/api/email'
import { extractErrorCode, mapApiErrorCode } from '@/lib/utils/api-error'
import { userKeys } from '@/lib/query-keys'

/**
 * Error code constants for email change operations.
 *
 * These codes are returned by ctt-server and mapped to user-friendly messages
 * via mapApiErrorCode in api-error.ts.
 */
const EMAIL_CHANGE_ERROR_CODES = {
  ALREADY_PENDING: 'USER_009',
  EXPIRED: 'USER_010',
  INVALID: 'USER_011',
  PASSWORD_REQUIRED: 'USER_013',
  WRONG_PASSWORD: 'USER_014',
} as const

/**
 * Composable for email change functionality.
 *
 * Manages the four email change operations:
 * - Request email change (requires new email + current password)
 * - Confirm email change (requires token from verification email)
 * - Cancel pending email change
 * - Resend verification email for pending change
 *
 * Uses TanStack Query mutations for server state management and
 * vue-sonner for toast notifications.
 *
 * @returns Object with mutation hooks and dialog state
 */
/**
 * Shared dialog open state — module-level so all callers
 * (AccountSection, ProfileView, etc.) share the same ref.
 */
const isDialogOpen = ref(false)

export function useEmailChange() {
  const t = i18n.global.t
  const queryClient = useQueryClient()

  /**
   * Invalidate user profile query to reflect email change status.
   */
  const invalidateUserQuery = () => {
    void queryClient.invalidateQueries({ queryKey: userKeys.all })
  }

  /**
   * Extract and map error code to user-friendly message.
   * Falls back to generic message if code is unavailable.
   */
  const getErrorMessage = (error: unknown): string => {
    const code = extractErrorCode(error)
    if (code) {
      return mapApiErrorCode(code)
    }
    return t('settings.errors.unexpected')
  }

  /**
   * Request an email change.
   *
   * Sends a verification email to the new address. The user must confirm
   * via the link in the email to complete the change.
   *
   * Endpoint: POST /api/v1/users/me/email/change-request
   */
  const requestMutation = useMutation({
    mutationFn: (params: { newEmail: string; password: string }) => requestEmailChange(params),
    onSuccess: () => {
      toast.success(t('settings.toasts.emailChangeSent'), {
        description: t('settings.toasts.emailChangeSentBody'),
      })
      isDialogOpen.value = false
      invalidateUserQuery()
    },
    onError: (error: unknown) => {
      const code = extractErrorCode(error)
      if (code === EMAIL_CHANGE_ERROR_CODES.ALREADY_PENDING) {
        toast.error(getErrorMessage(error), {
          description: t('settings.toasts.emailChangePendingBody'),
        })
      } else if (
        code === EMAIL_CHANGE_ERROR_CODES.PASSWORD_REQUIRED ||
        code === EMAIL_CHANGE_ERROR_CODES.WRONG_PASSWORD
      ) {
        toast.error(getErrorMessage(error))
      } else {
        toast.error(t('settings.toasts.emailChangeRequestFailed'), {
          description: getErrorMessage(error),
        })
      }
    },
  })

  /**
   * Confirm an email change using the token from the verification email.
   *
   * Endpoint: POST /api/v1/users/me/email/change-confirm
   */
  const confirmMutation = useMutation({
    mutationFn: (params: { token: string }) => confirmEmailChange(params),
    onSuccess: () => {
      toast.success(t('settings.toasts.emailChanged'), {
        description: t('settings.toasts.emailChangedBody'),
      })
      invalidateUserQuery()
    },
    onError: (error: unknown) => {
      const code = extractErrorCode(error)
      if (code === EMAIL_CHANGE_ERROR_CODES.EXPIRED) {
        toast.error(getErrorMessage(error), {
          description: t('settings.toasts.requestNewEmailChange'),
        })
      } else if (code === EMAIL_CHANGE_ERROR_CODES.INVALID) {
        toast.error(getErrorMessage(error), {
          description: t('settings.toasts.checkEmailLink'),
        })
      } else {
        toast.error(t('settings.toasts.emailChangeConfirmFailed'), {
          description: getErrorMessage(error),
        })
      }
    },
  })

  /**
   * Cancel a pending email change request.
   *
   * Endpoint: DELETE /api/v1/users/me/email/change-request
   */
  const cancelMutation = useMutation({
    mutationFn: () => cancelEmailChange(),
    onSuccess: () => {
      toast.success(t('settings.toasts.emailChangeCancelled'))
      invalidateUserQuery()
    },
    onError: (error: unknown) => {
      toast.error(t('settings.toasts.emailChangeCancelFailed'), {
        description: getErrorMessage(error),
      })
    },
  })

  /**
   * Resend verification email for a pending email change.
   *
   * Endpoint: POST /api/v1/users/me/email/resend-verification
   */
  const resendMutation = useMutation({
    mutationFn: () => resendEmailChangeVerification(),
    onSuccess: () => {
      toast.success(t('settings.toasts.verificationResent'), {
        description: t('settings.toasts.verificationResentBody'),
      })
    },
    onError: (error: unknown) => {
      toast.error(t('settings.toasts.verificationResendFailed'), {
        description: getErrorMessage(error),
      })
    },
  })

  return {
    requestMutation,
    confirmMutation,
    cancelMutation,
    resendMutation,
    isDialogOpen,
  }
}
