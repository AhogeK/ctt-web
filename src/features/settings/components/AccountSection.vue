<script setup lang="ts">
/**
 * Account section component for ProfileView.
 *
 * Displays user email (with verification badge), display name,
 * registration time, and email change management actions.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useEmailStatus } from '@/features/settings/composables/useEmailStatus'
import { useEmailChange } from '@/features/settings/composables/useEmailChange'
import { useResendVerification } from '@/features/auth/composables/useResendVerification'
import { useSetPassword } from '@/features/settings/composables/useSetPassword'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatDateTime } from '@/lib/utils'
import SetPasswordDialog from './SetPasswordDialog.vue'

const authStore = useAuthStore()
const { t } = useI18n()
const { data: emailStatus, isPending: isEmailStatusPending } = useEmailStatus()
const { isDialogOpen } = useEmailChange()
const { resend, countdown, isPending: isResendPending } = useResendVerification()

/** Shared dialog state from useSetPassword composable */
const { isDialogOpen: isSetPasswordDialogOpen } = useSetPassword()

/** Label for the password button based on detection state */
const passwordButtonLabel = computed(() => {
  return authStore.hasPassword ? t('settings.account.changePassword') : t('settings.account.setPassword')
})

/** Shared action button styling for outline buttons in the account section */
const actionButtonClass = cn(
  'h-9 rounded-md font-emphasis text-sm',
  'border-border bg-white text-foreground',
  'dark:border-white/8 dark:bg-white/2 dark:text-foreground',
  'transition-[background-color,border-color] duration-200',
  'hover:border-primary/50',
  'dark:hover:bg-white/5 dark:hover:border-accent/50',
)

const email = computed(() => emailStatus.value?.email ?? authStore.email)
const emailVerified = computed(() => emailStatus.value?.emailVerified ?? authStore.emailVerified)
const emailChangePending = computed(() => emailStatus.value?.emailChangePending ?? false)
const pendingNewEmail = computed(() => emailStatus.value?.pendingNewEmail ?? null)
const displayName = computed(() => authStore.displayName ?? '—')

const formattedRegistrationTime = computed(() => (authStore.createdAt ? formatDateTime(authStore.createdAt) : '—'))

const sectionLabelClass = 'text-sm font-medium text-muted-foreground dark:text-muted-foreground'
const sectionValueClass = 'text-sm text-foreground dark:text-foreground'

function handleOpenChangeDialog() {
  isDialogOpen.value = true
}

function handleResendVerification() {
  if (email.value) {
    void resend(email.value)
  }
}

function handleOpenSetPasswordDialog() {
  isSetPasswordDialogOpen.value = true
}

/**
 * Refreshes the user profile so `hasPassword` reflects the newly-set password,
 * which flips the password button label from "Set Password" to "Change Password".
 */
function handleSetPasswordSuccess() {
  void authStore.fetchUserProfile()
}
</script>

<template>
  <div data-surface="card" class="rounded-lg border border-border dark:border-white/8 bg-muted dark:bg-card p-6">
    <h2 class="text-lg font-medium text-foreground dark:text-foreground mb-4">{{ t('settings.account.title') }}</h2>

    <div class="flex flex-col gap-4">
      <!-- Email -->
      <div class="flex items-center justify-between">
        <div class="flex flex-col gap-1">
          <span :class="sectionLabelClass">{{ t('settings.account.email') }}</span>
          <div class="flex items-center gap-2">
            <span v-if="isEmailStatusPending" :class="cn(sectionValueClass, 'animate-pulse')">
              {{ t('settings.account.loading') }}
            </span>
            <span v-else :class="sectionValueClass">{{ email }}</span>
            <Badge
              v-if="!isEmailStatusPending && emailVerified"
              variant="default"
              class="bg-success text-white dark:bg-success"
            >
              {{ t('settings.account.verified') }}
            </Badge>
            <Badge
              v-else-if="!isEmailStatusPending && !emailVerified"
              variant="secondary"
              class="bg-warning-surface text-warning dark:bg-warning-surface dark:text-warning"
            >
              {{ t('settings.account.unverified') }}
            </Badge>
          </div>
        </div>
      </div>

      <!-- Pending email change -->
      <div
        v-if="emailChangePending && pendingNewEmail"
        class="rounded-md border border-warning-border bg-warning-surface p-3 dark:border-warning-border dark:bg-warning-surface"
        data-testid="email-change-pending"
      >
        <p class="text-sm text-warning dark:text-warning">
          {{ t('settings.account.emailChangePending') }}
          <span class="font-medium">{{ pendingNewEmail }}</span>
        </p>
        <p class="mt-1 text-xs text-warning dark:text-warning">{{ t('settings.account.checkInbox') }}</p>
      </div>

      <!-- Display name -->
      <div class="flex flex-col gap-1">
        <span :class="sectionLabelClass">{{ t('settings.account.displayName') }}</span>
        <span :class="sectionValueClass">{{ displayName }}</span>
      </div>

      <!-- Registration time -->
      <div class="flex flex-col gap-1">
        <span :class="sectionLabelClass">{{ t('settings.account.registered') }}</span>
        <span :class="sectionValueClass">{{ formattedRegistrationTime }}</span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 pt-2">
        <Button variant="outline" :class="actionButtonClass" @click="handleOpenChangeDialog">
          {{ t('settings.account.changeEmail') }}
        </Button>

        <Button
          variant="outline"
          :class="actionButtonClass"
          data-testid="set-password-button"
          @click="handleOpenSetPasswordDialog"
        >
          {{ passwordButtonLabel }}
        </Button>

        <Button
          v-if="!emailVerified"
          variant="outline"
          :class="actionButtonClass"
          :disabled="isResendPending || countdown > 0"
          data-testid="verify-email-button"
          @click="handleResendVerification"
        >
          <template v-if="isResendPending">{{ t('settings.account.sending') }}</template>
          <template v-else-if="countdown > 0">{{ t('settings.account.resendIn', { seconds: countdown }) }}</template>
          <template v-else>{{ t('settings.account.verifyEmail') }}</template>
        </Button>
      </div>
    </div>
  </div>

  <SetPasswordDialog
    :open="isSetPasswordDialogOpen"
    :has-password="authStore.hasPassword"
    @update:open="isSetPasswordDialogOpen = $event"
    @success="handleSetPasswordSuccess"
  />
</template>
