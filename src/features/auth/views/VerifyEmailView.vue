<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircle2, AlertTriangle, Loader2 } from '@lucide/vue'
import { verifyEmail } from '@/lib/api/auth'
import { isApiError, mapApiErrorCode } from '@/lib/utils/api-error'
import { RouteNames } from '@/router/route-names'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useResendVerification } from '../composables/useResendVerification'

type Status = 'loading' | 'success' | 'error'

const route = useRoute()
const router = useRouter()
const token = Array.isArray(route.query.token) ? route.query.token[0] : route.query.token

const status = ref<Status>('loading')
const errorMessage = ref('')
const autoRedirectTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const { resend, countdown, isPending } = useResendVerification()
const resendEmail = ref('')

const handleResend = () => {
  if (resendEmail.value.trim()) {
    resend(resendEmail.value.trim())
  }
}

onMounted(async () => {
  if (!token) {
    status.value = 'error'
    errorMessage.value = 'Invalid verification link. Please ensure you copied the complete URL.'
    return
  }
  try {
    await verifyEmail(token)
    status.value = 'success'
    autoRedirectTimer.value = setTimeout(() => {
      router.push({ name: RouteNames.LOGIN })
    }, 3000)
  } catch (error: unknown) {
    status.value = 'error'
    if (isApiError(error)) {
      const code = (error.data as { code?: string })?.code
      errorMessage.value = code ? mapApiErrorCode(code) : 'Verification failed. Please try again.'
    } else {
      errorMessage.value = 'Verification failed. Please try again.'
    }
  }
})

onUnmounted(() => {
  if (autoRedirectTimer.value) clearTimeout(autoRedirectTimer.value)
})
</script>

<template>
  <div class="mx-auto w-full max-w-sm space-y-10">
    <!-- Loading State -->
    <template v-if="status === 'loading'">
      <div class="relative flex h-16 w-16 items-center justify-center">
        <div class="absolute inset-0 rounded-full border-2 border-[#5e6ad2]/20 dark:border-[#5e6ad2]/30" />
        <Loader2 class="h-8 w-8 animate-spin text-[#5e6ad2]" />
      </div>
      <div class="space-y-3">
        <h1
          class="text-2xl font-[510] text-gray-900 dark:text-[#f7f8f8] sm:text-3xl"
          style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
        >
          Verifying your email
        </h1>
        <p class="text-base text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
          Please wait while we confirm your email address...
        </p>
      </div>
    </template>

    <!-- Success State -->
    <template v-else-if="status === 'success'">
      <div
        :class="
          cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl',
            'bg-[#10b981]/10 text-[#10b981] dark:bg-[#10b981]/15',
          )
        "
      >
        <CheckCircle2 class="h-8 w-8 animate-[scale-in_0.3s_ease-out]" />
      </div>
      <div class="space-y-3">
        <h1
          class="text-2xl font-[510] text-[#10b981] sm:text-3xl"
          style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
        >
          Email verified!
        </h1>
        <p class="text-base text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
          Your account is ready. Redirecting to login...
        </p>
      </div>
      <Button
        :class="
          cn(
            'w-full h-11 rounded-md bg-[#5e6ad2] text-white font-[510]',
            'shadow-lg shadow-[#5e6ad2]/25 transition-all duration-200',
            'hover:bg-[#7170ff] hover:shadow-[#7170ff]/30 hover:scale-[1.02] active:scale-[0.98]',
          )
        "
        @click="router.push({ name: RouteNames.LOGIN })"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Go to sign in
      </Button>
    </template>

    <!-- Error State -->
    <template v-else>
      <div
        :class="
          cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl',
            'bg-[#ef4444]/10 text-[#ef4444] dark:bg-[#ef4444]/15',
          )
        "
      >
        <AlertTriangle class="h-8 w-8" />
      </div>
      <div class="space-y-3">
        <h1
          class="text-2xl font-[510] text-[#ef4444] sm:text-3xl"
          style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
        >
          Verification failed
        </h1>
        <p class="text-base text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
          {{ errorMessage }}
        </p>
      </div>
      <div
        :class="
          cn(
            'rounded-xl border border-[#d0d6e0] bg-[#e5e7eb]/80 p-5',
            'backdrop-blur-sm dark:border-white/8 dark:bg-white/3 dark:backdrop-blur-md',
          )
        "
      >
        <p class="text-sm font-[510] text-gray-700 dark:text-[#d0d6e0]" style="font-feature-settings: 'cv01', 'ss03'">
          Need a new verification link?
        </p>
        <Input
          :class="
            cn(
              'h-11 rounded-md border border-[#d0d6e0] bg-white text-[#1a1a2e]',
              'placeholder:text-[#8a8f98] transition-all duration-200',
              'focus:border-[#5e6ad2] focus:ring-2 focus:ring-[#5e6ad2]/20',
              'dark:border-white/8 dark:bg-white/2 dark:text-[#f7f8f8]',
              'dark:placeholder:text-[#62666d] dark:focus:border-[#5e6ad2]',
              'dark:focus:bg-white/4 dark:focus:ring-[#5e6ad2]/25',
            )
          "
          v-model="resendEmail"
          type="email"
          placeholder="Enter your email address"
        />
        <button
          :class="
            cn(
              'w-full h-11 cursor-pointer rounded-md border border-[#d0d6e0] bg-white font-[510] text-gray-700 shadow-xs',
              'transition-all duration-200 hover:border-[#5e6ad2] hover:text-[#5e6ad2]',
              'dark:border-white/8 dark:bg-input/30 dark:text-[#d0d6e0]',
              'dark:hover:border-[#5e6ad2]/50 dark:hover:bg-input/50 dark:hover:text-[#5e6ad2]',
            )
          "
          :disabled="countdown > 0 || isPending || !resendEmail.trim()"
          @click="handleResend"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          {{ countdown > 0 ? `Resend in ${countdown}s` : 'Resend verification email' }}
        </button>
      </div>
      <Button
        variant="ghost"
        :class="cn('w-full h-11 font-[510] text-muted-foreground')"
        @click="router.push({ name: RouteNames.LOGIN })"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Back to sign in
      </Button>
    </template>
  </div>
</template>
