<script setup lang="ts">
import { ref } from 'vue'
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha'

/**
 * Thin wrapper around `@hcaptcha/vue3-hcaptcha` for consistent CAPTCHA integration.
 *
 * Supports `v-model` for the captcha token and exposes a `reset()` method
 * so parent forms can clear the widget after submission (success or error).
 *
 * @example
 * ```vue
 * <CaptchaWidget v-model="captchaToken" :sitekey="siteKey" />
 * ```
 */
interface Props {
  /** hCaptcha site key from the developer dashboard */
  sitekey: string
  /** Widget color theme (defaults to hCaptcha's own default) */
  theme?: 'light' | 'dark'
  /** Widget display size */
  size?: 'normal' | 'compact' | 'invisible'
  /** ISO 639-2 language code for the widget UI */
  language?: string
}

defineProps<Props>()

const emit = defineEmits<{
  /** Fired when the user successfully completes the captcha */
  verify: [token: string]
  /** Fired when a previously valid token expires */
  expire: []
  /** Fired on captcha rendering or verification errors */
  error: [error: unknown]
  /** Fired when the challenge modal is dismissed without completion */
  challengeExpired: []
}>()

/** Two-way bound captcha token — `null` when not verified or after expiry/error */
const modelValue = defineModel<string | null>()

const hcaptchaRef = ref<InstanceType<typeof VueHcaptcha> | null>(null)

function onVerify(token: string) {
  modelValue.value = token
  emit('verify', token)
}

function onExpire() {
  modelValue.value = null
  emit('expire')
}

function onError(error: unknown) {
  modelValue.value = null
  emit('error', error)
}

function onChallengeExpired() {
  modelValue.value = null
  emit('challengeExpired')
}

defineExpose({
  /** Reset the hCaptcha widget and clear the bound token */
  reset: () => {
    hcaptchaRef.value?.reset()
    modelValue.value = null
  },
})
</script>

<template>
  <div class="flex justify-center">
    <VueHcaptcha
      ref="hcaptchaRef"
      :sitekey="sitekey"
      :theme="theme"
      :size="size"
      :language="language"
      @verify="onVerify"
      @expired="onExpire"
      @error="onError"
      @challengeExpired="onChallengeExpired"
    />
  </div>
</template>
