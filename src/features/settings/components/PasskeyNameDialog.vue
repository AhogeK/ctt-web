<script setup lang="ts">
/**
 * Names a passkey — for a new one and for an existing one.
 *
 * The name is only ever the reader's own label: the server stores it for display and nothing else
 * keys off it, so the dialog stays a single field with a sensible default instead of a form.
 */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  /** Whether the dialog is open. */
  open: boolean
  /** `add` asks for a name before registering; `rename` edits one already stored. */
  mode: 'add' | 'rename'
  /** The current name, prefilled when renaming. */
  initialName?: string
  /** Whether the caller's request is still running. */
  pending?: boolean
  /**
   * Why the last attempt failed, already worded.
   *
   * The dialog stays open on most failures so the typed name survives, which means the reason has
   * to appear here: a failure rendered behind the dialog reads as a dead button.
   */
  errorMessage?: string
}>()

const emit = defineEmits<{
  /** Emitted with the trimmed name when the reader submits. */
  submit: [name: string]
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
const name = ref('')
/** The empty-name complaint; a failed request is reported through the prop above. */
const localError = ref('')

/** Restart from the incoming value every time it opens, so a cancelled edit leaves no trace. */
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    name.value = props.initialName ?? ''
    localError.value = ''
  },
  { immediate: true },
)

function submit(): void {
  const trimmed = name.value.trim()
  if (!trimmed) {
    localError.value = t('settings.passkey.nameRequired')
    return
  }
  localError.value = ''
  emit('submit', trimmed)
}
</script>

<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ mode === 'add' ? t('settings.passkey.addTitle') : t('settings.passkey.renameTitle') }}
        </DialogTitle>
        <DialogDescription v-if="mode === 'add'">{{ t('settings.passkey.addDescription') }}</DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-1.5 py-1">
        <Label for="passkey-name">{{ t('settings.passkey.nameLabel') }}</Label>
        <Input
          id="passkey-name"
          v-model="name"
          :placeholder="t('settings.passkey.namePlaceholder')"
          maxlength="64"
          data-testid="passkey-name"
          @keydown.enter.prevent="submit"
        />
        <p class="text-xs text-muted-foreground">{{ t('settings.passkey.nameHint') }}</p>
        <p v-if="localError || props.errorMessage" class="text-xs text-destructive" role="alert">
          {{ localError || props.errorMessage }}
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" :disabled="pending" @click="emit('update:open', false)">
          {{ t('settings.passkey.cancel') }}
        </Button>
        <Button type="button" :disabled="pending" data-testid="passkey-name-submit" @click="submit">
          {{ t('settings.passkey.save') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
