<script setup lang="ts">
/**
 * Security settings view.
 *
 * Two facts about the account that a profile page has no room for: where it is signed in, and
 * how to take its data elsewhere. Both are account-scoped resources rather than preferences, so
 * they live together here instead of among the appearance controls.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Info } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { RouteNames } from '@/router/route-names'
import { useAuthStore } from '@/stores/auth'
import { useRecentAuthentication } from '../composables/useRecentAuthentication'
import DataExportCard from '../components/DataExportCard.vue'
import LoginSessionsCard from '../components/LoginSessionsCard.vue'
import TwoFactorCard from '../components/TwoFactorCard.vue'
import PasskeyCard from '../components/PasskeyCard.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const { isKnown, isFresh } = useRecentAuthentication()

/**
 * Whether the page has to ask for a fresh sign-in.
 *
 * Said once, above every control it affects: adding a second factor, adding a passkey and removing
 * one all need it, and repeating the same sentence inside each card would read as three problems.
 */
const needsFreshSession = computed(() => isKnown.value && !isFresh.value)

/** Drops this session so the next sign-in is recent enough for the server to accept the changes. */
function signInAgain(): void {
  authStore.signOutLocally()
  void router.replace({ name: RouteNames.LOGIN, query: { redirect: '/settings/security' } })
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1120px] flex-col gap-6 p-6 lg:p-8">
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold text-foreground dark:text-foreground">{{ t('settings.security.title') }}</h1>
      <p class="text-sm text-muted-foreground dark:text-muted-foreground">
        {{ t('settings.security.subtitle') }}
      </p>
    </div>

    <div
      v-if="needsFreshSession"
      class="flex flex-col gap-2.5 rounded-lg border border-border bg-muted px-4 py-3 dark:border-white/8 dark:bg-card sm:flex-row sm:items-center sm:gap-3"
      data-testid="security-needs-reauth"
      role="alert"
    >
      <div class="flex min-w-0 items-start gap-2 sm:flex-1">
        <Info class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p class="text-sm text-muted-foreground">{{ t('settings.security.sessionTooOld') }}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="self-start sm:self-auto"
        data-testid="security-sign-in-again"
        @click="signInAgain"
      >
        {{ t('settings.security.signInAgain') }}
      </Button>
    </div>

    <TwoFactorCard />
    <PasskeyCard />
    <LoginSessionsCard />
    <DataExportCard />
  </div>
</template>
