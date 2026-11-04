<script setup lang="ts">
/**
 * The account's passkeys, and the ways to add, rename and remove them.
 *
 * A passkey is a way *in*, so the card follows the same rules the second factor does: adding and
 * removing need a recent sign-in, a refused removal says why, and anything the server refuses is
 * shown where the reader acted instead of as a passing toast.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { KeyRound, Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn, formatDate } from '@/lib/utils'
import { extractErrorCode, isApiError, mapApiErrorCode } from '@/lib/utils/api-error'
import { isPasskeySupported } from '@/lib/utils/webauthn'
import {
  PasskeyCeremonyCancelled,
  useDeletePasskey,
  usePasskeys,
  useRegisterPasskey,
  useRenamePasskey,
} from '../composables/usePasskeys'
import { useRecentAuthentication, useRefreshRecentAuthentication } from '../composables/useRecentAuthentication'
import { SETTINGS_ACTION_BUTTON_CLASS } from './action-button'
import PasskeyNameDialog from './PasskeyNameDialog.vue'
import type { Passkey } from '@/lib/schemas/passkey.schema'
import { markFailureReported } from '@/lib/utils/operation-failure'

const { t } = useI18n()

const supported = isPasskeySupported()
const { data: passkeys, isPending, isError, refetch } = usePasskeys()
const registerMutation = useRegisterPasskey()
const renameMutation = useRenamePasskey()
const deleteMutation = useDeletePasskey()
const { isKnown, isFresh } = useRecentAuthentication()
const refreshFreshness = useRefreshRecentAuthentication()

const nameDialogOpen = ref(false)
/** Why the last add/rename failed, shown inside the dialog that is still open. */
const dialogError = ref('')
const nameDialogMode = ref<'add' | 'rename'>('add')
const editing = ref<Passkey | null>(null)
const removeTarget = ref<Passkey | null>(null)

/** The server's reason for the last add/remove attempt, mapped to a sentence where it needs one. */
const blockedCode = ref<string | null>(null)

const lastPathRefused = computed(() => blockedCode.value === 'AUTH_018')

/**
 * Turns a failed add or rename into what the reader should see.
 *
 * Only the newest failure matters: each attempt replaces the previous reason.
 *
 * Three outcomes, because they are three different situations: a cancelled prompt needs nothing, an
 * expired session cannot be fixed from here (so the dialog closes and the card offers a fresh
 * sign-in), and everything else keeps the dialog open with the reason beside the field.
 *
 * @param error - the rejection from the mutation
 */
function reportDialogFailure(error: unknown): void {
  markFailureReported(error)
  rememberFailure(error)
  if (blockedCode.value === null) {
    dialogError.value = ''
    return
  }
  if (blockedCode.value === 'AUTH_031') {
    // The page's freshness notice is the answer here; the dialog must not pretend it can retry.
    nameDialogOpen.value = false
    dialogError.value = ''
    return
  }
  dialogError.value = failureMessage.value
}

function rememberFailure(error: unknown): void {
  // Closing the system prompt is the reader changing their mind, not a failure to report.
  if (error instanceof PasskeyCeremonyCancelled) {
    blockedCode.value = null
    return
  }
  blockedCode.value = extractErrorCode(error) ?? (isApiError(error) ? String(error.statusCode) : 'unknown')
  // A refusal is proof that the cached answer is out of date; the notice it relies on has to appear
  // now rather than after the next poll.
  if (blockedCode.value === 'AUTH_031') void refreshFreshness()
}

function openAdd(): void {
  blockedCode.value = null
  dialogError.value = ''
  nameDialogMode.value = 'add'
  editing.value = null
  nameDialogOpen.value = true
}

function openRename(passkey: Passkey): void {
  blockedCode.value = null
  dialogError.value = ''
  nameDialogMode.value = 'rename'
  editing.value = passkey
  nameDialogOpen.value = true
}

function submitName(name: string): void {
  const done = () => {
    nameDialogOpen.value = false
  }
  if (nameDialogMode.value === 'add') {
    registerMutation.mutate(name, { onSuccess: done, onError: reportDialogFailure })
    return
  }
  if (!editing.value) return
  renameMutation.mutate({ id: editing.value.id, name }, { onSuccess: done, onError: reportDialogFailure })
}

function confirmRemove(): void {
  if (!removeTarget.value) return
  deleteMutation.mutate(removeTarget.value.id, {
    onSuccess: () => {
      removeTarget.value = null
    },
    onError: (error) => {
      rememberFailure(error)
      removeTarget.value = null
    },
  })
}

const isBusy = computed(
  () => registerMutation.isPending.value || renameMutation.isPending.value || deleteMutation.isPending.value,
)

/** The sentence for a failure the two named cases above do not cover. */
const failureMessage = computed(() => {
  const code = blockedCode.value
  if (!code) return ''
  const mapped = mapApiErrorCode(code)
  // A code the catalogue has no sentence for is answered with the generic one; this card has a
  // sentence about the action it sits on, which is the more useful of the two.
  return mapped === t('api.errors.internalerror') ? t('settings.passkey.actionFailed') : mapped
})

/**
 * Where the credential lives, for the reader to recognise it by.
 *
 * Three states, not two: an authenticator can be able to sync without having synced anywhere yet,
 * and calling that "this device" would be wrong the moment it lands in a keychain.
 */
function transportLabel(passkey: Passkey): string {
  if (!passkey.backupEligible) return t('settings.passkey.deviceBound')
  return passkey.backupState ? t('settings.passkey.synced') : t('settings.passkey.syncable')
}
</script>

<template>
  <section
    v-if="supported"
    data-surface="card"
    class="flex flex-col gap-5 rounded-lg border border-border bg-muted p-6 dark:border-white/8 dark:bg-card"
    aria-labelledby="passkey-heading"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div class="flex min-w-0 items-start gap-3">
        <div
          :class="
            cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              'bg-security/12 text-security dark:bg-security/15',
            )
          "
        >
          <KeyRound class="h-5 w-5" aria-hidden="true" />
        </div>
        <div class="flex min-w-0 flex-col gap-1.5">
          <h2 id="passkey-heading" class="text-sm font-emphasis text-foreground">
            {{ t('settings.passkey.title') }}
          </h2>
          <p class="max-w-prose text-sm text-muted-foreground">{{ t('settings.passkey.subtitle') }}</p>
        </div>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          :class="SETTINGS_ACTION_BUTTON_CLASS"
          :disabled="isBusy || (isKnown && !isFresh)"
          data-testid="passkey-add"
          @click="openAdd"
        >
          <Plus class="mr-1.5 h-4 w-4" aria-hidden="true" />
          {{ t('settings.passkey.add') }}
        </Button>
      </div>
    </div>

    <div v-if="isPending" class="h-16 w-full animate-pulse rounded-md bg-secondary" data-testid="passkey-loading" />

    <div
      v-else-if="isError"
      class="flex flex-col gap-2.5 rounded-md border border-border bg-background/60 px-3 py-2.5 dark:border-white/8 dark:bg-white/3 sm:flex-row sm:items-center sm:gap-3"
    >
      <p class="text-xs text-muted-foreground">{{ t('settings.passkey.error') }}</p>
      <Button type="button" variant="outline" size="sm" class="self-start sm:self-auto" @click="refetch()">
        {{ t('settings.passkey.retry') }}
      </Button>
    </div>

    <p v-else-if="lastPathRefused" class="text-xs text-destructive" role="alert" data-testid="passkey-last-path">
      {{ t('settings.passkey.removeLastPath') }}
    </p>

    <p v-else-if="blockedCode" class="text-xs text-destructive" role="alert" data-testid="passkey-failure">
      {{ failureMessage }}
    </p>

    <p
      v-if="!isPending && !isError && !blockedCode && (passkeys?.length ?? 0) === 0"
      class="text-sm text-muted-foreground"
    >
      {{ t('settings.passkey.empty') }}
    </p>

    <ul
      v-if="!isPending && !isError && (passkeys?.length ?? 0) > 0"
      class="flex flex-col divide-y divide-border dark:divide-white/8"
    >
      <li
        v-for="passkey in passkeys"
        :key="passkey.id"
        class="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        data-testid="passkey-row"
      >
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="truncate text-sm font-emphasis text-foreground">{{ passkey.name }}</span>
          <span class="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span>{{ t('settings.passkey.addedOn', { date: formatDate(passkey.createdAt) }) }}</span>
            <span aria-hidden="true">·</span>
            <span>
              {{
                passkey.lastUsedAt
                  ? t('settings.passkey.lastUsedOn', { date: formatDate(passkey.lastUsedAt) })
                  : t('settings.passkey.neverUsed')
              }}
            </span>
            <span aria-hidden="true">·</span>
            <span>{{ transportLabel(passkey) }}</span>
          </span>
        </div>
        <div class="flex shrink-0 items-center gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            :class="SETTINGS_ACTION_BUTTON_CLASS"
            :disabled="isBusy"
            data-testid="passkey-rename"
            @click="openRename(passkey)"
          >
            {{ t('settings.passkey.rename') }}
          </Button>
          <Button
            type="button"
            variant="outline"
            :class="SETTINGS_ACTION_BUTTON_CLASS"
            :disabled="isBusy || (isKnown && !isFresh)"
            data-testid="passkey-remove"
            @click="removeTarget = passkey"
          >
            {{ t('settings.passkey.remove') }}
          </Button>
        </div>
      </li>
    </ul>

    <PasskeyNameDialog
      v-model:open="nameDialogOpen"
      :mode="nameDialogMode"
      :initial-name="editing?.name"
      :pending="isBusy"
      :error-message="dialogError"
      @submit="submitName"
    />

    <Dialog :open="removeTarget !== null" @update:open="(value) => !value && (removeTarget = null)">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('settings.passkey.removeTitle') }}</DialogTitle>
          <DialogDescription>
            {{ t('settings.passkey.removeDescription', { name: removeTarget?.name ?? '' }) }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            :disabled="deleteMutation.isPending.value"
            @click="removeTarget = null"
          >
            {{ t('settings.passkey.cancel') }}
          </Button>
          <Button
            type="button"
            :disabled="deleteMutation.isPending.value"
            data-testid="passkey-remove-confirm"
            @click="confirmRemove"
          >
            {{ t('settings.passkey.remove') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
