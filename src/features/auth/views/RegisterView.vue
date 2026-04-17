<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useMutation } from '@tanstack/vue-query'
import { register } from '@/lib/api/auth'
import { RouteNames } from '@/router/route-names'
import { isApiError, mapApiErrorCode } from '@/lib/utils/api-error'
import { useCooldown } from '@/composables/useCooldown'
import RegisterForm from '../components/RegisterForm.vue'

const router = useRouter()
const { countdown, start } = useCooldown()
const serverErrors = ref<Record<string, string>>()
const registeredEmail = ref('')

const mutation = useMutation({
  mutationFn: register,
  onSuccess: () => {
    serverErrors.value = undefined
    router.push({ name: RouteNames.REGISTER_SUCCESS, query: { email: registeredEmail.value } })
  },
  onError: (error: unknown) => {
    serverErrors.value = undefined
    if (isApiError(error)) {
      const data = error.data as { error?: string } | undefined
      if (error.statusCode === 409 && data?.error === 'USER_001') {
        serverErrors.value = { email: mapApiErrorCode('USER_001') }
      } else if (error.statusCode === 429) {
        start()
        toast.error(mapApiErrorCode('rate_limit_exceeded'), {
          description: `Try again in ${countdown.value}s`,
        })
      } else {
        toast.error('Registration failed', {
          description: error.message || 'Please try again later',
        })
      }
    } else {
      toast.error('Registration failed', { description: 'An unexpected error occurred' })
    }
  },
})

const handleSubmit = (data: Parameters<typeof register>[0]) => {
  registeredEmail.value = data.email
  mutation.mutate(data)
}
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
        Create your account
      </h1>
      <p class="text-base text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
        Start tracking your coding time across all devices.
      </p>
    </div>

    <!-- Form -->
    <RegisterForm :server-errors="serverErrors" @submit="handleSubmit" />

    <!-- Sign In Link -->
    <div class="pt-2 text-center">
      <p class="text-sm text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
        Already have an account?
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
