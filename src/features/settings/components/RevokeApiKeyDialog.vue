<script setup lang="ts">
/**
 * Revoke API Key confirmation dialog.
 *
 * Shows a destructive AlertDialog asking the user to confirm revoking an
 * active API key. On confirmation it calls `useRevokeApiKey().mutation.mutate(id)`.
 * The keys list query is auto-invalidated on success, so the parent only needs
 * to close the dialog. Errors surface as a toast and keep the dialog open.
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
import { useRevokeApiKey } from '@/composables/useApiKeys'
import { toast } from 'vue-sonner'

const props = defineProps<{
  /** Whether the dialog is open */
  open: boolean
  /** The API key row to revoke */
  apiKey: ApiKey
}>()

const emit = defineEmits<{
  /** Emitted when dialog open state changes */
  'update:open': [value: boolean]
}>()

const { mutation } = useRevokeApiKey()

/**
 * Revoke the API key and handle success/error side effects.
 *
 * Success: close the dialog and toast. The TanStack Query mutation already
 * invalidates the ['api-keys'] query, so the list refreshes automatically.
 *
 * Error: keep the dialog open and toast the mapped message. AUTH_010 maps
 * to a generic BOLA message per the project error map.
 */
function handleRevoke() {
  if (mutation.isPending.value) return

  mutation.mutate(props.apiKey.id, {
    onSuccess: () => {
      emit('update:open', false)
      toast.success('API Key revoked', {
        description: `${props.apiKey.name} can no longer be used to authenticate.`,
      })
    },
    onError: (error: unknown) => {
      // Surface the generic AUTH_010 message without distinguishing
      // not-found from no-permission (BOLA-safe behaviour).
      toast.error('Failed to revoke API key', {
        description: getErrorMessage(error),
      })
    },
  })
}

function handleOpenChange(value: boolean) {
  // Prevent closing while the revoke request is in flight.
  if (mutation.isPending.value && !value) return
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
      <AlertDialogHeader>
        <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
        <AlertDialogDescription>
          After revocation, devices using this key can no longer sync data. This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <!-- Key identity -->
      <div class="rounded-md border bg-muted/50 p-3">
        <p class="text-sm font-medium">{{ apiKey.name }}</p>
        <code class="text-xs font-mono text-muted-foreground">
          {{ apiKey.keyPrefix }}
        </code>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="mutation.isPending.value"> Cancel </AlertDialogCancel>
        <Button type="button" variant="destructive" :disabled="mutation.isPending.value" @click="handleRevoke">
          <Loader2 v-if="mutation.isPending.value" class="mr-2 h-4 w-4 animate-spin" />
          {{ mutation.isPending.value ? 'Revoking...' : 'Revoke' }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
