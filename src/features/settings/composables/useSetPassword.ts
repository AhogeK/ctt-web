import { ref } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
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
    return 'An unexpected error occurred. Please try again later.'
  }

  /**
   * Set password for OAuth users.
   *
   * Endpoint: POST /api/v1/users/me/password/set
   */
  const mutation = useMutation({
    mutationFn: (newPassword: string) => setPassword(newPassword),
    onSuccess: () => {
      toast.success('Password set successfully', {
        description: 'You can now sign in with your email and password.',
      })
      isDialogOpen.value = false
      invalidateUserQuery()
    },
    onError: (error: unknown) => {
      const code = extractErrorCode(error)
      if (code === SET_PASSWORD_ERROR_CODES.ALREADY_HAS_PASSWORD) {
        toast.error(getErrorMessage(error))
      } else {
        toast.error('Failed to set password', {
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
      toast.success('Password changed successfully', {
        description: 'Your password has been updated.',
      })
      isDialogOpen.value = false
      invalidateUserQuery()
    },
    onError: (error: unknown) => {
      toast.error('Failed to change password', {
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
