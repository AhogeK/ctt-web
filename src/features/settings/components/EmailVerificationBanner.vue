<script setup lang="ts">
/**
 * Email verification warning banner.
 *
 * Displayed when the authenticated user's email is not verified.
 * Provides a resend verification button with 60-second cooldown
 * to prevent abuse (backend rate limit: 3 requests/minute).
 */
import { computed } from 'vue'
import { AlertTriangle, Mail, Loader2 } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useResendVerification } from '@/features/auth/composables/useResendVerification'
import { cn } from '@/lib/utils'

const authStore = useAuthStore()
const { emailVerified, email } = storeToRefs(authStore)

const { resend, countdown, isPending } = useResendVerification()

const isVisible = computed(() => !emailVerified.value)

const buttonLabel = computed(() => {
  if (countdown.value > 0) return `Resend in ${countdown.value}s`
  return 'Resend verification email'
})

function handleResend() {
  if (email.value) {
    resend(email.value)
  }
}
</script>

<template>
  <div
    v-if="isVisible"
    role="alert"
    :class="
      cn(
        'flex items-start gap-3 rounded-lg border p-4',
        'border-amber-200 bg-amber-50 text-amber-900',
        'dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200',
      )
    "
  >
    <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
    <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <p class="text-sm font-medium">Email not verified</p>
        <p class="text-sm text-amber-700 dark:text-amber-300/80">
          Please verify your email address to access all features.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        :class="
          cn(
            'shrink-0 gap-1.5',
            'border-amber-300 bg-white text-amber-900',
            'hover:bg-amber-100 hover:text-amber-900',
            'dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
            'dark:hover:bg-amber-500/20',
          )
        "
        :disabled="isPending || countdown > 0"
        @click="handleResend"
      >
        <Loader2 v-if="isPending" class="h-4 w-4 animate-spin" />
        <Mail v-else class="h-4 w-4" />
        {{ buttonLabel }}
      </Button>
    </div>
  </div>
</template>
