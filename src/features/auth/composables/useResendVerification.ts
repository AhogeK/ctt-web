import { ref, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import { resendVerification } from '@/lib/api/auth'
import { isApiError } from '@/lib/utils/api-error'

/**
 * Composable for resending email verification with cooldown countdown.
 *
 * Manages a 60-second cooldown timer after successful resend to prevent
 * abuse and respect the backend rate limit (3 requests/minute per email).
 *
 * @returns Object with resend function, countdown ref, and isPending ref
 */
export function useResendVerification() {
  const countdown = ref(0)
  const isPending = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  const startCountdown = (seconds: number) => {
    countdown.value = seconds
    if (timer) {
      clearInterval(timer)
    }

    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  }

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
    }
  })

  const resend = async (email: string) => {
    if (countdown.value > 0 || isPending.value) return

    isPending.value = true
    try {
      await resendVerification(email)
      toast.success('Verification email sent', {
        description: 'Please check your inbox',
      })
      startCountdown(60)
    } catch (error: unknown) {
      if (isApiError(error)) {
        if (error.statusCode === 429) {
          const retryAfter = 60
          toast.error('Too many requests', {
            description: `Please wait ${retryAfter} seconds before trying again`,
          })
          startCountdown(retryAfter)
        } else if (error.statusCode === 409 && error.error === 'USER_007') {
          toast.info('Email already verified', {
            description: 'Please proceed to login',
          })
        } else {
          toast.error('Failed to resend verification email', {
            description: error.message || 'Please try again later',
          })
        }
      } else {
        toast.error('Failed to resend verification email', {
          description: 'Please try again later',
        })
      }
    } finally {
      isPending.value = false
    }
  }

  return { resend, countdown, isPending }
}
