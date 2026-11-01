<script setup lang="ts">
/**
 * The one and only look at a batch of recovery codes.
 *
 * The server stores hashes and hands the plaintext over exactly once, so this panel makes the
 * reader prove they took a copy before the dialog can close: every code here is a way back in
 * after a lost phone, and a batch nobody saved is a batch that will be regenerated in a panic.
 */
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useCopyToClipboard } from '@/composables/useCopyToClipboard'

const props = defineProps<{
  /** The ten single-use codes exactly as the server issued them. */
  codes: string[]
}>()

/** Whether the reader says they stored the batch; the dialog keeps the finish button locked until then. */
const acknowledged = defineModel<boolean>('acknowledged', { default: false })

const emit = defineEmits<{ confirmed: [] }>()

const { t } = useI18n()
const { copied, copy } = useCopyToClipboard()

/** Copies the batch as one block: pasting ten codes one by one is how one of them gets lost. */
async function copyAll(): Promise<void> {
  const succeeded = await copy(props.codes.join('\n'))
  if (!succeeded) toast.error(t('settings.twoFactor.codes.copyFailed'))
}

/** Hands the batch over as a text file, named after the product so it is findable later. */
function download(): void {
  const blob = new Blob([`${props.codes.join('\n')}\n`], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = t('settings.twoFactor.codes.fileName')
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoking before the browser has read the blob cancels the download in some engines.
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <h3 class="text-sm font-emphasis text-foreground">{{ t('settings.twoFactor.codes.title') }}</h3>
      <p class="text-sm text-muted-foreground">{{ t('settings.twoFactor.codes.description') }}</p>
    </div>

    <ul :class="cn('grid gap-1.5 rounded-md border border-border bg-secondary/40 p-3', 'grid-cols-1 sm:grid-cols-2')">
      <li
        v-for="code in codes"
        :key="code"
        data-testid="recovery-code"
        class="font-mono text-sm tracking-wide text-foreground"
      >
        {{ code }}
      </li>
    </ul>

    <div class="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" data-testid="recovery-copy" @click="copyAll">
        {{ copied ? t('settings.twoFactor.codes.copied') : t('settings.twoFactor.codes.copy') }}
      </Button>
      <Button type="button" variant="outline" data-testid="recovery-download" @click="download">
        {{ t('settings.twoFactor.codes.download') }}
      </Button>
    </div>

    <div class="flex items-start gap-2">
      <Checkbox
        id="two-factor-codes-acknowledged"
        v-model="acknowledged"
        data-testid="recovery-acknowledge"
        class="mt-0.5"
      />
      <Label for="two-factor-codes-acknowledged" class="text-sm font-normal text-foreground/80">
        {{ t('settings.twoFactor.codes.acknowledge') }}
      </Label>
    </div>

    <div class="flex justify-end">
      <Button type="button" data-testid="recovery-done" :disabled="!acknowledged" @click="emit('confirmed')">
        {{ t('settings.twoFactor.codes.done') }}
      </Button>
    </div>
  </div>
</template>
