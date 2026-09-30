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
 * Layout, restored from the user's own screenshot of the version they wanted: the copy column on the
 * left, the product plane to its right and pulled up so its top-left corner tucks under the copy's
 * lower half, and the session panel floating over the plane's top-right. That overlap is deliberate —
 * it is what makes the two read as one composition — but it also means the panel's box must clear the
 * call-to-action row, which sits at the bottom of the copy column. An earlier centred variant broke
 * exactly that: centring moved the CTAs under the panel.
 *
 * No eyebrow: it repeated the product name the top bar already carries (2026-09-29). No transform
 * anywhere in the hero either — a perspective rescale is what made the cards read as blurry, and two
 * cards at different angles read as a skew; depth comes from overlap and the shadows DESIGN.md owns.
 *
 * Typography follows the measured baseline (display weight <=600, tight
 * leading, letter-spacing = size x -0.022em).
 */
import { Button } from '@/components/ui/button'
import { SITE_REPO_URL, PLUGIN_INSTALL_URL } from '@/lib/site-links'
import LandingHeroPreview from '../components/LandingHeroPreview.vue'
import LandingProofSection from '../components/LandingProofSection.vue'
</script>

<template>
  <section class="hero-handoff relative w-full">
    <div class="hero-viewport mx-auto flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-6 lg:pt-12 lg:pb-20">
      <!-- Copy column. 42rem is the measure the user's screenshot shows for the two-line headline. -->
      <div class="min-w-0 lg:max-w-[42rem]">
        <h1 class="hero-rise text-display-lg">Know where your coding time actually goes.</h1>

        <p class="hero-fade-rise mt-6 max-w-[22rem] text-base text-muted-foreground [animation-delay:70ms] sm:text-lg">
          Track time by language, project and IDE from your JetBrains IDE — then read it back in a dashboard you own.
          Open source, and self-hostable if you would rather keep the data on your own server.
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
      </div>

      <!-- Product plane: right of the copy and pulled up into its band, so its top-left corner tucks
           under the copy's lower half. The content container is 1440px wide (Vue's own hero uses that cap),
           and the plane takes 54% of it: at 48% the narrower face truncated too much of the demo's own
           text, so it sits between that and the widest it has ever been (68% of the old 1152 box). -->
      <div class="hero-fade-rise mt-12 min-w-0 lg:-mt-[7rem] lg:ml-[34%] lg:w-[54%] [animation-delay:210ms]">
        <LandingHeroPreview />
      </div>
    </div>
  </section>

  <LandingProofSection />
</template>
