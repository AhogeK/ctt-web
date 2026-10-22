<script setup lang="ts">
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()

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
      toast.info(t('auth.errors.resetEmailAlreadySent'), {
        description: t('auth.errors.checkInboxOrSpam'),
      })
    }
  },
  onError: (error: unknown) => {
    forgotPasswordFormRef.value?.captchaRef?.reset()
    if (!isApiError(error)) {
      toast.error(t('auth.errors.requestFailed'), { description: t('auth.errors.unexpected') })
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
      toast.error('Request failed', { description: t('auth.errors.tryAgainLater') })
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
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-md shadow-primary/20"
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
          class="text-lg font-emphasis text-foreground dark:text-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
          >CTT</span
        >
      </div>
      <h1
        class="text-3xl font-emphasis text-foreground dark:text-foreground"
        style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
      >
        {{ t('auth.forgot.title') }}
      </h1>
      <p
        v-if="!isSubmitted"
        class="text-base text-muted-foreground dark:text-muted-foreground"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        {{ t('auth.forgot.subtitle') }}
      </p>
    </div>

    <!-- Success State -->
    <div v-if="isSubmitted" class="space-y-6">
      <!-- Success Icon -->
      <div
        :class="
          cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl',
            'bg-success/10 text-success dark:bg-success/15 dark:text-success',
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
        <h2
          class="text-xl font-emphasis text-foreground dark:text-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          {{ isIdempotent ? t('auth.forgot.alreadySent') : t('auth.forgot.checkEmail') }}
        </h2>
        <p
          class="text-base text-muted-foreground dark:text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          <template v-if="isIdempotent">
            {{ t('auth.forgot.alreadySentPrefix') }}
            <code
              class="px-2 py-0.5 rounded-md bg-muted dark:bg-card font-mono text-sm font-medium text-foreground/90 dark:text-muted-foreground"
              >{{ submittedEmail }}</code
            >
            {{ t('auth.forgot.alreadySentSuffix') }}
          </template>
          <template v-else>
            {{ t('auth.forgot.neutralPrefix') }}
            <code
              class="px-2 py-0.5 rounded-md bg-muted dark:bg-card font-mono text-sm font-medium text-foreground/90 dark:text-muted-foreground"
              >{{ submittedEmail }}</code
            >
            {{ t('auth.forgot.neutralSuffix') }}
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

    <!-- Back to Login -->
    <Button
      variant="ghost"
      :class="cn('w-full h-11 font-emphasis text-muted-foreground')"
      @click="router.push({ name: RouteNames.LOGIN })"
      style="font-feature-settings: 'cv01', 'ss03'"
    >
      {{ t('auth.common.backToSignIn') }}
    </Button>
  </div>
</template>
