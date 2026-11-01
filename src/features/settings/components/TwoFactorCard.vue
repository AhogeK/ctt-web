<script setup lang="ts">
/**
 * The account's second factor, as a switch rather than a manual.
 *
 * Three facts decide what the card can offer: whether a factor is on, whether the account has a
 * password to prove for the setup, and whether an OAuth-only session is recent enough to stand in
 * for one. A button that would be refused by the server is disabled here with the reason, so the
 * reader does not discover the rule by failing at it.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Info, KeyRound, ShieldCheck } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import { RouteNames } from '@/router/route-names'
import { useAuthStore } from '@/stores/auth'
import { useTwoFactorStatus } from '../composables/useTwoFactor'
import { SETTINGS_ACTION_BUTTON_CLASS } from './action-button'
import TwoFactorConfirmDialog from './TwoFactorConfirmDialog.vue'
import TwoFactorSetupDialog from './TwoFactorSetupDialog.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const { data: status, isPending, isError, refetch } = useTwoFactorStatus()

const setupOpen = ref(false)
const confirmOpen = ref(false)
const confirmMode = ref<'disable' | 'regenerate' | 'reset'>('disable')

/** Whether the server would accept a setup, a re-setup or a disable from this session. */
const canSetUp = computed(() => {
  if (!status.value) return false
  return status.value.hasPassword || status.value.recentAuthentication
})

/** The server would refuse a setup from this session: the card says why and offers the way out. */
const blocked = computed(() => Boolean(status.value && !canSetUp.value))

/**
 * Drops this session so the next sign-in is recent enough for the server to accept a setup.
 *
 * Only the local session is cleared: revoking every session from a settings card would be a
 * bigger action than the one the reader asked for.
 */
function signInAgain(): void {
  authStore.signOutLocally()
  void router.replace({ name: RouteNames.LOGIN, query: { redirect: '/settings/security' } })
}

function openSetup(): void {
  setupOpen.value = true
}

function openConfirm(mode: 'disable' | 'regenerate' | 'reset'): void {
  confirmMode.value = mode
  confirmOpen.value = true
}
</script>

<template>
  <section
    data-surface="card"
    class="flex flex-col gap-5 rounded-lg border border-border bg-muted p-6 dark:border-white/8 dark:bg-card"
    aria-labelledby="two-factor-heading"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <!-- What the control is. The state sits with the name it describes, so the left block carries
           the answer and the right side holds only the control that changes it. -->
      <div class="flex min-w-0 items-start gap-3">
        <div
          :class="
            cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              'bg-security/12 text-security dark:bg-security/15',
            )
          "
        >
          <ShieldCheck class="h-5 w-5" aria-hidden="true" />
        </div>
        <div class="flex min-w-0 flex-col gap-1.5">
          <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h2 id="two-factor-heading" class="text-sm font-emphasis text-foreground">
              {{ t('settings.twoFactor.title') }}
            </h2>
            <!-- A state, not a tag: a filled dot means the factor is live, a hollow one means it is
                 not. The dot carries the colour so the word can stay in body ink. -->
            <span
              v-if="status"
              data-testid="two-factor-state"
              :class="
                cn(
                  'flex items-center gap-1.5 text-xs font-emphasis',
                  status.enabled ? 'text-foreground' : 'text-muted-foreground',
                )
              "
            >
              <span
                aria-hidden="true"
                :class="
                  cn(
                    'h-1.5 w-1.5 rounded-full transition-colors duration-200',
                    status.enabled ? 'bg-success' : 'border border-foreground/25 bg-transparent dark:border-white/25',
                  )
                "
              />
              {{ status.enabled ? t('settings.twoFactor.on') : t('settings.twoFactor.off') }}
            </span>
          </div>
          <p class="max-w-prose text-sm text-muted-foreground">
            {{ t('settings.twoFactor.subtitle') }}
          </p>
          <p v-if="status?.enabled" class="text-xs text-muted-foreground" data-testid="two-factor-meta">
            <template v-if="status.confirmedAt">
              {{ t('settings.twoFactor.enabledSince', { date: formatDate(status.confirmedAt) }) }}
              ·
            </template>
            {{ t('settings.twoFactor.recoveryRemaining', { count: status.recoveryCodesRemaining }) }}
          </p>
        </div>
      </div>

      <!-- The control that changes it -->
      <div v-if="status" class="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        <Button
          v-if="!status.enabled"
          type="button"
          data-testid="two-factor-enable"
          :disabled="!canSetUp"
          @click="openSetup"
        >
          {{ t('settings.twoFactor.enable') }}
        </Button>

        <template v-else>
          <Button
            type="button"
            variant="outline"
            :class="SETTINGS_ACTION_BUTTON_CLASS"
            data-testid="two-factor-regenerate"
            @click="openConfirm('regenerate')"
          >
            <KeyRound class="mr-1.5 h-4 w-4" aria-hidden="true" />
            {{ t('settings.twoFactor.regenerate') }}
          </Button>
          <Button
            type="button"
            variant="outline"
            :class="SETTINGS_ACTION_BUTTON_CLASS"
            :disabled="!canSetUp"
            data-testid="two-factor-reset"
            @click="openConfirm('reset')"
          >
            {{ t('settings.twoFactor.confirm.resetTitle') }}
          </Button>
          <Button
            type="button"
            variant="outline"
            :class="SETTINGS_ACTION_BUTTON_CLASS"
            data-testid="two-factor-disable"
            @click="openConfirm('disable')"
          >
            {{ t('settings.twoFactor.disable') }}
          </Button>
        </template>
      </div>
    </div>

    <!-- Whatever blocks the reader, said once, with its action attached instead of far away. -->
    <div v-if="isPending" class="h-9 w-full animate-pulse rounded-md bg-secondary" data-testid="two-factor-loading" />
    <!-- One row like every other row on the page: the sentence takes the room it needs, its action
         closes the line. The page is width-capped, so that edge is never far away. -->
    <div
      v-else-if="isError || blocked"
      class="flex flex-col gap-2.5 rounded-md border border-border bg-background/60 px-3 py-2.5 dark:border-white/8 dark:bg-white/3 sm:flex-row sm:items-center sm:gap-3"
    >
      <div class="flex min-w-0 items-start gap-2 sm:flex-1">
        <Info class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p class="text-xs text-muted-foreground">
          {{ isError ? t('settings.twoFactor.errors.generic') : t('settings.twoFactor.needsRecentSignIn') }}
        </p>
      </div>
      <Button
        v-if="isError"
        type="button"
        variant="outline"
        size="sm"
        class="self-start sm:self-auto"
        data-testid="two-factor-retry"
        @click="refetch"
      >
        {{ t('settings.twoFactor.retry') }}
      </Button>
      <Button
        v-else
        type="button"
        variant="outline"
        size="sm"
        class="self-start sm:self-auto"
        data-testid="two-factor-sign-in-again"
        @click="signInAgain"
      >
        {{ t('settings.twoFactor.signInAgain') }}
      </Button>
    </div>

    <TwoFactorSetupDialog v-model:open="setupOpen" :has-password="status?.hasPassword ?? true" />
    <!-- A finished reset hands straight over to the setup wizard: the factor is off at that point. -->
    <TwoFactorConfirmDialog v-model:open="confirmOpen" :mode="confirmMode" @reset="setupOpen = true" />
  </section>
</template>
