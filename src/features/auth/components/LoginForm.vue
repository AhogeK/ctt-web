<script setup lang="ts">
import { shallowRef } from 'vue'
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

const emit = defineEmits<{
  /** Emitted when form validation passes with user login credentials */
  submit: [data: { email: string; password: string }]
}>()

const props = defineProps<{
  /** Whether the form is currently submitting (disables button + shows loading) */
  loading?: boolean
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

const onSubmit = form.handleSubmit((values) => {
  emit('submit', {
    email: values.email,
    password: values.password,
  })
})

// Expose form instance for parent to set field errors (e.g., AUTH_001)
defineExpose({
  form,
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

    <Button
      type="submit"
      :disabled="loading"
      :class="
        cn(
          'group w-full h-10 mt-3 rounded-md bg-[#7b85d4] text-white font-[510] text-base',
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
  </form>
</template>
