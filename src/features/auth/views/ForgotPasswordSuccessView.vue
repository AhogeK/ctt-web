<script setup lang="ts">
import { useRouter } from 'vue-router'
import { MailOpen } from 'lucide-vue-next'
import { RouteNames } from '@/router/route-names'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const router = useRouter()
</script>

<template>
  <div class="mx-auto w-full max-w-sm space-y-10">
    <!-- Success Icon -->
    <div
      :class="
        cn(
          'flex h-16 w-16 items-center justify-center rounded-2xl',
          'bg-[#5e6ad2]/10 text-[#5e6ad2] dark:bg-[#5e6ad2]/15',
        )
      "
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
      <div class="space-y-2">
        <p class="text-base text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
          We've sent a password reset link to your email address.
        </p>
        <p class="text-base text-gray-500 dark:text-[#8a8f98]" style="font-feature-settings: 'cv01', 'ss03'">
          Click the link to reset your password.
        </p>
      </div>
    </div>

    <!-- Resend Section -->
    <div
      :class="
        cn(
          'flex flex-col gap-3 rounded-xl border border-[#d0d6e0]',
          'bg-[#e5e7eb]/80 p-5 backdrop-blur-sm',
          'dark:border-white/8 dark:bg-white/3 dark:backdrop-blur-md',
        )
      "
    >
      <p class="text-sm font-[510] text-gray-700 dark:text-[#d0d6e0]" style="font-feature-settings: 'cv01', 'ss03'">
        Didn't receive the email?
      </p>
      <button
        :class="
          cn(
            'w-full h-11 cursor-pointer rounded-md border border-[#d0d6e0] bg-white font-[510] text-gray-700 shadow-xs',
            'transition-all duration-200 hover:border-[#5e6ad2] hover:text-[#5e6ad2]',
            'dark:border-white/8 dark:bg-input/30 dark:text-[#d0d6e0]',
            'dark:hover:border-[#5e6ad2]/50 dark:hover:bg-input/50 dark:hover:text-[#5e6ad2]',
          )
        "
        @click="router.push({ name: RouteNames.FORGOT_PASSWORD })"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Try another email
      </button>
    </div>

    <!-- Back to Login -->
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
