<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MailOpen, AlertCircle, Copy, Check } from '@lucide/vue'
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
  <div class="mx-auto w-full max-w-sm space-y-10">
    <!-- Error State: No email in query -->
    <div v-if="!email" class="space-y-6">
      <div
        :class="
          cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl',
            'bg-destructive/10 text-destructive dark:bg-destructive/15',
          )
        "
      >
        <AlertCircle class="h-8 w-8" />
      </div>
      <div class="space-y-3">
        <h1
          class="text-2xl font-emphasis text-foreground dark:text-foreground sm:text-3xl"
          style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
        >
          Registration data lost
        </h1>
        <p
          class="text-base text-muted-foreground dark:text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          Your registration information was not preserved. Please try registering again.
        </p>
      </div>
      <Button
        :class="
          cn(
            'w-full h-11 rounded-md font-emphasis',
            'bg-primary text-white hover:bg-primary/90',
            'dark:bg-primary dark:hover:bg-primary/80',
          )
        "
        @click="router.push({ name: RouteNames.REGISTER })"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Go to registration
      </Button>
    </div>

    <!-- Success State: Email available -->
    <div v-else class="space-y-10">
      <!-- Success Icon -->
      <div
        :class="
          cn('flex h-16 w-16 items-center justify-center rounded-2xl', 'bg-primary/10 text-primary dark:bg-primary/15')
        "
      >
        <MailOpen class="h-8 w-8 animate-pulse" />
      </div>

      <!-- Content -->
      <div class="space-y-3">
        <h1
          class="text-2xl font-emphasis text-foreground dark:text-foreground sm:text-3xl"
          style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
        >
          Check your email
        </h1>
        <div class="space-y-2">
          <p
            class="text-base text-muted-foreground dark:text-muted-foreground"
            style="font-feature-settings: 'cv01', 'ss03'"
          >
            We've sent a verification link to
          </p>
          <div class="flex items-center gap-2">
            <p
              class="text-base font-emphasis text-foreground dark:text-foreground whitespace-nowrap"
              style="font-feature-settings: 'cv01', 'ss03'"
              :title="email"
            >
              {{ truncatedEmail }}
            </p>
            <button
              type="button"
              :class="
                cn(
                  'flex h-7 w-7 cursor-pointer shrink-0 items-center justify-center rounded-md',
                  'text-muted-foreground hover:text-foreground/80',
                  'dark:text-muted-foreground dark:hover:text-secondary-foreground',
                  'transition-colors duration-200',
                )
              "
              @click="handleCopyEmail"
            >
              <Check v-if="copied" class="h-3.5 w-3.5" />
              <Copy v-else class="h-3.5 w-3.5" />
            </button>
          </div>
          <p
            class="text-base text-muted-foreground dark:text-muted-foreground"
            style="font-feature-settings: 'cv01', 'ss03'"
          >
            Click the link to activate your account.
          </p>
        </div>
      </div>

      <!-- Resend Section -->
      <div
        :class="
          cn(
            'flex flex-col gap-3 rounded-xl border border-border',
            'bg-muted/80 p-5 backdrop-blur-sm',
            'dark:border-white/8 dark:bg-white/3 dark:backdrop-blur-md',
          )
        "
      >
        <p
          class="text-sm font-emphasis text-foreground/90 dark:text-secondary-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          Didn't receive the email?
        </p>
        <button
          :class="
            cn(
              'w-full h-11 cursor-pointer rounded-md border border-border bg-white font-emphasis text-foreground/90 shadow-xs',
              'transition-[border-color,color] duration-200 hover:border-primary hover:text-primary',
              'dark:border-white/8 dark:bg-input/30 dark:text-secondary-foreground',
              'dark:hover:border-primary/50 dark:hover:bg-input/50 dark:hover:text-primary',
            )
          "
          :disabled="countdown > 0 || isPending"
          @click="handleResend"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          {{ countdown > 0 ? `Resend in ${countdown}s` : 'Resend verification email' }}
        </button>
      </div>

      <!-- Back to Login -->
      <Button
        variant="ghost"
        :class="cn('w-full h-11 font-emphasis text-muted-foreground')"
        @click="router.push({ name: RouteNames.LOGIN })"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Back to sign in
      </Button>
    </div>
  </div>
</template>
