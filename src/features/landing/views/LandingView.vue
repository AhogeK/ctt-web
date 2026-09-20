<script setup lang="ts">
/**
 * LandingView - the public front door.
 *
 * This stage ships the entry and routing shell only: the positioning line and
 * the two calls to action. The capability walkthrough, the open-source block
 * and the pricing structure are separate stages of the plan — they are not
 * stubbed here, because placeholder copy would read as a decision that has not
 * been made.
 *
 * The hero action is **the product itself**, not an account form. This plugin is
 * where the data comes from, and the marketplace page is one click from running
 * it — a far lower-friction first step than any credential form. Account entry
 * is the top bar's job (`Sign in`), which keeps the two roles distinct: the hero
 * says "get the product", the bar says "you already have one".
 *
 * Typography follows the measured baseline (display weight <=600, tight
 * leading, letter-spacing = size x -0.022em).
 */
import { Button } from '@/components/ui/button'
import { SITE_REPO_URL, PLUGIN_INSTALL_URL } from '@/lib/site-links'
</script>

<template>
  <section class="hero-handoff mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28">
    <p class="hero-fade-rise text-sm font-medium text-primary">Code Time Tracker</p>

    <h1 class="hero-rise mt-4 max-w-3xl text-display-lg">Know where your coding time actually goes.</h1>

    <p class="hero-fade-rise mt-6 max-w-xl text-base text-muted-foreground [animation-delay:70ms] sm:text-lg">
      Track time by language, project and IDE from your JetBrains IDE — then read it back in a dashboard you own. Open
      source, and self-hostable if you would rather keep the data on your own server.
    </p>

    <div class="hero-fade-rise mt-10 flex flex-col gap-3 [animation-delay:140ms] sm:flex-row sm:items-center">
      <Button as-child size="lg">
        <a :href="PLUGIN_INSTALL_URL" target="_blank" rel="noopener noreferrer" data-testid="landing-primary-cta">
          Install the plugin
        </a>
      </Button>
      <Button as-child size="lg" variant="outline">
        <a :href="SITE_REPO_URL" target="_blank" rel="noopener noreferrer">View source</a>
      </Button>
    </div>
  </section>
</template>
