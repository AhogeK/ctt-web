<script setup lang="ts">
import { ref, shallowRef, watch, computed } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm, useFieldValue } from 'vee-validate'
import { RegisterFormSchema, type RegisterFormData } from '@/lib/schemas/auth.schema'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import PasswordStrengthMeter from './PasswordStrengthMeter.vue'
import TermsDialog from './TermsDialog.vue'
import { Eye, EyeOff } from '@lucide/vue'
import { useThemeStore } from '@/stores/theme'
import CaptchaWidget from '@/components/CaptchaWidget.vue'

const props = defineProps<{
  /** Server-side field errors mapped to field names */
  serverErrors?: Record<string, string>
  /** hCaptcha site key from public config — widget hidden when null/undefined */
  captchaSiteKey?: string | null
}>()

const emit = defineEmits<{
  /** Emitted when form validation passes with user registration data (without termsVersion) */
  submit: [data: RegisterFormData]
}>()

const form = useForm({
  validationSchema: toTypedSchema(RegisterFormSchema),
  initialValues: {
    agreedToTerms: false,
  },
})

const showPassword = shallowRef(false)
const showConfirmPassword = shallowRef(false)
const showTerms = shallowRef(false)
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

const passwordValue = useFieldValue<string>('password')

// Valid field names for server errors
const VALID_FIELDS = ['email', 'displayName', 'password', 'confirmPassword'] as const

// Apply server errors to form fields when they arrive
watch(
  () => props.serverErrors,
  (errors) => {
    if (!errors) return
    for (const [field, message] of Object.entries(errors)) {
      if (VALID_FIELDS.includes(field as (typeof VALID_FIELDS)[number])) {
        form.setFieldError(field as (typeof VALID_FIELDS)[number], message)
      }
    }
  },
  { immediate: true },
)

const onSubmit = form.handleSubmit((values) => {
  // Block submission if captcha is required but not completed
  if (props.captchaSiteKey && !captchaToken.value) {
    captchaError.value = true
    return
  }
  emit('submit', {
    email: values.email,
    displayName: values.displayName,
    password: values.password,
    captchaToken: captchaToken.value ?? undefined,
  })
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

    <FormField v-slot="{ componentField }" name="displayName">
      <FormItem>
        <FormLabel
          class="text-sm font-emphasis text-foreground/80 dark:text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
          >Display Name</FormLabel
        >
        <FormControl>
          <Input
            placeholder="Your name"
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

    <FormField v-slot="{ componentField }" name="password">
      <FormItem>
        <FormLabel
          class="text-sm font-emphasis text-foreground/80 dark:text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
          >Password</FormLabel
        >
        <FormControl>
          <div class="relative">
            <Input
              :type="showPassword ? 'text' : 'password'"
              placeholder="Create a strong password"
              autocomplete="new-password"
              :class="
                cn(
                  'h-10 rounded-md border border-border bg-secondary text-foreground',
                  'placeholder:text-muted-foreground transition-[color,box-shadow] duration-200',
                  'focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20',
                  'dark:border-white/8 dark:bg-white/2 dark:text-foreground dark:placeholder:text-muted-foreground',
                  'dark:focus:border-primary dark:focus:bg-white/4 dark:focus:ring-primary/25',
                  'pr-10',
                )
              "
              v-bind="componentField"
            />
            <button
              type="button"
              tabindex="-1"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="!showPassword" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
          </div>
        </FormControl>
        <PasswordStrengthMeter :password="passwordValue ?? ''" />
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="confirmPassword">
      <FormItem>
        <FormLabel
          class="text-sm font-emphasis text-foreground/80 dark:text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
          >Confirm Password</FormLabel
        >
        <FormControl>
          <div class="relative">
            <Input
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Repeat your password"
              autocomplete="new-password"
              :class="
                cn(
                  'h-10 rounded-md border border-border bg-secondary text-foreground',
                  'placeholder:text-muted-foreground transition-[color,box-shadow] duration-200',
                  'focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20',
                  'dark:border-white/8 dark:bg-white/2 dark:text-foreground dark:placeholder:text-muted-foreground',
                  'dark:focus:border-primary dark:focus:bg-white/4 dark:focus:ring-primary/25',
                  'pr-10',
                )
              "
              v-bind="componentField"
            />
            <button
              type="button"
              tabindex="-1"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <EyeOff v-if="!showConfirmPassword" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ value, handleChange }" name="agreedToTerms">
      <FormItem>
        <FormControl>
          <div class="flex items-start gap-2">
            <Checkbox :checked="value" @update:model-value="handleChange" class="mt-0.5 cursor-pointer" />
            <div class="grid gap-1.5 leading-tight">
              <FormLabel class="text-sm font-normal text-foreground/80 dark:text-muted-foreground">
                I agree to the
                <button
                  type="button"
                  class="cursor-pointer text-primary hover:text-accent underline transition-colors"
                  @click="showTerms = true"
                >
                  Terms of Service
                </button>
              </FormLabel>
            </div>
          </div>
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
      :class="
        cn(
          'group w-full h-10 rounded-md bg-primary text-white font-emphasis text-base',
          'shadow-lg shadow-primary/15 transition-[box-shadow,transform] duration-200',
          'hover:bg-accent-hover hover:shadow-accent-hover/20 hover:scale-[1.02] active:scale-[0.98]',
        )
      "
      style="font-feature-settings: 'cv01', 'ss03'"
    >
      <span class="relative z-10">Create account</span>
    </Button>
  </form>
  <TermsDialog v-if="showTerms" v-model:open="showTerms" :read-only="true" />
</template>
