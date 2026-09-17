<script setup lang="ts">
/**
 * DangerZone - the irreversible actions on the profile page, kept in one block at the very bottom.
 *
 * ## Why this is its own component
 *
 * It has to be the *last* block on the page, but the blocks above it belong to other components:
 * `AccountSection` renders the account card, `ProfileView` renders connected accounts below that.
 * A block that has to sit after a sibling's content cannot live inside one of the siblings, so the
 * ordering decision belongs to the view and the block itself is extracted to be placed by it.
 *
 * ## Why the button is disabled while the email is unknown
 *
 * A passwordless account has no secret to prove itself with, so the typed email is the only thing
 * standing between a stray click and an irreversible request. Fall back to an empty string and an
 * empty field would satisfy the comparison; refusing to open the dialog until the address is known
 * is the only version of this guard that cannot be satisfied by accident.
 */
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useEmailStatus } from '@/features/settings/composables/useEmailStatus'
import { Button } from '@/components/ui/button'
import DeleteAccountDialog from './DeleteAccountDialog.vue'

const authStore = useAuthStore()
const { data: emailStatus } = useEmailStatus()

/** The address the reader must type back; null until the profile or status query has answered. */
const email = computed<string | null>(() => emailStatus.value?.email ?? authStore.email)

/**
 * Whether the profile has answered at all.
 *
 * `hasPassword` is not a boolean the store always knows: it defaults to false and only
 * `fetchUserProfile()` sets it, and that call swallows its own failure. So a single failed
 * `GET /users/me` leaves it false for an account that does have a password — the dialog would then
 * ask for an email it has no business asking for, submit `{}`, and be refused by the server with
 * `USER_013` on a form that offers no password field at all. The email is the tell: it is set by
 * the same call, so while it is unknown the flag is unknown too. Refusing to open fails closed,
 * which is the same rule the button already applies to the address itself.
 */
const isPasswordStateKnown = computed(() => authStore.email !== null)

const isDeleteDialogOpen = ref(false)
</script>

<template>
  <!--
    Last and visually set apart: it is the only irreversible thing on this page, and a reader
    scanning for a routine setting should not meet it halfway up. Destructive tokens rather than a
    new colour (DESIGN.md), so it reads as the same kind of warning as every other one.
  -->
  <div class="rounded-lg border border-destructive/30 bg-destructive/5 p-6" data-testid="danger-zone">
    <h2 class="mb-4 text-lg font-medium text-destructive">Danger zone</h2>
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <span class="text-sm text-gray-900 dark:text-[#f7f8f8]">Delete account</span>
        <span class="max-w-prose text-sm text-muted-foreground">
          Permanently delete your account and everything the server stores for it: sessions, statistics, achievements,
          devices and API keys. This cannot be undone.
        </span>
      </div>
      <Button
        variant="destructive"
        :disabled="!email || !isPasswordStateKnown"
        data-testid="delete-account-button"
        @click="isDeleteDialogOpen = true"
      >
        Delete account
      </Button>
      <!-- A disabled button with no reason is its own defect: the reader cannot tell whether the
           page is broken or the action is withheld. Say which details are missing. -->
      <p
        v-if="!email || !isPasswordStateKnown"
        class="w-full text-sm text-muted-foreground"
        data-testid="delete-account-unavailable"
      >
        Deletion is unavailable until your account details finish loading. Reload the page if this persists.
      </p>
    </div>
  </div>

  <DeleteAccountDialog
    :open="isDeleteDialogOpen"
    :email="email ?? ''"
    :has-password="authStore.hasPassword"
    @update:open="isDeleteDialogOpen = $event"
  />
</template>
