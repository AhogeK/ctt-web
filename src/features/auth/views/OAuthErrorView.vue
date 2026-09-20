<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { RouteNames } from '@/router/route-names'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const router = useRouter()
const route = useRoute()

const errorCode = computed(() => (route.query.code as string) || 'UNKNOWN_ERROR')

const errorMessages: Record<string, string> = {
  AUTH_013: 'Authorization session expired. Please try again.',
  AUTH_015: 'GitHub authorization failed. Please try again.',
  AUTH_016: 'This GitHub account is already linked to another user.',
  AUTH_017: 'This GitHub account is not linked to any user.',
  AUTH_018: 'Cannot unlink the last login method.',
  AUTH_004: 'Account is temporarily locked. Please try again later.',
  AUTH_005: 'Account has been disabled. Please contact support.',
  AUTH_006: 'Please verify your email address first.',
  AUTH_019: 'Terms of service need to be accepted.',
  OAUTH_PROVIDER_ERROR: 'GitHub authorization was cancelled or failed.',
  MISSING_OAUTH_PARAMS: 'Invalid authorization request. Please try again.',
  INVALID_STATE_ACTION: 'Invalid authorization request. Please try again.',
  OAUTH_INTERNAL_ERROR: 'Service error. Please try again later.',
}

const errorMessage = computed(() => errorMessages[errorCode.value] || 'An unexpected error occurred. Please try again.')

function handleRetry() {
  void router.replace({ name: RouteNames.LOGIN })
}

function handleGoHome() {
  void router.replace({ name: RouteNames.LANDING })
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="mx-auto w-full max-w-sm space-y-6 text-center">
      <div class="space-y-2">
        <h1
          class="text-2xl font-emphasis text-foreground dark:text-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          Sign in failed
        </h1>
        <p
          class="text-sm text-muted-foreground dark:text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          {{ errorMessage }}
        </p>
      </div>

      <div class="flex flex-col gap-3">
        <Button
          :class="
            cn(
              'w-full h-10 rounded-md bg-primary text-white font-emphasis text-base',
              'shadow-lg shadow-primary/15 transition-[box-shadow,transform] duration-200',
              'hover:bg-accent-hover hover:shadow-accent-hover/20 hover:scale-[1.02] active:scale-[0.98]',
            )
          "
          style="font-feature-settings: 'cv01', 'ss03'"
          @click="handleRetry"
        >
          Try again
        </Button>
        <Button
          variant="ghost"
          class="w-full h-10 font-emphasis text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
          @click="handleGoHome"
        >
          Back to home
        </Button>
      </div>

      <p class="text-xs text-muted-foreground dark:text-muted-foreground">Error code: {{ errorCode }}</p>
    </div>
  </div>
</template>
