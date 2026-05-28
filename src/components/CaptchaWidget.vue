<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
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

/** Whether to show the brief success indicator after verification */
const showSuccess = ref(false)

/** Timer ID for hiding the success indicator after delay */
let successTimerId: ReturnType<typeof setTimeout> | null = null

// Show success briefly then hide completely
watch(modelValue, (newVal) => {
  if (newVal) {
    showSuccess.value = true
    successTimerId = setTimeout(() => {
      showSuccess.value = false
      successTimerId = null
    }, 1500)
  } else {
    showSuccess.value = false
    if (successTimerId !== null) {
      clearTimeout(successTimerId)
      successTimerId = null
    }
  }
})

// Clean up timer on component unmount to prevent memory leak
onUnmounted(() => {
  if (successTimerId !== null) {
    clearTimeout(successTimerId)
    successTimerId = null
  }
})

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
    <div v-if="showSuccess" class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>Verification complete</span>
    </div>
    <VueHcaptcha
      v-else-if="!modelValue"
      ref="hcaptchaRef"
      :key="theme"
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
