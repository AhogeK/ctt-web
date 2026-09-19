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

const SOURCE_URL = 'https://github.com/AhogeK/ctt-web'

/**
 * The plugin's Marketplace listing, verified against the Marketplace API
 * (`plugins.jetbrains.com/api/searchPlugins?search=Code Time Tracker` →
 * xmlId `com.ahogek.code-time-tracker`). The IDE plugin is the product; this
 * page is its companion.
 */
const PLUGIN_URL = 'https://plugins.jetbrains.com/plugin/29379'
</script>

<template>
  <section class="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28">
    <p class="text-sm font-medium text-primary">Code Time Tracker</p>

    <h1 class="mt-4 max-w-3xl text-4xl leading-[1.08] font-semibold tracking-[-0.022em] sm:text-6xl sm:leading-[1.05]">
      Know where your coding time actually goes.
    </h1>

    <p class="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
      Track time by language, project and IDE from your JetBrains IDE — then read it back in a dashboard you own. Open
      source, and self-hostable if you would rather keep the data on your own server.
    </p>

    <div class="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Button as-child size="lg">
        <a :href="PLUGIN_URL" target="_blank" rel="noopener noreferrer" data-testid="landing-primary-cta">
          Install the plugin
        </a>
      </Button>
      <Button as-child size="lg" variant="outline">
        <a :href="SOURCE_URL" target="_blank" rel="noopener noreferrer">View source</a>
      </Button>
    </div>
  </section>
</template>
