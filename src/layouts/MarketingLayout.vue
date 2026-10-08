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
import { ECOSYSTEM_REPOS, SUPPORT_CHANNELS } from '@/lib/site-links'
import SourceReposDialog from '@/components/app/SourceReposDialog.vue'
import LandingSection from '@/features/landing/components/LandingSection.vue'

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
  <div
    data-surface-scope="marketing"
    class="[--marketing-header-height:3.5rem] flex min-h-screen flex-col bg-background pt-[calc(var(--marketing-header-height)_+_1px)] text-foreground"
  >
    <!-- Fixed, not sticky: pinned by `sticky`, the bar's backdrop-filter pass is dropped as one unit
         for a few frames whenever the page repaints hard — the tint rides inside that pass, so text
         behind the bar flashed through at full strength (captured on screen). The fixed path ran the
         same stress without a single dropped frame. The shell's padding-top keeps the in-flow space
         the bar used to occupy, so nothing below it moves. -->
    <header class="fixed inset-x-0 top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div
        class="mx-auto flex h-[var(--marketing-header-height)] w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6"
      >
        <RouterLink
          :to="{ name: RouteNames.LANDING }"
          class="text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Code Time Tracker
        </RouterLink>

        <nav class="flex items-center gap-1 sm:gap-2">
          <!-- The source shortcut. Every source entry on the page — this one and the hero's secondary
               call to action — opens the same dialog, which answers "which repository" with one line
               per repo instead of picking one. The anchor keeps working as the footer catalogue's
               address when JavaScript is not running. -->
          <SourceReposDialog>
            <Button as-child variant="ghost" size="icon-sm">
              <a
                href="#source"
                aria-label="Source repositories"
                title="Source repositories"
                data-testid="marketing-source"
                @click.prevent
              >
                <Icon icon="mdi:github" class="size-[18px]" />
              </a>
            </Button>
          </SourceReposDialog>
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

    <!-- The footer deliberately carries no reveal state: it is the page's last block, so an animated
         entrance would only be one more thing to scroll past — it moves with the page like ordinary
         content. It shares the shell's box and rail — the same 1440px recipe as the top bar and the
         bands — so its text starts on the same left edge as everything above it. -->
    <LandingSection as="footer" spacing="none" class="border-t border-border/60 py-10">
      <div class="text-sm text-muted-foreground">
        <!-- The ecosystem is more than one repository: listing them answers "what
             is this made of", which a single link to this dashboard cannot. The `#source` anchor
             itself lives on the landing page's open-source block; this list stays as the footer's
             own catalogue. -->
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
          <div>
            <p>Free and open source — deploy it yourself.</p>
            <p class="mt-2">
              Support the project:
              <template v-for="(channel, index) in SUPPORT_CHANNELS" :key="channel.id">
                <a
                  :href="channel.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="rounded-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >{{ channel.label }}</a
                ><span v-if="index < SUPPORT_CHANNELS.length - 1" aria-hidden="true"> · </span>
              </template>
            </p>
          </div>
          <!-- No "All rights reserved": MIT already grants those rights to everyone. -->
          <p class="mt-2 shrink-0 sm:mt-0">© {{ currentYear }} AhogeK</p>
        </div>
      </div>
    </LandingSection>
  </div>
</template>
