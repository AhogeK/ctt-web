<script setup lang="ts">
import { ref, computed, toValue } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { useMutation } from '@tanstack/vue-query'
import { forgotPassword } from '@/lib/api/auth'
import { RouteNames } from '@/router/route-names'
import { isApiError, mapApiErrorCode } from '@/lib/utils/api-error'
import { useCooldown } from '@/composables/useCooldown'
import ForgotPasswordForm from '../components/ForgotPasswordForm.vue'

const { countdown, start } = useCooldown()
const isSubmitted = ref(false)
const submittedEmail = ref('')

const mutation = useMutation({
  mutationFn: forgotPassword,
  onSuccess: (_data, variables) => {
    submittedEmail.value = variables.email
    isSubmitted.value = true
  },
  onError: (error: unknown) => {
    if (!isApiError(error)) {
      toast.error('Request failed', { description: 'An unexpected error occurred' })
      return
    }

    const data = error.data as { code?: string } | undefined

    if (error.statusCode === 429) {
      start()
      toast.error(mapApiErrorCode('rate_limit_exceeded'), {
        description: `Try again in ${countdown.value}s`,
      })
    } else if (data?.code === 'COMMON_003') {
      toast.error(mapApiErrorCode('COMMON_003'))
    } else {
      toast.error('Request failed', { description: 'Please try again later' })
    }
  },
})

const handleSubmit = (data: { email: string }) => {
  mutation.mutate({ email: data.email })
}

const isSubmitting = computed(() => toValue(mutation.isPending))
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
        Reset your password
      </h1>
      <p
        v-if="!isSubmitted"
        class="text-base text-gray-500 dark:text-[#8a8f98]"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Enter your email address and we'll send you a link to reset your password.
      </p>
    </div>

    <!-- Success State -->
    <div
      v-if="isSubmitted"
      class="space-y-4 rounded-lg border border-[#d0d6e0] bg-[#f3f4f5] p-6 dark:border-white/8 dark:bg-white/2"
    >
      <div class="flex items-center gap-3">
        <svg
          class="h-6 w-6 shrink-0 text-green-600 dark:text-green-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <p class="text-sm text-gray-700 dark:text-[#c0c4cc]" style="font-feature-settings: 'cv01', 'ss03'">
          If <strong>{{ submittedEmail }}</strong> exists in our database, you will receive a password recovery link
          shortly.
        </p>
      </div>
      <RouterLink
        :to="{ name: RouteNames.LOGIN }"
        class="mt-2 block text-sm font-[510] text-[#5e6ad2] underline-offset-4 hover:text-[#7170ff] hover:underline dark:text-[#7170ff] dark:hover:text-[#828fff]"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Back to sign in
      </RouterLink>
    </div>

    <!-- Form -->
    <ForgotPasswordForm v-else :loading="isSubmitting" @submit="handleSubmit" />

    <!-- Back to Login Link -->
    <div v-if="!isSubmitted" class="pt-2 text-center">
      <p class="text-sm text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
        Remember your password?
        <RouterLink
          :to="{ name: RouteNames.LOGIN }"
          class="ml-1 font-[510] text-[#5e6ad2] underline-offset-4 hover:text-[#7170ff] hover:underline dark:text-[#7170ff] dark:hover:text-[#828fff]"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          Sign in
        </RouterLink>
      </p>
    </div>
  </div>
</template>
