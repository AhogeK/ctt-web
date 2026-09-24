<script setup lang="ts">
import { ref, computed } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ForgotPasswordFormSchema } from '@/lib/schemas/auth.schema'
import { useThemeStore } from '@/stores/theme'
import CaptchaWidget from '@/components/CaptchaWidget.vue'

const emit = defineEmits<{
  /** Emitted when form validation passes with the email address */
  submit: [data: { email: string; captchaToken?: string }]
}>()

const props = defineProps<{
  /** Whether the form is currently submitting (disables button + shows loading) */
  loading?: boolean
  /** hCaptcha site key from public config — widget hidden when null/undefined */
  captchaSiteKey?: string | null
}>()

const form = useForm({
  validationSchema: toTypedSchema(ForgotPasswordFormSchema),
})

const themeStore = useThemeStore()
const captchaTheme = computed(() => (themeStore.isDark ? 'dark' : 'light'))
const captchaRef = ref<InstanceType<typeof CaptchaWidget> | null>(null)
const captchaToken = ref<string | null>(null)
const captchaError = ref(false)

function onCaptchaVerify(token: string) {
  captchaToken.value = token
  captchaError.value = false
}

function onCaptchaExpire() {
  captchaToken.value = null
}

const onSubmit = form.handleSubmit((values) => {
  // Block submission if captcha is required but not completed
  if (props.captchaSiteKey && !captchaToken.value) {
    captchaError.value = true
    return
  }
  emit('submit', { email: values.email, captchaToken: captchaToken.value ?? undefined })
})

defineExpose({
  captchaRef,
})
</script>

<template>
  <form @submit="onSubmit" class="flex flex-col gap-3 pt-4">
    <FormField v-slot="{ componentField }" name="email">
      <FormItem>
        <FormLabel
          class="text-sm font-emphasis text-foreground/80 dark:text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
          >Email</FormLabel
        >
        <FormControl>
          <Input
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            :class="
              cn(
                'h-10 rounded-md border border-border bg-secondary text-foreground',
                'placeholder:text-muted-foreground transition-[color,box-shadow] duration-200',
                'focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20',
                'dark:border-white/8 dark:bg-white/2 dark:text-foreground dark:placeholder:text-muted-foreground',
                'dark:focus:border-primary dark:focus:bg-white/4 dark:focus:ring-primary/25',
              )
            "
            v-bind="componentField"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <CaptchaWidget
      v-if="captchaSiteKey"
      ref="captchaRef"
      v-model="captchaToken"
      :sitekey="captchaSiteKey"
      :theme="captchaTheme"
      @verify="onCaptchaVerify"
      @expired="onCaptchaExpire"
    />
    <div class="min-h-6 text-center">
      <p
        class="text-sm text-destructive transition-opacity duration-200"
        :class="captchaError ? 'opacity-100' : 'opacity-0'"
      >
        Please complete the captcha verification
      </p>
    </div>

    <Button
      type="submit"
      :disabled="loading"
      :class="
        cn(
          'group w-full h-10 rounded-md bg-primary text-white font-emphasis text-base',
          'shadow-lg shadow-primary/15 transition-[box-shadow,transform] duration-200',
          'active:scale-[0.98]',
        )
      "
      style="font-feature-settings: 'cv01', 'ss03'"
    >
      <svg
        v-if="loading"
        class="mr-2 h-4 w-4 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
      </svg>
      <span class="relative z-10">{{ loading ? 'Sending...' : 'Send reset link' }}</span>
    </Button>
  </form>
</template>
