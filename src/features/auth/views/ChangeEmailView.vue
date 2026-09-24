<script setup lang="ts">
/**
 * Email change confirmation view.
 *
 * Handles the email change verification token from the URL query parameter.
 * This page is accessed when the user clicks the verification link in their email.
 */
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { confirmEmailChange } from '@/lib/api/email'
import { extractErrorCode, mapApiErrorCode } from '@/lib/utils/api-error'
import { Button } from '@/components/ui/button'
import { RouteNames } from '@/router/route-names'
import { cn } from '@/lib/utils'

/** Delay in milliseconds before redirecting after successful email change. */
const REDIRECT_DELAY_MS = 3000

const route = useRoute()
const router = useRouter()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref<string | null>(null)

const confirmMutation = useMutation({
  mutationFn: (token: string) => confirmEmailChange({ token }),
  onSuccess: () => {
    status.value = 'success'
    toast.success('Email changed successfully', {
      description: 'Your email address has been updated.',
    })
    // Redirect to profile after delay
    setTimeout(() => {
      void router.push({ name: RouteNames.SETTINGS_PROFILE })
    }, REDIRECT_DELAY_MS)
  },
  onError: (error: unknown) => {
    status.value = 'error'
    const code = extractErrorCode(error)
    if (code) {
      errorMessage.value = mapApiErrorCode(code)
    } else {
      errorMessage.value = 'Failed to verify email change. The link may have expired or is invalid.'
    }
    toast.error('Email change failed', { description: errorMessage.value })
  },
})

onMounted(() => {
  const token = route.query.token as string | undefined
  if (!token) {
    status.value = 'error'
    errorMessage.value = 'No verification token found in the URL.'
    return
  }
  confirmMutation.mutate(token)
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div
      :class="cn('w-full max-w-md rounded-lg border p-8', 'border-border bg-white', 'dark:border-white/8 dark:bg-card')"
    >
      <!-- Loading state -->
      <div v-if="status === 'loading'" class="flex flex-col items-center gap-4">
        <svg
          class="h-8 w-8 animate-spin text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
        </svg>
        <p class="text-sm text-muted-foreground dark:text-muted-foreground">Verifying your email change...</p>
      </div>

      <!-- Success state -->
      <div v-else-if="status === 'success'" class="flex flex-col items-center gap-4">
        <div :class="cn('flex h-12 w-12 items-center justify-center rounded-full', 'bg-success/15 dark:bg-success/20')">
          <svg
            class="h-6 w-6 text-success dark:text-success"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <h2 class="text-lg font-medium text-foreground dark:text-foreground">Email Changed Successfully</h2>
        <p class="text-sm text-muted-foreground dark:text-muted-foreground">
          Your email address has been updated. You will be redirected to your profile shortly.
        </p>
        <Button variant="outline" @click="router.push({ name: RouteNames.SETTINGS_PROFILE })"> Go to Profile </Button>
      </div>

      <!-- Error state -->
      <div v-else class="flex flex-col items-center gap-4">
        <div
          :class="
            cn('flex h-12 w-12 items-center justify-center rounded-full', 'bg-destructive/15 dark:bg-destructive/20')
          "
        >
          <svg
            class="h-6 w-6 text-destructive dark:text-destructive"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 class="text-lg font-medium text-foreground dark:text-foreground">Verification Failed</h2>
        <p class="text-sm text-muted-foreground dark:text-muted-foreground">
          {{ errorMessage }}
        </p>
        <div class="flex gap-3">
          <Button variant="outline" @click="router.push({ name: RouteNames.SETTINGS_PROFILE })"> Go to Profile </Button>
          <Button :class="cn('bg-primary text-white', '')" @click="router.push({ name: RouteNames.LOGIN })">
            Sign In
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
