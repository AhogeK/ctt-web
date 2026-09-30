<script setup lang="ts">
/**
 * LandingProofSection — the evidence that sits directly under the hero.
 *
 * The research rule this follows is "stack proof early": a visitor should hit the product's own
 * artefacts before any capability list, because a claim of features is cheap and a rendered artefact
 * is not. ctt has no customer logos to borrow, so the proof *is* the product: the dashboard's own
 * components, fed by labelled example data.
 *
 * Two fragments, each one real component and one line of explanation — a screenshot without a caption
 * is the single most common way a developer-tool page fails, so the caption is part of the deliverable
 * rather than decoration:
 *
 * 1. the **full six-card summary row** (the hero shows three of them, so the set is new information
 *    here, not a repeat), and
 * 2. the **trophy cabinet**, three ladders of it.
 *
 * Both render the same components the product renders — `SummaryStatGrid` and `TrophyCard` — over
 * `demo-data.ts`, which derives its numbers from the dashboard's own models so the two surfaces cannot
 * drift apart. Nothing here sends a request: neither component holds a query.
 *
 * Headings are `h2`, one step below the hero's `h1`: these are bands of the same page, not competing
 * titles. Type sizes come from the `@theme` ladder P2 registered (`--text-heading-2`), never from a
 * fresh value.
 */
import { computed } from 'vue'
import LandingSection from './LandingSection.vue'
import SummaryStatGrid from '@/features/dashboard/components/SummaryStatGrid.vue'
import { SUMMARY_STAT_FIELDS, type SummaryStatItem } from '@/features/dashboard/components/summary-stat-fields'
import TrophyCard from '@/features/achievements/components/TrophyCard.vue'
import { EXAMPLE_DATA_BADGE, EXAMPLE_TROPHIES, EXAMPLE_SUMMARY_SECONDS } from '../demo-data'

/** All six fields, in the dashboard's own order — the hero deliberately shows only three. */
const summaryItems = computed<SummaryStatItem[]>(() =>
  SUMMARY_STAT_FIELDS.map((field) => ({
    label: field.label,
    icon: field.icon,
    seconds: EXAMPLE_SUMMARY_SECONDS[field.key],
  })),
)
</script>

<template>
  <LandingSection data-testid="landing-proof">
    <div class="flex flex-col gap-14 md:gap-20">
      <!-- Fragment 1: the complete summary row. -->
      <article data-testid="landing-proof-summary" class="flex flex-col gap-5">
        <header class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="text-heading-2">Every period, on one row</h2>
            <span
              class="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted-foreground"
            >
              {{ EXAMPLE_DATA_BADGE }}
            </span>
          </div>
          <p class="max-w-[46rem] text-sm text-muted-foreground" data-testid="landing-proof-summary-caption">
            Today, the daily average, this week, month, year and all time — the dashboard's own summary component,
            rendered here with sample figures.
          </p>
        </header>
        <SummaryStatGrid :items="summaryItems" />
      </article>

      <!-- Fragment 2: the trophy cabinet. -->
      <article data-testid="landing-proof-trophies" class="flex flex-col gap-5">
        <header class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="text-heading-2">Ladders that fill as you keep going</h2>
            <span
              class="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted-foreground"
            >
              {{ EXAMPLE_DATA_BADGE }}
            </span>
          </div>
          <p class="max-w-[46rem] text-sm text-muted-foreground" data-testid="landing-proof-trophies-caption">
            Each achievement is a ladder rather than a single badge: the whole shape is visible, a finished one gains a
            ring, and resetting ladders report how many periods they have been reached in.
          </p>
        </header>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <TrophyCard v-for="trophy in EXAMPLE_TROPHIES" :key="trophy.key" :trophy="trophy" />
        </div>
      </article>
    </div>
  </LandingSection>
</template>
