<script setup lang="ts">
import { ref, computed, toValue } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { useMutation } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/auth'
import { RouteNames } from '@/router/route-names'
import { isApiError, mapApiErrorCode } from '@/lib/utils/api-error'
import { useCooldown } from '@/composables/useCooldown'
import { useResendVerification } from '../composables/useResendVerification'
import { usePublicConfig } from '@/composables/usePublicConfig'
import { getGitHubAuthorizeUrl } from '@/lib/api/auth'
import LoginForm from '../components/LoginForm.vue'
import type { useForm } from 'vee-validate'
import type CaptchaWidget from '@/components/CaptchaWidget.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { countdown, start } = useCooldown()
const { resend, countdown: resendCountdown, isPending: isResending } = useResendVerification()
const { data: publicConfig } = usePublicConfig()
const captchaSiteKey = computed(() => publicConfig.value?.captchaSiteKey ?? null)

// Form ref for setting inline field errors (AUTH_001)
const loginFormRef = ref<{
  form: ReturnType<typeof useForm>
  captchaRef: InstanceType<typeof CaptchaWidget> | null
} | null>(null)

// Dialog state for specific error scenarios
const showLockedDialog = ref(false)
const showVerificationDialog = ref(false)
const pendingEmail = ref('')
const lockCountdown = ref(0)

const mutation = useMutation({
  mutationFn: authStore.login,
  onSuccess: () => {
    loginFormRef.value?.captchaRef?.reset()
    const redirect = route.query.redirect as string
    router.push(redirect || { name: RouteNames.DASHBOARD })
  },
  onError: (error: unknown) => {
    loginFormRef.value?.captchaRef?.reset()
    if (!isApiError(error)) {
      toast.error('Login failed', { description: 'An unexpected error occurred' })
      return
    }

    const errorCode = (error.data as { code?: string })?.code

    switch (errorCode) {
      case 'AUTH_001':
        // Invalid credentials - inline field error on email
        loginFormRef.value?.form.setFieldError('email', mapApiErrorCode('AUTH_001'))
        loginFormRef.value?.form.setFieldError('password', ' ')
        break

      case 'AUTH_004': {
        // Account locked - show locked dialog with countdown
        showLockedDialog.value = true
        // Parse retryAfter from ISO 8601 timestamp
        const data = error.data as { retryAfter?: string } | undefined
        if (data?.retryAfter) {
          const retryDate = new Date(data.retryAfter)
          const now = new Date()
          lockCountdown.value = Math.max(0, Math.floor((retryDate.getTime() - now.getTime()) / 1000))
        }
        break
      }

      case 'AUTH_005':
        // Account suspended
        toast.error(mapApiErrorCode('AUTH_005'))
        break

      case 'AUTH_006':
        // Email not verified - show verification dialog
        showVerificationDialog.value = true
        break

      case 'SECURITY_006':
      case 'SECURITY_007':
        // Captcha verification failed or missing
        toast.error(mapApiErrorCode(errorCode))
        break

      case 'RATE_LIMIT_001':
        // Rate limited - use existing cooldown pattern
        start()
        toast.error(mapApiErrorCode('RATE_LIMIT_001'), {
          description: `Try again in ${countdown.value}s`,
        })
        break

      default:
        // Handle 429 status code (rate limit) without specific error code
        if (error.statusCode === 429) {
          start()
          toast.error(mapApiErrorCode('rate_limit_exceeded'), {
            description: `Try again in ${countdown.value}s`,
          })
        } else {
          // Generic error fallback — never leak HTTP method/path/status
          toast.error('Login failed', { description: 'Please try again later' })
        }
    }
  },
})

const handleSubmit = (data: { email: string; password: string; captchaToken?: string }) => {
  // Store email for potential resend verification dialog
  pendingEmail.value = data.email
  mutation.mutate(data)
}

const isSubmitting = computed(() => toValue(mutation.isPending))

const githubMutation = useMutation({
  // Use 'login' explicitly to match the BIND flow's signature pattern.
  // LoginView serves the OAuth LOGIN flow only; ProfileView uses 'bind'.
  mutationFn: () => getGitHubAuthorizeUrl('login'),
  onSuccess: (data) => {
    globalThis.location.href = data.authUrl
  },
  onError: () => {
    toast.error('GitHub login failed', { description: 'Unable to start GitHub authorization. Please try again.' })
  },
})

const handleGitHubLogin = () => {
  githubMutation.mutate()
}

const handleResendVerification = async () => {
  await resend(pendingEmail.value)
  if (resendCountdown.value === 0) {
    toast.success('Verification email sent', { description: 'Please check your inbox' })
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-sm space-y-10">
    <!-- Header -->
    <div class="space-y-4">
      <div class="flex items-center gap-2.5 lg:hidden">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5e6ad2] text-white shadow-md shadow-[#5e6ad2]/20"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <span class="text-lg font-[510] text-gray-900 dark:text-[#f7f8f8]" style="font-feature-settings: 'cv01', 'ss03'"
          >CTT</span
        >
      </div>
      <h1
        class="text-3xl font-[510] text-gray-900 dark:text-[#f7f8f8]"
        style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
      >
        Welcome back
      </h1>
      <p class="text-base text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
        Sign in to access your coding analytics dashboard.
      </p>
    </div>

    <!-- Form -->
    <LoginForm
      ref="loginFormRef"
      :loading="isSubmitting"
      :captcha-site-key="captchaSiteKey"
      @submit="handleSubmit"
      @github-login="handleGitHubLogin"
    />

    <!-- Create Account Link -->
    <div class="pt-2 text-center">
      <p class="text-sm text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
        Don't have an account?
        <RouterLink
          :to="{ name: RouteNames.REGISTER }"
          class="ml-1 font-[510] text-[#5e6ad2] underline-offset-4 hover:text-[#7170ff] hover:underline dark:text-[#7170ff] dark:hover:text-[#828fff]"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          Create account
        </RouterLink>
      </p>
    </div>

    <!-- Account Locked Dialog (AUTH_004) -->
    <Dialog v-model:open="showLockedDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Locked</DialogTitle>
          <DialogDescription>
            Too many failed login attempts. Your account has been temporarily locked for security.
            <br />
            <span v-if="lockCountdown > 0">
              Please try again in <strong>{{ lockCountdown }}</strong> seconds.
            </span>
            <span v-else> You may now attempt to sign in again. </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showLockedDialog = false"> Close </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Email Not Verified Dialog (AUTH_006) -->
    <Dialog v-model:open="showVerificationDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email Not Verified</DialogTitle>
          <DialogDescription>
            Your account <strong>{{ pendingEmail }}</strong> has not been verified yet. Please check your inbox and
            click the verification link.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showVerificationDialog = false"> Close </Button>
          <Button :disabled="isResending || resendCountdown > 0" @click="handleResendVerification">
            {{ isResending ? 'Sending...' : resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Email' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
