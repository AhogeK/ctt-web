import { ref, onUnmounted } from 'vue'
import { i18n } from '@/i18n'
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
  const t = i18n.global.t
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
      const response = await resendVerification(email)
      if (response.idempotentSkip) {
        toast.info(t('auth.errors.alreadySentWithin'), {
          description: t('auth.errors.checkInbox'),
        })
      } else {
        toast.success(t('auth.errors.verificationEmailSent'), {
          description: t('auth.errors.checkInbox'),
        })
      }
      startCountdown(60)
    } catch (error: unknown) {
      if (isApiError(error)) {
        if (error.statusCode === 429) {
          const retryAfter = 60
          toast.error(t('auth.errors.tooManyRequests'), {
            description: t('auth.errors.waitSeconds', { seconds: retryAfter }),
          })
          startCountdown(retryAfter)
        } else if (error.statusCode === 409 && (error.data as { code?: string })?.code === 'USER_007') {
          toast.info(t('auth.errors.alreadyVerified'), {
            description: t('auth.errors.proceedToLogin'),
          })
        } else {
          toast.error(t('auth.errors.failedResend'), {
            description: t('auth.errors.tryAgainLater'),
          })
        }
      } else {
        toast.error(t('auth.errors.failedResend'), {
          description: t('auth.errors.tryAgainLater'),
        })
      }
    } finally {
      isPending.value = false
    }
  }

  return { resend, countdown, isPending }
}
