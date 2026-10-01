<script setup lang="ts">
/**
 * LandingView — the public front door, now a **staged** page.
 *
 * The hero is not a band that scrolls away; it is the first **beat** of a pinned stage. The visitor
 * scrolls, the first beat leaves upward, and the next one rises from below the fold to the centre —
 * becoming the new hero in place — and holds there until the one after it arrives. That is the
 * mechanism the user asked for ("以 hero 页为中心，滚动时下面的内容会上来也来到中心成为新的 hero 页内容"),
 * and it is the blog's own maths: each layer's translateY runs in viewport units from 120 to 50, with
 * `-50%` of its own height cancelling out, so "50" means *centred*. See `main.css` for the keyframes
 * and the two guards (no scroll-timeline support, or reduced motion, and the beats are ordinary
 * sections in normal flow — nothing is hidden behind a stage that cannot move).
 *
 * The hero's own content is unchanged: the copy column, the product plane that tucks under it, the two
 * calls to action. What changed is the box it lives in.
 */
import { Button } from '@/components/ui/button'
import { SITE_REPO_URL, PLUGIN_INSTALL_URL } from '@/lib/site-links'
import LandingHeroPreview from '../components/LandingHeroPreview.vue'
import LandingSection from '../components/LandingSection.vue'
import LandingActivityBeat from '../components/LandingActivityBeat.vue'
</script>

<template>
  <section class="stage relative w-full">
    <div class="stage-pin flex items-center">
      <!-- Beat 1 — the hero. -->
      <div class="beat beat-hero w-full" data-testid="landing-beat-hero">
        <div class="mx-auto flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-6 lg:pt-12 lg:pb-20">
          <!-- Copy column. 42rem is the measure the user's screenshot shows for the two-line headline. -->
          <div class="hero-copy min-w-0 lg:max-w-[42rem]">
            <h1 class="hero-rise text-display-lg">Know where your coding time actually goes.</h1>

            <p
              class="hero-fade-rise mt-6 max-w-[22rem] text-base text-muted-foreground [animation-delay:70ms] sm:text-lg"
            >
              Track time by language, project and IDE from your JetBrains IDE — then read it back in a dashboard you
              own. Open source, and self-hostable if you would rather keep the data on your own server.
            </p>

            <div class="hero-fade-rise mt-10 flex flex-col gap-3 [animation-delay:140ms] sm:flex-row sm:items-center">
              <Button as-child size="lg">
                <a
                  :href="PLUGIN_INSTALL_URL"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="landing-primary-cta"
                >
                  Install the plugin
                </a>
              </Button>
              <Button as-child size="lg" variant="outline">
                <a :href="SITE_REPO_URL" target="_blank" rel="noopener noreferrer">View source</a>
              </Button>
            </div>
          </div>

          <!-- Product plane: right of the copy and pulled up into its band, so its top-left corner tucks
               under the copy's lower half. The content container is 1440px wide (Vue's own hero uses that
               cap), and the plane takes 54% of it. -->
          <div class="hero-fade-rise mt-12 min-w-0 lg:-mt-[7rem] lg:ml-[34%] lg:w-[54%] [animation-delay:210ms]">
            <LandingHeroPreview />
          </div>
        </div>
      </div>

      <!-- Beat 2 — the arriving artefact, and the last beat: it holds the centre to the end of the
           track, because there is nothing after it to make room for. -->
      <div class="beat beat-a w-full" data-testid="landing-beat-activity">
        <LandingSection><LandingActivityBeat /></LandingSection>
      </div>
    </div>
  </section>
</template>
