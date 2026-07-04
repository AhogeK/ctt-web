import { ref, onMounted } from 'vue'
import { setPassword } from '@/lib/api/user'
import { extractErrorCode, isApiError } from '@/lib/utils/api-error'

/**
 * Composable to detect if the current user has a password set.
 *
 * OAuth users don't have a password (passwordHash = null).
 * This composable detects password presence by attempting to call
 * the Set Password API with an empty password.
 *
 * - If USER_015 error is returned → user has password → hasPassword = true
 * - If other API error (e.g. COMMON_003 validation) → user doesn't have password → hasPassword = false
 * - If network/unknown error → checkError is set, hasPassword unchanged
 *
 * @returns Object with hasPassword ref, loading state, and error state
 */
export function usePasswordDetection() {
  const hasPassword = ref(false)
  const isChecking = ref(true)
  const checkError = ref<string | null>(null)

  async function checkPasswordStatus() {
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

  onMounted(() => {
    void checkPasswordStatus()
  })

  return {
    hasPassword,
    isChecking,
    checkError,
    recheck: checkPasswordStatus,
  }
}
