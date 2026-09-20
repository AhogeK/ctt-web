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
        <div class="absolute inset-0 rounded-full border-2 border-primary/20 dark:border-primary/30" />
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
      </div>
      <div class="space-y-3">
        <h1
          class="text-2xl font-emphasis text-foreground dark:text-foreground sm:text-3xl"
          style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
        >
          Verifying your email
        </h1>
        <p
          class="text-base text-muted-foreground dark:text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          Please wait while we confirm your email address...
        </p>
      </div>
    </template>

    <!-- Success State -->
    <template v-else-if="status === 'success'">
      <div
        :class="
          cn('flex h-16 w-16 items-center justify-center rounded-2xl', 'bg-success/10 text-success dark:bg-success/15')
        "
      >
        <CheckCircle2 class="h-8 w-8 animate-[scale-in_0.3s_ease-out]" />
      </div>
      <div class="space-y-3">
        <h1
          class="text-2xl font-emphasis text-success sm:text-3xl"
          style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
        >
          Email verified!
        </h1>
        <p
          class="text-base text-muted-foreground dark:text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          Your account is ready. Redirecting to login...
        </p>
      </div>
      <Button
        :class="
          cn(
            'w-full h-11 rounded-md bg-primary text-white font-emphasis',
            'shadow-lg shadow-primary/25 transition-[box-shadow,transform] duration-200',
            'hover:bg-accent hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98]',
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
            'bg-destructive/10 text-destructive dark:bg-destructive/15',
          )
        "
      >
        <AlertTriangle class="h-8 w-8" />
      </div>
      <div class="space-y-3">
        <h1
          class="text-2xl font-emphasis text-destructive sm:text-3xl"
          style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
        >
          Verification failed
        </h1>
        <p
          class="text-base text-muted-foreground dark:text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          {{ errorMessage }}
        </p>
      </div>
      <div
        :class="
          cn(
            'rounded-xl border border-border bg-muted/80 p-5',
            'backdrop-blur-sm dark:border-white/8 dark:bg-white/3 dark:backdrop-blur-md',
          )
        "
      >
        <p
          class="text-sm font-emphasis text-foreground/90 dark:text-secondary-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          Need a new verification link?
        </p>
        <Input
          :class="
            cn(
              'h-11 rounded-md border border-border bg-white text-foreground',
              'placeholder:text-muted-foreground transition-[color,box-shadow] duration-200',
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              'dark:border-white/8 dark:bg-white/2 dark:text-foreground',
              'dark:placeholder:text-muted-foreground dark:focus:border-primary',
              'dark:focus:bg-white/4 dark:focus:ring-primary/25',
            )
          "
          v-model="resendEmail"
          type="email"
          placeholder="Enter your email address"
        />
        <button
          :class="
            cn(
              'w-full h-11 cursor-pointer rounded-md border border-border bg-white font-emphasis text-foreground/90 shadow-xs',
              'transition-[border-color,color] duration-200 hover:border-primary hover:text-primary',
              'dark:border-white/8 dark:bg-input/30 dark:text-secondary-foreground',
              'dark:hover:border-primary/50 dark:hover:bg-input/50 dark:hover:text-primary',
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
        :class="cn('w-full h-11 font-emphasis text-muted-foreground')"
        @click="router.push({ name: RouteNames.LOGIN })"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Back to sign in
      </Button>
    </template>
  </div>
</template>
