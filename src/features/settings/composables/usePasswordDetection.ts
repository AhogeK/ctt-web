import { ref } from 'vue'
import { setPassword } from '@/lib/api/user'
import { extractErrorCode, isApiError } from '@/lib/utils/api-error'

/**
 * Composable to detect if the current user has a password set.
 *
 * OAuth users don't have a password (passwordHash = null).
 * This composable detects password presence by attempting to call
 * the Set Password API with an empty password.
 *
 * Detection is LAZY — call `recheck()` explicitly when password status
 * is needed (e.g. before opening the set-password dialog).
 * No API call is made on mount.
 *
 * - If USER_015 error is returned → user has password → hasPassword = true
 * - If other API error (e.g. COMMON_003 validation) → user doesn't have password → hasPassword = false
 * - If network/unknown error → checkError is set, hasPassword unchanged
 *
 * @deprecated Use `authStore.hasPassword` from `@/stores/auth` instead.
 * This composable calls the write endpoint `setPassword('')` to detect password status,
 * which is an anti-pattern. The backend now provides `hasPassword` in `GET /api/v1/users/me`.
 *
 * @returns Object with hasPassword ref, loading state, error state, and recheck function
 */
export function usePasswordDetection() {
  const hasPassword = ref<boolean | null>(null)
  const isChecking = ref(false)
  const checkError = ref<string | null>(null)

  async function checkPasswordStatus() {
    if (isChecking.value) return
    isChecking.value = true
    checkError.value = null

    try {
      await setPassword('')
      // If call succeeds (unlikely with empty password), user doesn't have a password
      hasPassword.value = false
    } catch (error: unknown) {
      const code = extractErrorCode(error)
      if (code === 'USER_015') {
        // USER_015 = "You already have a password set"
        hasPassword.value = true
      } else if (isApiError(error)) {
        // API responded with a non-USER_015 error (e.g. COMMON_003 validation)
        // → user exists but doesn't have a password
        hasPassword.value = false
      } else {
        // Network error or unknown error — cannot determine password status
        checkError.value = 'Unable to check password status. Please try again.'
      }
    } finally {
      isChecking.value = false
    }
  }

  return {
    hasPassword,
    isChecking,
    checkError,
    recheck: checkPasswordStatus,
  }
}
