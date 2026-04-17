<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MailOpen, AlertCircle, Copy, Check } from 'lucide-vue-next'
import { useClipboard, useSessionStorage } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { RouteNames } from '@/router/route-names'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useResendVerification } from '../composables/useResendVerification'
import { SESSION_STORAGE_KEYS } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const { resend, countdown, isPending } = useResendVerification()

// Read email from sessionStorage first, fall back to query param
const pendingEmail = useSessionStorage<string>(SESSION_STORAGE_KEYS.PENDING_VERIFICATION_EMAIL, null)
const email = pendingEmail.value || (route.query.email as string | undefined)

// Clear sessionStorage on unmount to prevent stale data
onUnmounted(() => {
  pendingEmail.value = null
})

// Truncate long emails for display (>30 chars), keep domain visible
const truncatedEmail = computed(() => {
  if (!email) return ''
  if (email.length <= 30) return email
  const atIndex = email.indexOf('@')
  if (atIndex === -1) return email
  const localPart = email.slice(0, atIndex)
  const domain = email.slice(atIndex)
  return `${localPart.slice(0, 15)}...${domain}`
})

// VueUse useClipboard requires a source ref for copied state to auto-update
const emailRef = computed(() => email || '')
const { copied, copy } = useClipboard({ source: emailRef })
const handleCopyEmail = () => {
  copy()
  toast.success('Email address copied!')
}

const handleResend = () => {
  if (email) {
    resend(email)
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-sm">
    <!-- Error State: No email in query -->
    <div v-if="!email" class="space-y-6">
      <div
        :class="
          cn(
            'mb-8 flex h-16 w-16 items-center justify-center rounded-2xl',
            'bg-red-500/10 text-red-500 dark:bg-red-500/15',
          )
        "
      >
        <AlertCircle class="h-8 w-8" />
      </div>
      <div class="space-y-3">
        <h1
          class="text-2xl font-[510] text-gray-900 dark:text-[#f7f8f8] sm:text-3xl"
          style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
        >
          Registration data lost
        </h1>
        <p class="text-base text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
          Your registration information was not preserved. Please try registering again.
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
        @click="router.push({ name: RouteNames.REGISTER })"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Go to registration
      </Button>
    </div>

    <!-- Success State: Email available -->
    <div v-else>
      <!-- Success Icon -->
      <div
        :class="
          cn(
            'mb-8 flex h-16 w-16 items-center justify-center rounded-2xl',
            'bg-[#5e6ad2]/10 text-[#5e6ad2] dark:bg-[#5e6ad2]/15',
          )
        "
      >
        <MailOpen class="h-8 w-8 animate-pulse" />
      </div>

      <!-- Content -->
      <div class="mb-10 space-y-3">
        <h1
          class="text-2xl font-[510] text-gray-900 dark:text-[#f7f8f8] sm:text-3xl"
          style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
        >
          Check your email
        </h1>
        <div class="space-y-2">
          <p class="text-base text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
            We've sent a verification link to
          </p>
          <div class="flex items-center gap-2">
            <p
              class="text-base font-[510] text-gray-900 dark:text-[#f7f8f8] whitespace-nowrap"
              style="font-feature-settings: 'cv01', 'ss03'"
              :title="email"
            >
              {{ truncatedEmail }}
            </p>
            <button
              type="button"
              :class="
                cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                  'text-gray-400 hover:text-gray-600',
                  'dark:text-[#62666d] dark:hover:text-[#d0d6e0]',
                  'transition-colors duration-200',
                )
              "
              @click="handleCopyEmail"
            >
              <Check v-if="copied" class="h-3.5 w-3.5" />
              <Copy v-else class="h-3.5 w-3.5" />
            </button>
          </div>
          <p class="text-base text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
            Click the link to activate your account.
          </p>
        </div>
      </div>

      <!-- Resend Section -->
      <div
        :class="
          cn(
            'mb-6 flex flex-col gap-3 rounded-xl border border-[#d0d6e0]',
            'bg-[#f3f4f5]/60 p-5 backdrop-blur-sm',
            'dark:border-white/8 dark:bg-white/3 dark:backdrop-blur-md',
          )
        "
      >
        <p
          class="mb-1 text-sm font-[510] text-gray-700 dark:text-[#d0d6e0]"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          Didn't receive the email?
        </p>
        <Button
          :class="
            cn(
              'w-full h-11 rounded-md border border-[#d0d6e0] font-[510] text-gray-700',
              'transition-all duration-200 hover:bg-[#f3f4f5] hover:border-[#5e6ad2]/50',
              'dark:border-white/8 dark:text-[#d0d6e0]',
              'dark:hover:bg-white/5 dark:hover:border-[#5e6ad2]/50',
            )
          "
          variant="outline"
          :disabled="countdown > 0 || isPending"
          @click="handleResend"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          {{ countdown > 0 ? `Resend in ${countdown}s` : 'Resend verification email' }}
        </Button>
      </div>

      <!-- Back to Login -->
      <Button
        variant="ghost"
        :class="
          cn(
            'mt-6 w-full h-11 rounded-md font-[510] text-gray-600',
            'transition-all duration-200 hover:bg-[#f3f4f5] hover:text-gray-900',
            'dark:text-[#8a8f98] dark:hover:bg-white/5 dark:hover:text-[#f7f8f8]',
          )
        "
        @click="router.push({ name: RouteNames.LOGIN })"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Back to sign in
      </Button>
    </div>
  </div>
</template>
