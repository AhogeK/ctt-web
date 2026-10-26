import { ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { i18n } from '@/i18n'
import { setPassword, changePassword } from '@/lib/api/user'
import { extractErrorCode, mapApiErrorCode } from '@/lib/utils/api-error'
import { userKeys } from '@/lib/query-keys'

/**
 * Error code constants for set password operations.
 *
 * These codes are returned by ctt-server and mapped to user-friendly messages
 * via mapApiErrorCode in api-error.ts.
 */
const SET_PASSWORD_ERROR_CODES = {
  ALREADY_HAS_PASSWORD: 'USER_015',
  INVALID_FORMAT: 'COMMON_003',
} as const

/**
 * Shared dialog open state — module-level so all callers
 * (AccountSection, ProfileView, etc.) share the same ref.
 */
const isDialogOpen = ref(false)

/**
 * Composable for OAuth set/change password functionality.
 *
 * Provides mutations for setting a password on OAuth accounts
 * and changing an existing password, plus shared dialog state
 * for the SetPasswordDialog component.
 *
 * @returns Object with mutations, dialog state, and error code constants
 */
export function useSetPassword() {
  const t = i18n.global.t
  const queryClient = useQueryClient()

  /**
   * Invalidate user profile query to reflect password status change.
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
   * Set password for OAuth users.
   *
   * Endpoint: POST /api/v1/users/me/password/set
   */
  const mutation = useMutation({
    mutationFn: (newPassword: string) => setPassword(newPassword),
    onSuccess: () => {
      toast.success(t('settings.toasts.passwordSet'), {
        description: t('settings.toasts.passwordSetBody'),
      })
      isDialogOpen.value = false
      invalidateUserQuery()
    },
    onError: (error: unknown) => {
      const code = extractErrorCode(error)
      if (code === SET_PASSWORD_ERROR_CODES.ALREADY_HAS_PASSWORD) {
        toast.error(getErrorMessage(error))
      } else {
        toast.error(t('settings.toasts.passwordSetFailed'), {
          description: getErrorMessage(error),
        })
      }
    },
  })

  /**
   * Change password for users who already have one.
   *
   * Endpoint: POST /api/v1/users/me/password/change
   */
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => changePassword(data),
    onSuccess: () => {
      toast.success(t('settings.toasts.passwordChanged'), {
        description: t('settings.toasts.passwordChangedBody'),
      })
      isDialogOpen.value = false
      invalidateUserQuery()
    },
    onError: (error: unknown) => {
      toast.error(t('settings.toasts.passwordChangeFailed'), {
        description: getErrorMessage(error),
      })
    },
  })

  return {
    mutation,
    changePasswordMutation,
    isDialogOpen,
    SET_PASSWORD_ERROR_CODES,
  }
}
