<script setup lang="ts">
/**
 * MarketingLayout - public shell for the marketing surface.
 *
 * Top bar + content + footer. Deliberately **not** AppLayout: a visitor has no
 * account state to show, so there is no sidebar and no user menu.
 *
 * There is exactly **one** account entry, and it reads auth state:
 *
 * - signed out → sign in. Sign-in, not sign-up: the product has no signup wall,
 *   so the likeliest visitor is an existing plugin user — and the login page
 *   carries both GitHub OAuth and a "Create account" link, so a new visitor
 *   still reaches registration in one more click. One entry serves both.
 * - signed in  → the dashboard, because the page has nothing left to sell them
 *
 * Error Handling: content sits inside ErrorBoundary so a failing view still
 * leaves the shell (and the way back) intact — same contract as AppLayout.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import ErrorBoundary from '@/components/app/ErrorBoundary.vue'
import ThemeToggle from '@/components/app/ThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'
import { RouteNames } from '@/router/route-names'

const SOURCE_URL = 'https://github.com/AhogeK/ctt-web'

const authStore = useAuthStore()

/**
 * The top-bar call to action. Authenticated visitors are already customers of
 * the free product, so the register link would be a dead end for them.
 */
const cta = computed(() =>
  authStore.isAuthenticated
    ? { to: { name: RouteNames.DASHBOARD }, label: 'Open dashboard' }
    : { to: { name: RouteNames.LOGIN }, label: 'Sign in' },
)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <header class="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div class="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
        <RouterLink
          :to="{ name: RouteNames.LANDING }"
          class="text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Code Time Tracker
        </RouterLink>

        <nav class="flex items-center gap-1 sm:gap-2">
          <a
            :href="SOURCE_URL"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="marketing-source-link"
            class="hidden rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
          >
            Source
          </a>
          <ThemeToggle />
          <Button as-child size="sm">
            <RouterLink :to="cta.to" data-testid="marketing-cta">{{ cta.label }}</RouterLink>
          </Button>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <ErrorBoundary>
        <router-view />
      </ErrorBoundary>
    </main>

    <footer class="border-t border-border/60">
      <div
        class="mx-auto flex w-full max-w-[1200px] flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <p>Open source under the MIT license — deploy it yourself, or use the hosted sync service.</p>
        <a
          :href="SOURCE_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          github.com/AhogeK/ctt-web
        </a>
      </div>
    </footer>
  </div>
</template>
