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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const authStore = useAuthStore()
const { data: emailStatus, isPending: isEmailStatusPending } = useEmailStatus()
const { isDialogOpen } = useEmailChange()
const { resend, countdown, isPending: isResendPending } = useResendVerification()

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

const sectionLabelClass = 'text-sm font-medium text-gray-500 dark:text-[#8a8f98]'
const sectionValueClass = 'text-sm text-gray-900 dark:text-[#f7f8f8]'

function handleOpenChangeDialog() {
  isDialogOpen.value = true
}

function handleResendVerification() {
  if (email.value) {
    void resend(email.value)
  }
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/2 p-6">
    <h2 class="text-lg font-medium text-gray-900 dark:text-[#f7f8f8] mb-4">Account</h2>

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
              class="bg-green-600 text-white dark:bg-green-700"
            >
              Verified
            </Badge>
            <Badge
              v-else-if="!isEmailStatusPending && !emailVerified"
              variant="secondary"
              class="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            >
              Unverified
            </Badge>
          </div>
        </div>
      </div>

      <!-- Pending email change -->
      <div
        v-if="emailChangePending && pendingNewEmail"
        class="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20"
        data-testid="email-change-pending"
      >
        <p class="text-sm text-amber-800 dark:text-amber-300">
          Email change pending:
          <span class="font-medium">{{ pendingNewEmail }}</span>
        </p>
        <p class="mt-1 text-xs text-amber-600 dark:text-amber-400">
          Check your new email inbox for the confirmation link.
        </p>
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
        <Button
          variant="outline"
          :class="
            cn(
              'h-9 rounded-md font-[510] text-sm',
              'border-[#d0d6e0] bg-white text-[#1a1a2e]',
              'dark:border-white/8 dark:bg-white/2 dark:text-[#f7f8f8]',
              'transition-all duration-200',
              'hover:bg-[#f3f4f5] hover:border-[#5e6ad2]/50',
              'dark:hover:bg-white/5 dark:hover:border-[#7170ff]/50',
            )
          "
          @click="handleOpenChangeDialog"
        >
          Change Email
        </Button>

        <Button
          v-if="!emailVerified"
          variant="outline"
          :class="
            cn(
              'h-9 rounded-md font-[510] text-sm',
              'border-[#d0d6e0] bg-white text-[#1a1a2e]',
              'dark:border-white/8 dark:bg-white/2 dark:text-[#f7f8f8]',
              'transition-all duration-200',
              'hover:bg-[#f3f4f5] hover:border-[#5e6ad2]/50',
              'dark:hover:bg-white/5 dark:hover:border-[#7170ff]/50',
            )
          "
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
</template>
