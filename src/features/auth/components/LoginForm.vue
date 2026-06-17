<script setup lang="ts">
import { ref, shallowRef, computed } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { RouterLink } from 'vue-router'
import { RouteNames } from '@/router/route-names'
import { StrongPasswordSchema } from '@/lib/schemas/auth.schema'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'
import CaptchaWidget from '@/components/CaptchaWidget.vue'

const emit = defineEmits<{
  /** Emitted when form validation passes with user login credentials */
  submit: [data: { email: string; password: string; captchaToken?: string }]
  /** Emitted when user clicks GitHub OAuth login button */
  'github-login': []
}>()

const props = defineProps<{
  /** Whether the form is currently submitting (disables button + shows loading) */
  loading?: boolean
  /** hCaptcha site key from public config — widget hidden when null/undefined */
  captchaSiteKey?: string | null
}>()

/**
 * UI-only validation schema for the login form.
 *
 * deviceId is NOT included here because it's injected by the auth store
 * (not a user-facing field). The full LoginRequestSchema with deviceId
 * is applied at the API layer.
 */
const LoginFormSchema = z.object({
  email: z.email('Invalid email format').min(1, 'Email is required'),
  password: StrongPasswordSchema,
})

const form = useForm({
  validationSchema: toTypedSchema(LoginFormSchema),
})

const showPassword = shallowRef(false)
const themeStore = useThemeStore()
const captchaTheme = computed(() => (themeStore.isDark ? 'dark' : 'light'))
const captchaRef = ref<InstanceType<typeof CaptchaWidget> | null>(null)
const captchaToken = ref<string | null>(null)
const captchaError = ref(false)
const isGithubLoading = ref(false)

function onCaptchaVerify(token: string) {
  captchaToken.value = token
  captchaError.value = false
}

function onCaptchaExpire() {
  captchaToken.value = null
}

function handleGithubLogin() {
  // Block if captcha is required but not completed
  if (props.captchaSiteKey && !captchaToken.value) {
    captchaError.value = true
    return
  }
  isGithubLoading.value = true
  emit('github-login')
}

const onSubmit = form.handleSubmit((values) => {
  // Block submission if captcha is required but not completed
  if (props.captchaSiteKey && !captchaToken.value) {
    captchaError.value = true
    return
  }
  emit('submit', {
    email: values.email,
    password: values.password,
    captchaToken: captchaToken.value ?? undefined,
  })
})

// Expose form instance for parent to set field errors (e.g., AUTH_001)
defineExpose({
  form,
  captchaRef,
})
</script>

<template>
  <form @submit="onSubmit" class="flex flex-col gap-3 pt-4">
    <FormField v-slot="{ componentField }" name="email">
      <FormItem>
        <FormLabel
          class="text-sm font-[510] text-gray-600 dark:text-[#8a8f98]"
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
                'h-10 rounded-md border border-[#d0d6e0] bg-[#f3f4f5] text-[#1a1a2e]',
                'placeholder:text-[#8a8f98] transition-all duration-200',
                'focus:border-[#5e6ad2] focus:bg-white focus:ring-2 focus:ring-[#5e6ad2]/20',
                'dark:border-white/8 dark:bg-white/2 dark:text-[#f7f8f8] dark:placeholder:text-[#62666d]',
                'dark:focus:border-[#5e6ad2] dark:focus:bg-white/4 dark:focus:ring-[#5e6ad2]/25',
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
        <div class="flex items-center justify-between">
          <FormLabel
            class="text-sm font-[510] text-gray-600 dark:text-[#8a8f98]"
            style="font-feature-settings: 'cv01', 'ss03'"
            >Password</FormLabel
          >
          <RouterLink
            :to="{ name: RouteNames.FORGOT_PASSWORD }"
            class="text-sm font-[510] text-[#5e6ad2] underline-offset-4 hover:text-[#7170ff] hover:underline dark:text-[#7170ff] dark:hover:text-[#828fff]"
            style="font-feature-settings: 'cv01', 'ss03'"
          >
            Forgot password?
          </RouterLink>
        </div>
        <FormControl>
          <div class="relative">
            <Input
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              autocomplete="current-password"
              :class="
                cn(
                  'h-10 rounded-md border border-[#d0d6e0] bg-[#f3f4f5] text-[#1a1a2e]',
                  'placeholder:text-[#8a8f98] transition-all duration-200',
                  'focus:border-[#5e6ad2] focus:bg-white focus:ring-2 focus:ring-[#5e6ad2]/20',
                  'dark:border-white/8 dark:bg-white/2 dark:text-[#f7f8f8] dark:placeholder:text-[#62666d]',
                  'dark:focus:border-[#5e6ad2] dark:focus:bg-white/4 dark:focus:ring-[#5e6ad2]/25',
                  'pr-10',
                )
              "
              v-bind="componentField"
            />
            <button
              type="button"
              tabindex="-1"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8f98] hover:text-[#5e6ad2] transition-colors cursor-pointer"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="!showPassword" class="h-4 w-4" />
              <Eye v-else class="h-4 w-4" />
            </button>
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
      :disabled="loading"
      :class="
        cn(
          'group w-full h-10 rounded-md bg-[#7b85d4] text-white font-[510] text-base',
          'shadow-lg shadow-[#7b85d4]/15 transition-all duration-200',
          'hover:bg-[#8b95e0] hover:shadow-[#8b95e0]/20 hover:scale-[1.02] active:scale-[0.98]',
          'disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100',
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
      <span class="relative z-10">{{ loading ? 'Signing in...' : 'Sign in' }}</span>
    </Button>

    <div class="relative my-2">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-[#d0d6e0] dark:border-white/8" />
      </div>
      <div class="relative flex justify-center text-xs">
        <span class="bg-[#f3f4f5] px-2 text-[#8a8f98] dark:bg-white/2 dark:text-[#62666d]">or</span>
      </div>
    </div>

    <Button
      type="button"
      variant="outline"
      :disabled="isGithubLoading"
      :class="
        cn(
          'w-full h-10 rounded-md font-[510] text-sm',
          'border-[#d0d6e0] bg-white text-[#1a1a2e]!',
          'dark:border-white/8 dark:bg-white/2 dark:text-[#f7f8f8]!',
          'transition-all duration-200',
          'hover:bg-white! hover:border-[#5e6ad2]!',
          'dark:hover:bg-white/5! dark:hover:border-[#7170ff]/50!',
        )
      "
      style="font-feature-settings: 'cv01', 'ss03'"
      @click="handleGithubLogin"
    >
      <svg
        v-if="isGithubLoading"
        class="mr-2 h-4 w-4 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
      </svg>
      <svg v-else class="mr-2 h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
        />
      </svg>
      {{ isGithubLoading ? 'Connecting to GitHub...' : 'Continue with GitHub' }}
    </Button>
  </form>
</template>
