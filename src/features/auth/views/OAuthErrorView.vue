<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { RouteNames } from '@/router/route-names'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()

const errorCode = computed(() => (route.query.code as string) || 'UNKNOWN_ERROR')

const errorMessages: Record<string, string> = {
  AUTH_013: 'auth.oauthErrors.sessionExpired',
  AUTH_015: 'auth.oauthErrors.githubFailed',
  AUTH_016: 'auth.oauthErrors.linkedOther',
  AUTH_017: 'auth.oauthErrors.notLinked',
  AUTH_018: 'auth.oauthErrors.lastMethod',
  AUTH_004: 'auth.oauthErrors.locked',
  AUTH_005: 'auth.oauthErrors.disabled',
  AUTH_006: 'auth.oauthErrors.emailFirst',
  AUTH_019: 'auth.oauthErrors.termsRequired',
  OAUTH_PROVIDER_ERROR: 'auth.oauthErrors.cancelled',
  MISSING_OAUTH_PARAMS: 'auth.oauthErrors.invalidRequest',
  INVALID_STATE_ACTION: 'auth.oauthErrors.invalidRequest',
  OAUTH_INTERNAL_ERROR: 'auth.oauthErrors.service',
}

const errorMessage = computed(() => t(errorMessages[errorCode.value] ?? 'auth.oauthErrors.fallback'))

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
          {{ t('auth.oauthErrors.title') }}
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
              'active:scale-[0.98]',
            )
          "
          style="font-feature-settings: 'cv01', 'ss03'"
          @click="handleRetry"
        >
          {{ t('auth.common.tryAgain') }}
        </Button>
        <Button
          variant="ghost"
          class="w-full h-10 font-emphasis text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
          @click="handleGoHome"
        >
          {{ t('auth.oauthErrors.home') }}
        </Button>
      </div>
    </div>
  </div>
</template>
