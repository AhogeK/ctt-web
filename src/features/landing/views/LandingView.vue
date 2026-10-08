<script setup lang="ts">
/**
 * LandingView — the public front door, now a **staged** page.
 *
 * The hero is not a band that scrolls away; it is the first **beat** of a pinned stage. The visitor
 * scrolls, the first beat leaves upward, and the next one rises from below the fold to the centre —
 * becoming the new hero in place — and holds there until the one after it arrives. It is the
 * blog's own maths: each layer's translateY runs in viewport units from 120 to 50, with
 * `-50%` of its own height cancelling out, so "50" means *centred*. See `main.css` for the keyframes
 * and the two guards (no scroll-timeline support, or reduced motion, and the beats are ordinary
 * sections in normal flow — nothing is hidden behind a stage that cannot move).
 *
 * The hero's content is the copy column, the product plane that tucks under it and the two calls to
 * action; the stage only changes the box it lives in.
 *
 * Below the stage the page returns to ordinary bands — capabilities, the pipeline, the free band,
 * and the open-source block that carries the `#source` anchor the hero's "View source" falls back to.
 */
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { PLUGIN_INSTALL_URL } from '@/lib/site-links'
import SourceReposDialog from '@/components/app/SourceReposDialog.vue'
import LandingHeroPreview from '../components/LandingHeroPreview.vue'
import LandingSection from '../components/LandingSection.vue'
import LandingActivityBeat from '../components/LandingActivityBeat.vue'
import LandingCapabilities from '../components/LandingCapabilities.vue'
import LandingHowItWorks from '../components/LandingHowItWorks.vue'
import LandingFree from '../components/LandingFree.vue'
import LandingOpenSource from '../components/LandingOpenSource.vue'
import { useRevealOnScroll } from '../composables/useRevealOnScroll'
import { useScrollFade } from '../composables/useScrollFade'

const root = ref<HTMLElement | null>(null)
const heroFade = ref<HTMLElement | null>(null)
const beatFade = ref<HTMLElement | null>(null)
const firstBand = ref<{ el: HTMLElement | null } | null>(null)

// Phone pieces fade on a fixed clock rather than by scroll distance — see the composable.
useRevealOnScroll(root, [
  '.hero-copy',
  '[data-testid="hero-preview"]',
  '[data-testid="hero-recent-panel"]',
  '.beat-unit',
  '[data-reveal-band]',
])

// The stage screens' fades: fixed clocks that play at their scroll thresholds rather than fades
// scrubbed by the scroll. Two shared triggers make every hand-off a cross-fade instead of two blocks
// standing crisp side by side — the hero's exit and the year beat's entrance both fire at 60svh
// (their 900ms/600ms clocks run over each other), and the anchor band's entrance and the beat's
// dissolve both fire when that band's top crosses 60% of the viewport — one line, read live from the
// band's box, so the pairing holds whatever the layout or screen height does. The band is pulled up
// into the stage's dead tail so the line lands while the beat still fills the top of the screen. See
// the composable.
useScrollFade(heroFade, { leaveSvh: 60 })
useScrollFade(beatFade, { enterSvh: 60, leaveOnBand: firstBand })
useScrollFade(
  computed(() => firstBand.value?.el ?? null),
  { enterOnBand: firstBand },
)
</script>

<template>
  <div ref="root">
    <section class="stage relative w-full">
      <div class="stage-pin flex items-center">
        <!-- Beat 1 — the hero. Its exit dissolve is the same fixed clock as the year screen's
             (`data-scroll-fade`); the rise stays with the pinned choreography on the beat itself. -->
        <div class="beat beat-hero w-full" data-testid="landing-beat-hero">
          <div ref="heroFade" data-scroll-fade="in">
            <div class="mx-auto flex w-full max-w-[1440px] flex-col px-4 py-14 sm:px-6 lg:pt-12 lg:pb-20">
              <!-- Copy column. 42rem is the measure that keeps the headline to two lines. -->
              <div class="hero-copy min-w-0 lg:max-w-[42rem]">
                <h1 class="hero-rise text-display-lg">Know where your coding time actually goes.</h1>

                <p
                  class="hero-fade-rise mt-6 max-w-[22rem] text-base text-muted-foreground [animation-delay:70ms] sm:text-lg"
                >
                  Track time by language, project and IDE from your JetBrains IDE — then read it back in a dashboard you
                  own. Open source, and self-hostable if you would rather keep the data on your own server.
                </p>

                <div
                  class="hero-fade-rise mt-10 flex flex-col gap-3 [animation-delay:140ms] sm:flex-row sm:items-center"
                >
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
                  <SourceReposDialog>
                    <Button as-child size="lg" variant="outline">
                      <a href="#source" @click.prevent>View source</a>
                    </Button>
                  </SourceReposDialog>
                </div>
              </div>

              <!-- Product plane: right of the copy and pulled up into its band, so its top-left corner tucks
                   under the copy's lower half. The content container is 1440px wide (Vue's own hero uses that
                   cap), and the plane keeps its 54% width; the 42.2% offset is measured so that its *painted*
                   right edge (the projection spreads it about 35px past its layout box) lands on the
                   container's right edge instead of leaving a 12% gap. -->
              <div class="hero-fade-rise mt-12 min-w-0 lg:-mt-[7rem] lg:ml-[42.2%] lg:w-[54%] [animation-delay:210ms]">
                <LandingHeroPreview />
              </div>
            </div>
          </div>
        </div>

        <!-- Beat 2 — the arriving artefact: it enters on the hero's exit trigger (so the two cross),
             rises continuously into the centre, settles briefly, then hands off as the stage releases
             (its exit is the dissolve plus the page's own slide — no rise of its own). Its fades are
             the same fixed clocks the bands use (`data-scroll-fade`); the rise stays with the pinned
             choreography on the beat itself. -->
        <div class="beat beat-a w-full" data-testid="landing-beat-activity">
          <div ref="beatFade" data-scroll-fade="out">
            <LandingSection><LandingActivityBeat /></LandingSection>
          </div>
        </div>
      </div>
    </section>

    <!-- Below the stage the page returns to ordinary bands: what else the product does, how the data
         travels, the two ways to run it, and what "open source" means in practice. They sit outside
         the pinned track — the stage owns the scroll performance, these are simply read. -->
    <LandingSection
      ref="firstBand"
      data-band-anchor
      data-scroll-fade="out"
      data-testid="landing-capabilities"
      data-reveal-band
      spacing="sm"
    >
      <LandingCapabilities />
    </LandingSection>

    <LandingSection data-testid="landing-how-it-works" data-reveal-band>
      <LandingHowItWorks />
    </LandingSection>

    <!-- The free band: what the system costs and the two ways to run it. No figures live in the
         markup — the band renders the run-options module, so a copy change is a data edit. -->
    <LandingSection data-testid="landing-free" data-reveal-band>
      <LandingFree />
    </LandingSection>

    <!-- The `#source` destination: the hero's secondary action and the top bar's mark fall back here
         when JavaScript is off, and the footer's ecosystem list stays the page's own catalogue. -->
    <LandingSection id="source" data-testid="landing-open-source" class="scroll-mt-16" data-reveal-band>
      <LandingOpenSource />
    </LandingSection>
  </div>
</template>
