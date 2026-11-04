<script setup lang="ts">
/**
 * The setup wizard: prove who you are, copy the key, prove the app works, keep the codes.
 *
 * Each step exists because the server refuses to skip it. A password account has to send its
 * password to start at all, the secret is only valid until it is confirmed, and the recovery codes
 * come back exactly once on confirmation. Treating them as one flow keeps the reader from landing
 * in a half-configured state where a factor exists but cannot be used.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCopyToClipboard } from '@/composables/useCopyToClipboard'
import { toast } from 'vue-sonner'
import QrcodeVue from 'qrcode.vue'
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
import type { StartTotpSetupResponse } from '@/lib/schemas/two-factor.schema'
import { useConfirmTwoFactorSetup, useStartTwoFactorSetup } from '../composables/useTwoFactor'
import { useDismissalGuard } from './use-dismissal-guard'
import RecoveryCodesPanel from './RecoveryCodesPanel.vue'
import { markFailureReported } from '@/lib/utils/operation-failure'

const props = defineProps<{
  /** Whether the account has a password to prove; OAuth-only accounts rely on session recency. */
  hasPassword: boolean
}>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const { copied, copy } = useCopyToClipboard()
const { mutation: startMutation } = useStartTwoFactorSetup()
const { mutation: confirmMutation } = useConfirmTwoFactorSetup()

type Step = 'password' | 'secret' | 'code' | 'codes'

const step = ref<Step>('password')
const password = ref('')
const code = ref('')
const setup = ref<StartTotpSetupResponse | null>(null)
const codes = ref<string[]>([])
const acknowledged = ref(false)
const errorMessage = ref('')

const isPending = computed(() => startMutation.isPending.value || confirmMutation.isPending.value)

// The server owns both values: it answers with 32 Base32 characters and an `otpauth://` URI built
// from them. Rewriting either one here would encode a different credential than the server stored.
const setupSecret = computed(() => setup.value?.secret ?? '')
const setupUri = computed(() => setup.value?.otpauthUri ?? '')

/** Starts a fresh wizard every time it opens, so nothing from a previous attempt leaks in. */
watch(
  open,
  (isOpen) => {
    if (!isOpen) return
    password.value = ''
    code.value = ''
    setup.value = null
    codes.value = []
    acknowledged.value = false
    errorMessage.value = ''
    step.value = props.hasPassword ? 'password' : 'secret'
    if (!props.hasPassword) void requestSecret(undefined)
    // `immediate` so a dialog mounted already open initialises too, not only one toggled later.
  },
  { immediate: true },
)

/**
 * Turns a failure into something the reader can act on.
 *
 * The password errors send them back a step because nothing after it can succeed without a
 * correct password; everything else stays where it is.
 */
function describeFailure(error: unknown): void {
  const errorCode = extractErrorCode(error)
  if (errorCode === 'AUTH_028') {
    toast.success(t('settings.twoFactor.enabledToast'))
    open.value = false
    return
  }
  if (errorCode === 'USER_013' || errorCode === 'USER_014') {
    step.value = 'password'
    errorMessage.value = mapApiErrorCode(errorCode)
    return
  }
  if (isApiError(error) && error.statusCode === 429) {
    errorMessage.value = t('settings.twoFactor.errors.rateLimited')
    return
  }
  errorMessage.value = errorCode ? mapApiErrorCode(errorCode) : t('settings.twoFactor.errors.generic')
}

async function requestSecret(currentPassword: string | undefined): Promise<void> {
  errorMessage.value = ''
  try {
    setup.value = await startMutation.mutateAsync(currentPassword)
    step.value = 'secret'
  } catch (error) {
    markFailureReported(error)
    describeFailure(error)
  }
}

async function submitPassword(): Promise<void> {
  if (!password.value) {
    errorMessage.value = t('settings.twoFactor.setup.passwordRequired')
    return
  }
  await requestSecret(password.value)
}

async function submitCode(): Promise<void> {
  errorMessage.value = ''
  if (!code.value.trim()) {
    errorMessage.value = t('settings.twoFactor.setup.invalidCode')
    return
  }
  try {
    codes.value = await confirmMutation.mutateAsync(code.value.trim())
    step.value = 'codes'
  } catch (error) {
    markFailureReported(error)
    if (extractErrorCode(error) === 'AUTH_027') {
      errorMessage.value = t('settings.twoFactor.setup.invalidCode')
      return
    }
    describeFailure(error)
  }
}

/**
 * Copies the setup key for readers who cannot scan.
 *
 * The clipboard can refuse (no permission, insecure context), and silently doing nothing would
 * leave them believing the key is on the clipboard when it is not.
 */
async function copySecret(): Promise<void> {
  if (!setup.value) return
  const succeeded = await copy(setupSecret.value)
  if (!succeeded) toast.error(t('settings.twoFactor.setup.copyFailed'))
}

function finish(): void {
  toast.success(t('settings.twoFactor.enabledToast'))
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
        <DialogTitle>{{ t('settings.twoFactor.setup.title') }}</DialogTitle>
        <DialogDescription v-if="step !== 'codes'">
          {{
            step === 'password'
              ? t('settings.twoFactor.setup.passwordHint')
              : step === 'secret'
                ? t('settings.twoFactor.setup.secretHint')
                : step === 'code'
                  ? t('settings.twoFactor.setup.codeTitle')
                  : t('settings.twoFactor.codes.description')
          }}
        </DialogDescription>
      </DialogHeader>

      <form v-if="step === 'password'" class="flex flex-col gap-3" @submit.prevent="submitPassword">
        <div class="flex flex-col gap-1.5">
          <Label for="two-factor-password">{{ t('settings.twoFactor.setup.passwordLabel') }}</Label>
          <Input
            id="two-factor-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            :placeholder="t('settings.twoFactor.setup.passwordPlaceholder')"
            data-testid="two-factor-password"
          />
        </div>
        <p v-if="errorMessage" role="alert" class="text-sm text-destructive">{{ errorMessage }}</p>
      </form>

      <div v-else-if="step === 'secret'" class="flex flex-col gap-4">
        <!-- White plate on purpose: an inverted code is unreadable to many scanners, so the plate
             stays white in both themes rather than following the surface. -->
        <div class="flex flex-col items-center gap-2">
          <div class="rounded-md bg-white p-2" data-testid="two-factor-qr-plate">
            <QrcodeVue
              v-if="setup"
              data-testid="two-factor-qr"
              :value="setupUri"
              :size="224"
              render-as="canvas"
              level="M"
              :margin="4"
              background="#ffffff"
              foreground="#000000"
              :aria-label="t('settings.twoFactor.setup.qrLabel')"
            />
          </div>
          <p class="text-sm text-muted-foreground">{{ t('settings.twoFactor.setup.scanHint') }}</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label>{{ t('settings.twoFactor.setup.secretLabel') }}</Label>
          <code
            data-testid="two-factor-secret"
            class="block break-all rounded-md border border-border bg-secondary/40 p-3 font-mono text-sm text-foreground"
          >
            {{ setupSecret }}
          </code>
          <div class="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" data-testid="two-factor-copy-secret" @click="copySecret">
              {{ copied ? t('settings.twoFactor.setup.copied') : t('settings.twoFactor.setup.copySecret') }}
            </Button>
            <Button v-if="setup" as="a" :href="setupUri" variant="outline" data-testid="two-factor-uri">
              {{ t('settings.twoFactor.setup.openUri') }}
            </Button>
          </div>
        </div>

        <p v-if="errorMessage" role="alert" class="text-sm text-destructive">{{ errorMessage }}</p>
      </div>

      <form v-else-if="step === 'code'" class="flex flex-col gap-3" @submit.prevent="submitCode">
        <div class="flex flex-col gap-1.5">
          <Label for="two-factor-setup-code">{{ t('settings.twoFactor.setup.codeLabel') }}</Label>
          <Input
            id="two-factor-setup-code"
            v-model="code"
            autocomplete="one-time-code"
            :placeholder="t('settings.twoFactor.setup.codePlaceholder')"
            data-testid="two-factor-setup-code"
          />
        </div>
        <p v-if="errorMessage" role="alert" class="text-sm text-destructive">{{ errorMessage }}</p>
      </form>

      <RecoveryCodesPanel v-else v-model:acknowledged="acknowledged" :codes="codes" @confirmed="finish" />

      <DialogFooter v-if="step !== 'codes'">
        <Button type="button" variant="outline" :disabled="isPending" @click="open = false">
          {{ t('settings.twoFactor.cancel') }}
        </Button>
        <Button
          v-if="step === 'password'"
          type="button"
          data-testid="two-factor-password-submit"
          :disabled="isPending"
          @click="submitPassword"
        >
          {{ t('settings.twoFactor.setup.next') }}
        </Button>
        <Button v-else-if="step === 'secret'" type="button" data-testid="two-factor-secret-next" @click="step = 'code'">
          {{ t('settings.twoFactor.setup.next') }}
        </Button>
        <Button v-else type="button" data-testid="two-factor-code-submit" :disabled="isPending" @click="submitCode">
          {{ t('settings.twoFactor.setup.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
