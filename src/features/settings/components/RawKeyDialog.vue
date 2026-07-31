<script setup lang="ts">
/**
 * RawKeyDialog - one-time display of a freshly created API key.
 *
 * The raw key exists only in this dialog session: the server stores only its
 * SHA-256 hash and the create response is not persisted anywhere, so once this
 * dialog closes the key cannot be recovered. Deliberately hard to dismiss:
 *
 * - Overlay click does not close (pointer-down-outside is prevented)
 * - Escape does not close (escape-key-down is prevented)
 * - No visible close (X) button
 * - The "Copied, close" button stays disabled until the user has copied
 *
 * Copy uses a three-tier fallback: navigator.clipboard, then a hidden
 * textarea + execCommand, then a manual-copy hint returned by the composable.
 */
import { nextTick, ref, watch } from 'vue'
import { AlertTriangle, Check, Copy } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useCopyToClipboard } from '@/composables/useCopyToClipboard'

const props = defineProps<{
  /** Whether the dialog is open */
  open: boolean
  /** The raw key to display; only available right after creation */
  rawKey: string
}>()

const emit = defineEmits<{
  /** Emitted when the dialog is dismissed via the explicit close button */
  'update:open': [value: boolean]
}>()

const { copied, copy } = useCopyToClipboard()
/** True once a copy attempt succeeded; gates the close button (strong constraint) */
const hasCopied = ref(false)
const rawKeyDisplay = ref<HTMLInputElement | null>(null)

/**
 * Prevents dismissal via overlay click or Escape key.
 * These must be no-ops; the only exit is the close button.
 */
function blockDismiss(event: Event) {
  event.preventDefault()
}

/**
 * Copies the raw key and unlocks the close button.
 * Returns false (manual-copy path) without unlocking when both APIs fail.
 */
async function handleCopy() {
  const ok = await copy(props.rawKey)
  if (ok) {
    hasCopied.value = true
  }
}

/**
 * Selects the full key text on click/focus so the user can copy manually
 * if the clipboard APIs are unavailable.
 */
function selectAll() {
  rawKeyDisplay.value?.select()
}

function handleClose() {
  hasCopied.value = false
  emit('update:open', false)
}

// Focus the key display when the dialog opens.
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      hasCopied.value = false
      await nextTick()
      rawKeyDisplay.value?.select()
    }
  },
)
</script>

<template>
  <Dialog :open="props.open" @update:open="handleClose">
    <DialogContent
      role="alertdialog"
      aria-labelledby="raw-key-dialog-title"
      aria-describedby="raw-key-dialog-description"
      :show-close-button="false"
      class="sm:max-w-md"
      @escape-key-down="blockDismiss"
      @pointer-down-outside="blockDismiss"
      @interact-outside="blockDismiss"
    >
      <DialogHeader>
        <DialogTitle id="raw-key-dialog-title">API Key created</DialogTitle>
        <DialogDescription id="raw-key-dialog-description">
          Copy the key now. You will not be able to view it again.
        </DialogDescription>
      </DialogHeader>

      <!-- Warning banner -->
      <div class="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
        <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <p class="text-sm font-medium text-destructive">
          This key is shown only once. Closing this dialog means it cannot be viewed again.
        </p>
      </div>

      <!-- Raw key display -->
      <div class="rounded-md border border-amber-500/40 bg-amber-500/10 p-4">
        <input
          ref="rawKeyDisplay"
          type="text"
          :value="props.rawKey"
          readonly
          aria-label="API key"
          class="w-full cursor-text bg-transparent font-mono text-[16px] leading-relaxed text-foreground focus:outline-none"
          @focus="selectAll"
          @click="selectAll"
        />
      </div>

      <p class="text-xs text-muted-foreground">Paste the key into the Login section of the JetBrains plugin.</p>

      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" :disabled="copied" @click="handleCopy">
          <Check v-if="copied" class="mr-2 h-4 w-4" />
          <Copy v-else class="mr-2 h-4 w-4" />
          {{ copied ? 'Copied' : 'Copy key' }}
        </Button>
        <Button
          type="button"
          :disabled="!hasCopied"
          :class="
            cn(
              'bg-primary text-primary-foreground font-[510]',
              'shadow-lg shadow-primary/15 transition-all duration-200',
              'hover:bg-primary/90 hover:shadow-primary/20',
              'disabled:opacity-70 disabled:cursor-not-allowed',
            )
          "
          @click="handleClose"
        >
          {{ hasCopied ? 'Copied, close' : 'Copy the key to close' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
