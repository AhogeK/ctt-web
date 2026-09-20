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
 *
 * Sticky offset contract: the header's height lives in exactly one place,
 * `--marketing-header-height` (set on the shell below, consumed by `h-[var(...)]`).
 * Any element that must stick *under* this bar reads that variable —
 * `sticky top-[var(--marketing-header-height)]` — instead of hard-coding a pixel
 * offset. Reference sites legitimately use values like `top-[65px]`; that number is
 * *their* header, not ours, and copying it is how two bars overlap.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import ErrorBoundary from '@/components/app/ErrorBoundary.vue'
import ThemeToggle from '@/components/app/ThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'
import { RouteNames } from '@/router/route-names'
import { ECOSYSTEM_REPOS } from '@/lib/site-links'

/** The current year for the copyright line — evaluated once, not per render. */
const currentYear = new Date().getFullYear()

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
  <div class="[--marketing-header-height:3.5rem] flex min-h-screen flex-col bg-background text-foreground">
    <header class="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div
        class="mx-auto flex h-[var(--marketing-header-height)] w-full max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6"
      >
        <RouterLink
          :to="{ name: RouteNames.LANDING }"
          class="text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Code Time Tracker
        </RouterLink>

        <nav class="flex items-center gap-1 sm:gap-2">
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
      <div class="mx-auto w-full max-w-[1200px] px-4 py-10 text-sm text-muted-foreground sm:px-6">
        <!-- The ecosystem is more than one repository: listing them answers "what
             is this made of", which a single link to this dashboard cannot. -->
        <ul class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8">
          <li v-for="repo in ECOSYSTEM_REPOS" :key="repo.url">
            <a
              :href="repo.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group inline-flex items-center gap-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon icon="mdi:github" class="size-4 shrink-0" />
              <span class="font-medium text-foreground/90 group-hover:text-foreground">{{ repo.name }}</span>
              <span class="hidden text-muted-foreground lg:inline">— {{ repo.role }}</span>
            </a>
          </li>
        </ul>

        <div class="mt-6 border-t border-border/60 pt-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <p>Open source under the MIT license — deploy it yourself, or use the hosted sync service.</p>
          <!-- No "All rights reserved": MIT already grants those rights to everyone. -->
          <p class="mt-2 shrink-0 sm:mt-0">© {{ currentYear }} AhogeK</p>
        </div>
      </div>
    </footer>
  </div>
</template>
