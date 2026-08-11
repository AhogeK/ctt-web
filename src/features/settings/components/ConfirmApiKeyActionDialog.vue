<script setup lang="ts">
/**
 * ConfirmApiKeyActionDialog — shared destructive confirmation dialog for
 * API key actions (revoke, permanent delete).
 *
 * Both actions share identical interaction semantics: confirm → mutate(id),
 * success closes + toasts, error keeps the dialog open. Only the copy and
 * the mutation differ, so this single component parameterises them instead
 * of duplicating the ~70 LOC dialog shell per action.
 *
 * Safety: the caller is responsible for showing this dialog only when the
 * action is valid for the key's state (e.g. Delete only for REVOKED); the
 * server independently enforces the state constraint as a second line of
 * defence (e.g. 409 AUTH_023).
 */
import { Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ApiKey } from '@/lib/schemas/api-key.schema'
import { getErrorMessage } from '@/lib/utils/api-error'
import { toast } from 'vue-sonner'

/** Shape of the mutation the caller passes in (TanStack Query mutation). */
interface ActionMutation {
  mutate: (id: string, options: { onSuccess?: () => void; onError?: (error: unknown) => void }) => void
  isPending: { value: boolean }
}

const props = defineProps<{
  /** Whether the dialog is open */
  open: boolean
  /** The API key row the action applies to */
  apiKey: ApiKey
  /** Mutation performing the action (revoke / delete) */
  mutation: ActionMutation
  /** Dialog title, e.g. "Revoke API Key" */
  title: string
  /** Dialog description explaining the consequences */
  description: string
  /** Confirm button label, e.g. "Revoke" */
  confirmLabel: string
  /** Confirm button label while pending, e.g. "Revoking..." */
  pendingLabel: string
  /** Success toast title, e.g. "API Key revoked" */
  successTitle: string
  /** Success toast description; receives the key name */
  successDescription: (keyName: string) => string
  /** Error toast title, e.g. "Failed to revoke API key" */
  errorTitle: string
}>()

const emit = defineEmits<{
  /** Emitted when dialog open state changes */
  'update:open': [value: boolean]
}>()

/**
 * Run the action and handle success/error side effects.
 *
 * Success: close the dialog and toast. The mutation's onSuccess already
 * invalidates the ['api-keys'] query, so the list refreshes automatically.
 *
 * Error: keep the dialog open and toast the mapped message (e.g. the
 * generic AUTH_010 BOLA message).
 */
function handleConfirm() {
  if (props.mutation.isPending.value) return

  props.mutation.mutate(props.apiKey.id, {
    onSuccess: () => {
      emit('update:open', false)
      toast.success(props.successTitle, {
        description: props.successDescription(props.apiKey.name),
      })
    },
    onError: (error: unknown) => {
      toast.error(props.errorTitle, {
        description: getErrorMessage(error),
      })
    },
  })
}

function handleOpenChange(value: boolean) {
  // Prevent closing while the action request is in flight.
  if (props.mutation.isPending.value && !value) return
  emit('update:open', value)
}

/**
 * Suppresses FocusScope's default first-tabbable-element autofocus so the
 * AlertDialogContent built-in handler (which focuses the registered
 * AlertDialogCancel element via nextTick) is the sole focus authority.
 * Both handlers fire on the `openAutoFocus` event (merged by reka-ui);
 * calling preventDefault here stops the default first-tabbable behaviour
 * while the cancel-specific focus still runs - giving explicit,
 * misclick-safe focus on Cancel.
 */
function handleOpenAutoFocus(event: Event) {
  event.preventDefault()
}
</script>

<template>
  <AlertDialog :open="props.open" @update:open="handleOpenChange">
    <AlertDialogContent class="sm:max-w-md" @open-auto-focus="handleOpenAutoFocus">
      <AlertDialogHeader class="text-left">
        <AlertDialogTitle>{{ props.title }}</AlertDialogTitle>
        <!-- Single-line interpolation: whitespace around multi-line {{ }} would be
             condensed into a leading space, offsetting the first line of the
             description from its wrapped lines. text-left keeps the description
             aligned on mobile, where the default header centers it. -->
        <AlertDialogDescription>{{ props.description }}</AlertDialogDescription>
      </AlertDialogHeader>

      <!-- Key identity -->
      <div class="rounded-md border bg-muted/50 p-3">
        <p class="text-sm font-medium">{{ apiKey.name }}</p>
        <code class="text-xs font-mono text-muted-foreground">
          {{ apiKey.keyPrefix }}
        </code>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="props.mutation.isPending.value"> Cancel </AlertDialogCancel>
        <Button type="button" variant="destructive" :disabled="props.mutation.isPending.value" @click="handleConfirm">
          <Loader2 v-if="props.mutation.isPending.value" class="mr-2 h-4 w-4 animate-spin" />
          {{ props.mutation.isPending.value ? props.pendingLabel : props.confirmLabel }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
