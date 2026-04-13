<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MailOpen } from 'lucide-vue-next'
import { RouteNames } from '@/router/route-names'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useResendVerification } from '../composables/useResendVerification'

const router = useRouter()
const { resend, countdown, isPending } = useResendVerification()
const resendEmail = ref('')

const handleResend = () => {
  if (resendEmail.value.trim()) {
    resend(resendEmail.value.trim())
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-sm space-y-8">
    <!-- Success Icon -->
    <div
      class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5e6ad2]/10 text-[#5e6ad2] dark:bg-[#5e6ad2]/15"
    >
      <MailOpen class="h-8 w-8 animate-pulse" />
    </div>

    <!-- Content -->
    <div class="space-y-3">
      <h1
        class="text-2xl font-[510] text-gray-900 dark:text-[#f7f8f8] sm:text-3xl"
        style="font-feature-settings: 'cv01', 'ss03'; letter-spacing: -0.704px"
      >
        Check your email
      </h1>
      <p
        class="text-base text-gray-500 dark:text-[#8a8f98]"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        We've sent a verification link to your inbox. Click the link to activate your account.
      </p>
    </div>

    <!-- Resend Section -->
    <div
      class="rounded-xl border border-[#d0d6e0] bg-[#f3f4f5]/60 p-5 space-y-4 backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:backdrop-blur-md"
    >
      <p
        class="text-sm font-[510] text-gray-700 dark:text-[#d0d6e0]"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Didn't receive the email?
      </p>
      <Input
        v-model="resendEmail"
        type="email"
        placeholder="Enter your email address"
        class="h-11 rounded-md border border-[#d0d6e0] bg-white text-[#1a1a2e] placeholder:text-[#8a8f98] transition-all duration-200 focus:border-[#5e6ad2] focus:ring-2 focus:ring-[#5e6ad2]/20 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-[#f7f8f8] dark:placeholder:text-[#62666d] dark:focus:border-[#5e6ad2] dark:focus:bg-white/[0.04] dark:focus:ring-[#5e6ad2]/25"
      />
      <Button
        variant="outline"
        class="w-full h-11 rounded-md border border-[#d0d6e0] font-[510] text-gray-700 transition-all duration-200 hover:bg-[#f3f4f5] hover:border-[#5e6ad2]/50 dark:border-white/[0.08] dark:text-[#d0d6e0] dark:hover:bg-white/[0.05] dark:hover:border-[#5e6ad2]/50"
        :disabled="countdown > 0 || isPending || !resendEmail.trim()"
        @click="handleResend"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        {{ countdown > 0 ? `Resend in ${countdown}s` : 'Resend verification email' }}
      </Button>
    </div>

    <!-- Back to Login -->
    <Button
      variant="ghost"
      class="w-full h-11 rounded-md font-[510] text-gray-600 transition-all duration-200 hover:bg-[#f3f4f5] hover:text-gray-900 dark:text-[#8a8f98] dark:hover:bg-white/[0.05] dark:hover:text-[#f7f8f8]"
      @click="router.push({ name: RouteNames.LOGIN })"
      style="font-feature-settings: 'cv01', 'ss03'"
    >
      Back to sign in
    </Button>
  </div>
</template>
