<script setup lang="ts">
import { useRouter } from 'vue-router'
import { MailOpen } from '@lucide/vue'
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
          We've sent a password reset link to your email address.
        </p>
        <p
          class="text-base text-muted-foreground dark:text-muted-foreground"
          style="font-feature-settings: 'cv01', 'ss03'"
        >
          Click the link to reset your password.
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
        @click="router.push({ name: RouteNames.FORGOT_PASSWORD })"
        style="font-feature-settings: 'cv01', 'ss03'"
      >
        Try another email
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
</template>
