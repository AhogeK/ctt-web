<script setup lang="ts">
/**
 * Account section component for ProfileView.
 *
 * Displays user email (with verification badge), display name,
 * registration time, and email change management actions.
 */
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useEmailStatus } from '@/features/settings/composables/useEmailStatus'
import { useEmailChange } from '@/features/settings/composables/useEmailChange'
import { useResendVerification } from '@/features/auth/composables/useResendVerification'
import { useSetPassword } from '@/features/settings/composables/useSetPassword'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import SetPasswordDialog from './SetPasswordDialog.vue'

const authStore = useAuthStore()
const { data: emailStatus, isPending: isEmailStatusPending } = useEmailStatus()
const { isDialogOpen } = useEmailChange()
const { resend, countdown, isPending: isResendPending } = useResendVerification()

/** Shared dialog state from useSetPassword composable */
const { isDialogOpen: isSetPasswordDialogOpen } = useSetPassword()

/** Label for the password button based on detection state */
const passwordButtonLabel = computed(() => {
  return authStore.hasPassword ? 'Change Password' : 'Set Password'
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

/**
 * Formats an ISO 8601 datetime string into a human-readable locale string.
 * Returns '—' when the input is null or undefined.
 */
function formatRegistrationTime(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString()
}

const formattedRegistrationTime = computed(() => formatRegistrationTime(authStore.createdAt))

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
  <div class="rounded-lg border border-border dark:border-white/8 bg-muted dark:bg-white/2 p-6">
    <h2 class="text-lg font-medium text-foreground dark:text-foreground mb-4">Account</h2>

    <div class="flex flex-col gap-4">
      <!-- Email -->
      <div class="flex items-center justify-between">
        <div class="flex flex-col gap-1">
          <span :class="sectionLabelClass">Email</span>
          <div class="flex items-center gap-2">
            <span v-if="isEmailStatusPending" :class="cn(sectionValueClass, 'animate-pulse')"> Loading… </span>
            <span v-else :class="sectionValueClass">{{ email }}</span>
            <Badge
              v-if="!isEmailStatusPending && emailVerified"
              variant="default"
              class="bg-success text-white dark:bg-success"
            >
              Verified
            </Badge>
            <Badge
              v-else-if="!isEmailStatusPending && !emailVerified"
              variant="secondary"
              class="bg-warning-surface text-warning dark:bg-warning-surface dark:text-warning"
            >
              Unverified
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
          Email change pending:
          <span class="font-medium">{{ pendingNewEmail }}</span>
        </p>
        <p class="mt-1 text-xs text-warning dark:text-warning">Check your new email inbox for the confirmation link.</p>
      </div>

      <!-- Display name -->
      <div class="flex flex-col gap-1">
        <span :class="sectionLabelClass">Display Name</span>
        <span :class="sectionValueClass">{{ displayName }}</span>
      </div>

      <!-- Registration time -->
      <div class="flex flex-col gap-1">
        <span :class="sectionLabelClass">Registered</span>
        <span :class="sectionValueClass">{{ formattedRegistrationTime }}</span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 pt-2">
        <Button variant="outline" :class="actionButtonClass" @click="handleOpenChangeDialog"> Change Email </Button>

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
          <template v-if="isResendPending">Sending…</template>
          <template v-else-if="countdown > 0">Resend in {{ countdown }}s</template>
          <template v-else>Verify Email</template>
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
