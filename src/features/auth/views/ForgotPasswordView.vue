<script setup lang="ts">
import { ref, computed, toValue } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useMutation } from '@tanstack/vue-query'
import { forgotPassword } from '@/lib/api/auth'
import { RouteNames } from '@/router/route-names'
import { isApiError, mapApiErrorCode } from '@/lib/utils/api-error'
import { useCooldown } from '@/composables/useCooldown'
import { usePublicConfig } from '@/composables/usePublicConfig'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ForgotPasswordForm from '../components/ForgotPasswordForm.vue'
import type CaptchaWidget from '@/components/CaptchaWidget.vue'

const router = useRouter()
const { countdown, start } = useCooldown()
const { data: publicConfig } = usePublicConfig()
const captchaSiteKey = computed(() => publicConfig.value?.captchaSiteKey ?? null)
const isSubmitted = ref(false)
const isIdempotent = ref(false)
const submittedEmail = ref('')
const forgotPasswordFormRef = ref<{
  captchaRef: InstanceType<typeof CaptchaWidget> | null
} | null>(null)

const mutation = useMutation({
  mutationFn: forgotPassword,
  onSuccess: (response, variables) => {
    forgotPasswordFormRef.value?.captchaRef?.reset()
    submittedEmail.value = variables.email
    isSubmitted.value = true
    isIdempotent.value = response.idempotentSkip === true

    if (response.idempotentSkip) {
      toast.info('Reset password email already sent', {
        description: 'Please check your inbox or spam folder',
      })
    }
  },
  onError: (error: unknown) => {
    forgotPasswordFormRef.value?.captchaRef?.reset()
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
    } else if (data?.code === 'SECURITY_006' || data?.code === 'SECURITY_007') {
      toast.error(mapApiErrorCode(data.code))
    } else {
      toast.error('Request failed', { description: 'Please try again later' })
    }
  },
})

const handleSubmit = (data: { email: string; captchaToken?: string }) => {
  mutation.mutate({ email: data.email, captchaToken: data.captchaToken })
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
    <div v-if="isSubmitted" class="space-y-6">
      <!-- Success Icon -->
      <div
        :class="
          cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl',
            'bg-green-500/10 text-green-600 dark:bg-green-500/15 dark:text-green-400',
          )
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
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <!-- Success Message -->
      <div class="space-y-2">
        <h2 class="text-xl font-[510] text-gray-900 dark:text-[#f7f8f8]" style="font-feature-settings: 'cv01', 'ss03'">
          {{ isIdempotent ? 'Email already sent' : 'Check your email' }}
        </h2>
        <p class="text-base text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
          <template v-if="isIdempotent">
            We already sent a reset link to
            <code
              class="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 font-mono text-sm font-medium text-gray-700 dark:text-gray-300"
              >{{ submittedEmail }}</code
            >
            recently. Please check your inbox or spam folder. If you didn't receive it, please wait a few minutes before
            trying again.
          </template>
          <template v-else>
            If
            <code
              class="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 font-mono text-sm font-medium text-gray-700 dark:text-gray-300"
              >{{ submittedEmail }}</code
            >
            exists in our database, you will receive a password recovery link shortly.
          </template>
        </p>
      </div>
    </div>

    <!-- Form -->
    <ForgotPasswordForm
      ref="forgotPasswordFormRef"
      v-else
      :loading="isSubmitting"
      :captcha-site-key="captchaSiteKey"
      @submit="handleSubmit"
    />

    <!-- Back to sign in -->
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
