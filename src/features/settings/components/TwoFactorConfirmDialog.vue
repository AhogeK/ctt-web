<script setup lang="ts">
/**
 * Confirms one of the three second-factor actions with a single field.
 *
 * The server accepts a TOTP code or an unused recovery code for both, and refuses a body carrying
 * both, so the field is one input: what the reader still has in hand decides which credential it
 * is, and the shape of the value decides how it is sent.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
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
import { extractErrorCode, isApiError, mapApiErrorCode } from '@/lib/utils/api-error'
import { useDisableTwoFactor, useRegenerateRecoveryCodes } from '../composables/useTwoFactor'
import { useDismissalGuard } from './use-dismissal-guard'
import RecoveryCodesPanel from './RecoveryCodesPanel.vue'
import { markFailureReported } from '@/lib/utils/operation-failure'

const props = defineProps<{
  /** Which second-factor action this dialog confirms. */
  mode: 'disable' | 'regenerate' | 'reset'
}>()
const emit = defineEmits<{ reset: [] }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const { mutation: disableMutation } = useDisableTwoFactor()
const { mutation: regenerateMutation } = useRegenerateRecoveryCodes()

const credential = ref('')
const errorMessage = ref('')
const codes = ref<string[]>([])
const acknowledged = ref(false)

const isDisable = computed(() => props.mode === 'disable')
const isReset = computed(() => props.mode === 'reset')
// A reset turns the factor off before the wizard takes over, so it runs the disable request.
const isPending = computed(() =>
  isDisable.value || isReset.value ? disableMutation.isPending.value : regenerateMutation.isPending.value,
)

/** A six-digit value is a TOTP code; anything else has to be a recovery code. */
function credentialOf(value: string) {
  const trimmed = value.trim()
  return /^\d{6}$/.test(trimmed) ? { code: trimmed } : { recoveryCode: trimmed }
}

watch(open, (isOpen) => {
  if (isOpen) {
    credential.value = ''
    errorMessage.value = ''
    codes.value = []
    acknowledged.value = false
  }
})

async function submit(): Promise<void> {
  errorMessage.value = ''
  if (!credential.value.trim()) {
    errorMessage.value = t('settings.twoFactor.credentialRequired')
    return
  }

  try {
    if (isDisable.value || isReset.value) {
      await disableMutation.mutateAsync(credentialOf(credential.value))
      if (isReset.value) {
        // The factor is off either way; only a dialog the reader kept open may hand over.
        const stillOpen = open.value
        open.value = false
        if (stillOpen) emit('reset')
        return
      }
      toast.success(t('settings.twoFactor.confirm.doneDisable'))
      open.value = false
      return
    }

    codes.value = await regenerateMutation.mutateAsync(credentialOf(credential.value))
  } catch (error) {
    markFailureReported(error)
    const code = extractErrorCode(error)
    if (code === 'AUTH_027') {
      errorMessage.value = t('settings.twoFactor.setup.invalidCode')
      return
    }
    if (isApiError(error) && error.statusCode === 429) {
      errorMessage.value = t('settings.twoFactor.errors.rateLimited')
      return
    }
    errorMessage.value = code ? mapApiErrorCode(code) : t('settings.twoFactor.errors.generic')
  }
}

function finishRegenerate(): void {
  toast.success(t('settings.twoFactor.confirm.doneRegenerate'))
  open.value = false
}

/** Codes on screen or a request in flight: both would lose something the server keeps only once. */
const preventDismissal = useDismissalGuard(() => codes.value.length > 0 || isPending.value)
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="sm:max-w-md"
      :show-close-button="codes.length === 0 && !isPending"
      @escape-key-down="preventDismissal"
      @pointer-down-outside="preventDismissal"
      @interact-outside="preventDismissal"
    >
      <DialogHeader>
        <DialogTitle>
          {{
            isDisable
              ? t('settings.twoFactor.confirm.disableTitle')
              : isReset
                ? t('settings.twoFactor.confirm.resetTitle')
                : t('settings.twoFactor.confirm.regenerateTitle')
          }}
        </DialogTitle>
        <DialogDescription v-if="codes.length === 0">
          {{
            isDisable
              ? t('settings.twoFactor.confirm.disableDescription')
              : isReset
                ? t('settings.twoFactor.confirm.resetDescription')
                : t('settings.twoFactor.confirm.regenerateDescription')
          }}
        </DialogDescription>
      </DialogHeader>

      <RecoveryCodesPanel
        v-if="codes.length > 0"
        v-model:acknowledged="acknowledged"
        :codes="codes"
        @confirmed="finishRegenerate"
      />

      <form v-else class="flex flex-col gap-3" @submit.prevent="submit">
        <div class="flex flex-col gap-1.5">
          <Label for="two-factor-credential">{{ t('settings.twoFactor.confirm.credentialLabel') }}</Label>
          <Input
            id="two-factor-credential"
            v-model="credential"
            autocomplete="one-time-code"
            :placeholder="t('settings.twoFactor.confirm.credentialPlaceholder')"
            data-testid="two-factor-credential"
          />
          <p v-if="errorMessage" role="alert" class="text-sm text-destructive">{{ errorMessage }}</p>
        </div>
      </form>

      <DialogFooter v-if="codes.length === 0">
        <Button type="button" variant="outline" :disabled="isPending" @click="open = false">
          {{ t('settings.twoFactor.cancel') }}
        </Button>
        <Button type="button" data-testid="two-factor-confirm-submit" :disabled="isPending" @click="submit">
          {{
            isDisable
              ? t('settings.twoFactor.confirm.submitDisable')
              : isReset
                ? t('settings.twoFactor.confirm.submitReset')
                : t('settings.twoFactor.confirm.submitRegenerate')
          }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
