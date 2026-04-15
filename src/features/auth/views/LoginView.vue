<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { useMutation } from '@tanstack/vue-query'
import { login } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/auth'
import { RouteNames } from '@/router/route-names'
import { isApiError, mapApiErrorCode } from '@/lib/utils/api-error'
import { useCooldown } from '@/composables/useCooldown'
import LoginForm from '../components/LoginForm.vue'

const router = useRouter()
const authStore = useAuthStore()
const { countdown, start } = useCooldown()

const mutation = useMutation({
  mutationFn: login,
  onSuccess: (response) => {
    authStore.setAuth(response)
    router.push({ name: RouteNames.DASHBOARD })
  },
  onError: (error: unknown) => {
    if (isApiError(error)) {
      if (error.statusCode === 401) {
        toast.error(mapApiErrorCode('invalid_credentials'))
      } else if (error.statusCode === 429) {
        start()
        toast.error(mapApiErrorCode('rate_limit_exceeded'), {
          description: `Try again in ${countdown.value}s`,
        })
      } else {
        toast.error('Login failed', { description: error.message || 'Please try again later' })
      }
    } else {
      toast.error('Login failed', { description: 'An unexpected error occurred' })
    }
  },
})

const handleSubmit = (data: Parameters<typeof login>[0]) => {
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
        <span
          class="text-lg font-[510] text-gray-900 dark:text-[#f7f8f8]"
          style="font-feature-settings: 'cv01', 'ss03'"
          >CTT</span
        >
      </div>
      <h1
        class="text-3xl font-[510] text-gray-900 dark:text-[#f7f8f8]"
        style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
      >
        Welcome back
      </h1>
      <p
        class="text-base text-gray-500 dark:text-[#8a8f98]"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Sign in to access your coding analytics dashboard.
      </p>
    </div>

    <!-- Form -->
    <LoginForm @submit="handleSubmit" />

    <!-- Create Account Link -->
    <div class="pt-2 text-center">
      <p
        class="text-sm text-gray-500 dark:text-[#8a8f98]"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Don't have an account?
        <RouterLink
          :to="{ name: RouteNames.REGISTER }"
          class="ml-1 font-[510] text-[#5e6ad2] underline-offset-4 hover:text-[#7170ff] hover:underline dark:text-[#7170ff] dark:hover:text-[#828fff]"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          Create account
        </RouterLink>
      </p>
    </div>
  </div>
</template>
