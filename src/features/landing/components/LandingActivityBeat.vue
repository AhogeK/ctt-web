<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/**
 * The year beat — the one arriving stage beat after the hero.
 *
 * The grid and the ladders are **one thought, not two**: both answer "what have I built up", the days
 * on the left, the ladders those days feed underneath. Held apart, the same idea spreads across two stage screens and reads as repetition.
 *
 * Layout follows what the reference product pages measure: the artefact spans the
 * container and the copy stays to one or two lines. A year of cells at 15px is ~950px, so it fills the
 * row rather than floating in the middle of it — and cells that small-but-not-tiny is the difference
 * between a chart and a texture.
 *
 * The colour ladder is the **dashboard's own**: `<15m / 15–60m / 1–2h / 2–5h / 5–8h / >8h`. Using the
 * product's ladder instead of inventing one is what "the product's own language" means in practice.
 */
import LandingActivityGrid from './LandingActivityGrid.vue'
import TrophyCard from '@/features/achievements/components/TrophyCard.vue'
import { EXAMPLE_ACTIVITY_WEEKS, EXAMPLE_TROPHIES, exampleActivityWeeks, exampleDataBadge } from '../demo-data'

const weeks = exampleActivityWeeks()
const { t } = useI18n()
</script>

<template>
  <article class="beat-unit flex flex-col gap-10">
    <section class="flex flex-col gap-5">
      <header class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="text-heading-2">{{ t('landing.activity.yearTitle') }}</h2>
          <span
            class="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted-foreground"
          >
            {{ exampleDataBadge() }}
          </span>
        </div>
        <p class="max-w-[52rem] text-sm leading-relaxed text-muted-foreground">
          {{ t('landing.activity.yearBodyLead') }} {{ EXAMPLE_ACTIVITY_WEEKS }} {{ t('landing.activity.yearBodyTail') }}
        </p>
      </header>

      <LandingActivityGrid :weeks="weeks" />
    </section>

    <section class="flex flex-col gap-5">
      <header class="flex flex-col gap-2">
        <!-- A sibling heading, not a child: the year's grid and the ladders it feeds are two sections
             of the same beat, so they take the same level. An `h3` here was my own invention and it
             read as a hierarchy that does not exist (and, from the ladder's weights, as *bolder* than
             the heading above it). -->
        <h2 class="text-heading-2">{{ t('landing.activity.laddersTitle') }}</h2>
        <p class="max-w-[52rem] text-sm leading-relaxed text-muted-foreground">
          {{ t('landing.activity.laddersBody') }}
        </p>
      </header>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TrophyCard v-for="trophy in EXAMPLE_TROPHIES" :key="trophy.key" :trophy="trophy" />
      </div>
    </section>
  </article>
</template>
