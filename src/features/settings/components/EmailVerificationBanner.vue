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
        'border-warning-border bg-warning-surface text-warning',
        'dark:border-warning-border dark:bg-warning-surface dark:text-warning',
      )
    "
  >
    <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0 text-warning dark:text-warning" />
    <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <p class="text-sm font-medium">Email not verified</p>
        <p class="text-sm text-warning dark:text-warning/80">
          Please verify your email address to access all features.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        :class="
          cn(
            'shrink-0 gap-1.5',
            'border-warning-border bg-white text-warning',
            'hover:bg-warning-surface hover:text-warning',
            'dark:border-warning-border dark:bg-warning-surface dark:text-warning',
            'dark:hover:bg-warning-surface',
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
