<script setup lang="ts">
import { ref, computed, toValue } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { useMutation } from '@tanstack/vue-query'
import { RouteNames } from '@/router/route-names'
import { isApiError, mapApiErrorCode } from '@/lib/utils/api-error'
import { confirmPasswordReset } from '@/lib/api/auth'
import { ResetPasswordFormSchema, type ResetPasswordForm } from '@/lib/schemas/auth.schema'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm, useFieldValue } from 'vee-validate'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCooldown } from '@/composables/useCooldown'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.vue'

const { countdown, start } = useCooldown()

const router = useRouter()
const route = useRoute()

const token = computed(() => (route.query.token as string) || '')

const form = useForm<ResetPasswordForm>({
  validationSchema: toTypedSchema(ResetPasswordFormSchema),
})

const passwordValue = useFieldValue<string>('newPassword')

const mutation = useMutation({
  mutationFn: (data: { token: string; newPassword: string }) =>
    confirmPasswordReset({ token: data.token, newPassword: data.newPassword }),
  onSuccess: () => {
    toast.success('Password reset successful. All devices have been logged out.')
    router.push({ name: RouteNames.LOGIN })
  },
  onError: (error: unknown) => {
    if (!isApiError(error)) {
      toast.error('Password reset failed. Please try again later.')
      return
    }

    const data = error.data as { code?: string } | undefined

    if (error.statusCode === 401 && data?.code === 'AUTH_003') {
      toast.error(mapApiErrorCode('AUTH_003'))
      router.push({ name: RouteNames.FORGOT_PASSWORD })
    } else if (error.statusCode === 409 && data?.code === 'PASSWORD_SAME_AS_OLD') {
      form.setFieldError('newPassword', mapApiErrorCode('PASSWORD_SAME_AS_OLD'))
    } else if (error.statusCode === 429) {
      start()
      toast.error('Too many requests', {
        description: `Try again in ${countdown.value}s`,
      })
    } else {
      toast.error('Password reset failed. Please try again later.')
    }
  },
})

const onSubmit = form.handleSubmit((values) => {
  if (!token.value) {
    toast.error('Invalid reset link', {
      description: 'Please request a new password reset email.',
    })
    return
  }
  mutation.mutate({
    token: token.value,
    newPassword: values.newPassword,
  })
})

const isSubmitting = computed(() => toValue(mutation.isPending))

// Password visibility toggle
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
</script>

<template>
  <div class="mx-auto w-full max-w-sm space-y-10">
    <!-- Header -->
    <div class="space-y-4">
      <div class="flex items-center gap-2.5 lg:hidden">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5e6ad2] text-white shadow-md shadow-[#5e6ad2]/20"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <span class="text-lg font-[510] text-gray-900 dark:text-[#f7f8f8]" style="font-feature-settings: 'cv01', 'ss03'"
          >CTT</span
        >
      </div>
      <h1
        class="text-3xl font-[510] text-gray-900 dark:text-[#f7f8f8]"
        style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
      >
        Reset password
      </h1>
      <p class="text-base text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
        Enter your new password below.
      </p>
    </div>

    <!-- Error State: No token -->
    <div v-if="!token" class="space-y-6">
      <div
        :class="
          cn('flex h-16 w-16 items-center justify-center rounded-2xl', 'bg-red-500/10 text-red-500 dark:bg-red-500/15')
        "
      >
        <svg
          class="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div class="space-y-3">
        <h1
          class="text-2xl font-[510] text-gray-900 dark:text-[#f7f8f8] sm:text-3xl"
          style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
        >
          Invalid Reset Link
        </h1>
        <p class="text-base text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
      </div>
      <Button
        :class="
          cn(
            'w-full h-11 rounded-md font-[510]',
            'bg-[#5e6ad2] text-white hover:bg-[#5e6ad2]/90',
            'dark:bg-[#5e6ad2] dark:hover:bg-[#5e6ad2]/80',
          )
        "
        @click="router.push({ name: RouteNames.FORGOT_PASSWORD })"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Request New Reset Link
      </Button>
    </div>

    <!-- Form -->
    <form v-else @submit="onSubmit" class="flex flex-col gap-3 pt-4">
      <FormField v-slot="{ componentField }" name="newPassword">
        <FormItem>
          <FormLabel
            class="text-sm font-[510] text-gray-600 dark:text-[#8a8f98]"
            style="font-feature-settings: 'cv01', 'ss03'"
            >New Password</FormLabel
          >
          <FormControl>
            <div class="relative">
              <Input
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="Enter new password"
                :class="
                  cn(
                    'h-11 rounded-md border border-[#d0d6e0] bg-[#f3f4f5] text-[#1a1a2e]',
                    'placeholder:text-[#8a8f98] transition-all duration-200',
                    'focus:border-[#5e6ad2] focus:bg-white focus:ring-2 focus:ring-[#5e6ad2]/20',
                    'dark:border-white/8 dark:bg-white/2 dark:text-[#f7f8f8] dark:placeholder:text-[#62666d]',
                    'dark:focus:border-[#5e6ad2] dark:focus:bg-white/4 dark:focus:ring-[#5e6ad2]/25',
                  )
                "
                v-bind="componentField"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 dark:text-[#62666d] dark:hover:text-[#d0d6e0]"
                @click="showNewPassword = !showNewPassword"
              >
                <svg
                  v-if="!showNewPassword"
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </FormControl>
          <PasswordStrengthMeter :password="passwordValue || ''" />
          <FormMessage class="min-h-0" />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="confirmPassword">
        <FormItem>
          <FormLabel
            class="text-sm font-[510] text-gray-600 dark:text-[#8a8f98]"
            style="font-feature-settings: 'cv01', 'ss03'"
            >Confirm Password</FormLabel
          >
          <FormControl>
            <div class="relative">
              <Input
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm new password"
                :class="
                  cn(
                    'h-11 rounded-md border border-[#d0d6e0] bg-[#f3f4f5] text-[#1a1a2e]',
                    'placeholder:text-[#8a8f98] transition-all duration-200',
                    'focus:border-[#5e6ad2] focus:bg-white focus:ring-2 focus:ring-[#5e6ad2]/20',
                    'dark:border-white/8 dark:bg-white/2 dark:text-[#f7f8f8] dark:placeholder:text-[#62666d]',
                    'dark:focus:border-[#5e6ad2] dark:focus:bg-white/4 dark:focus:ring-[#5e6ad2]/25',
                  )
                "
                v-bind="componentField"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 dark:text-[#62666d] dark:hover:text-[#d0d6e0]"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <svg
                  v-if="!showConfirmPassword"
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <Button
        type="submit"
        :disabled="isSubmitting"
        :class="
          cn(
            'group w-full h-11 mt-3 rounded-md bg-[#5e6ad2] text-white font-[510] text-base',
            'shadow-lg shadow-[#5e6ad2]/25 transition-all duration-200',
            'hover:bg-[#7170ff] hover:shadow-[#7170ff]/30 hover:scale-[1.02] active:scale-[0.98]',
            'disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100',
          )
        "
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        <svg
          v-if="isSubmitting"
          class="mr-2 h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
        </svg>
        <span class="relative z-10">{{ isSubmitting ? 'Resetting...' : 'Reset password' }}</span>
      </Button>
    </form>

    <Button
      variant="ghost"
      :class="cn('w-full h-11 font-[510] text-muted-foreground')"
      @click="router.push({ name: RouteNames.LOGIN })"
      style="font-feature-settings: 'cv01', 'ss03'"
    >
      Back to sign in
    </Button>
  </div>
</template>
