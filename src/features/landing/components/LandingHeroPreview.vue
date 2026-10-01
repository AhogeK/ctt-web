<script setup lang="ts">
/**
 * LandingHeroPreview — the hero's evidence that this is a real product.
 *
 * The product plane holds the dashboard's own summary row and the session log; the language ranking
 * floats over its top-right corner. Two statistics, two shapes — and the plane is tall enough to run
 * past the fold, which is what removes the empty band that used to sit under it. No image, no canvas — everything here
 * is text and inline SVG, so the heading stays the LCP element.
 *
 * Three things are deliberately NOT here: a tinted "stage" plate behind the window (it read as a rounded colour card, not as
 * depth), a violet floor glow under the window (it read as a glow pasted over a colour card), and a
 * bespoke two-part shadow on the window. Depth now comes from the composition itself — the copy's
 * detail column sharing the band — plus the card treatment `DESIGN.md` already owns.
 */
import { computed } from 'vue'
import SummaryStatGrid from '@/features/dashboard/components/SummaryStatGrid.vue'
import { SUMMARY_STAT_FIELDS, type SummaryStatItem } from '@/features/dashboard/components/summary-stat-fields'
import RankedDistributionList from '@/features/dashboard/components/RankedDistributionList.vue'
import RecentSessionsList from '@/features/dashboard/components/RecentSessionsList.vue'
import { useRankedDistribution } from '@/features/dashboard/composables/useRankedDistribution'
import {
  EXAMPLE_DATA_BADGE,
  EXAMPLE_DATA_NOTE,
  EXAMPLE_LANGUAGES,
  EXAMPLE_SUMMARY_SECONDS,
  exampleSessionGroups,
} from '../demo-data'

const items = computed<SummaryStatItem[]>(() =>
  SUMMARY_STAT_FIELDS.map((field) => ({
    label: field.label,
    icon: field.icon,
    seconds: EXAMPLE_SUMMARY_SECONDS[field.key],
  })),
)

const sessionGroups = computed(() => exampleSessionGroups())

const { rows } = useRankedDistribution(
  computed(() => EXAMPLE_LANGUAGES),
  { aggregateLabel: 'Others' },
)

/** Same shape the dashboard panels build, so the list's a11y description reads identically. */
const languagesLabel = computed(
  () =>
    `Language distribution, bar length is coding time: ${rows.value.map((r) => `${r.name} ${r.percent}%`).join(', ')}`,
)
</script>

<template>
  <div class="hero-plane relative">
    <!-- Product plane. -->
    <div
      data-testid="hero-preview"
      data-surface="card"
      class="w-full min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl dark:border-border"
    >
      <div class="flex items-center gap-1.5 border-b border-border/60 bg-muted/40 px-3 py-2">
        <span class="size-2 rounded-full bg-muted-foreground/30" />
        <span class="size-2 rounded-full bg-muted-foreground/20" />
        <span class="size-2 rounded-full bg-muted-foreground/20" />
        <span
          class="ml-2 shrink-0 whitespace-nowrap rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted-foreground"
        >
          {{ EXAMPLE_DATA_BADGE }}
        </span>
        <span class="ml-1 min-w-0 flex-1 truncate text-[11px] text-muted-foreground">dashboard</span>
      </div>

      <div class="flex min-w-0 flex-col gap-2.5 p-3">
        <p class="text-[11px] leading-relaxed text-muted-foreground">{{ EXAMPLE_DATA_NOTE }}</p>
        <SummaryStatGrid :items="items" />

        <div class="rounded-lg border border-border/50 p-3 dark:border-border/70">
          <p class="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/90">
            By language · all time
          </p>
          <RankedDistributionList :rows="rows" :a11y-label="languagesLabel" fold-noun="languages" />
        </div>
      </div>
    </div>

    <!-- Nearer plane: the ranking, floating over the plane's top-right corner. It shares the preview's
         perspective — one vanishing point for both surfaces is what the restored screenshot shows, and
         it is why the pair reads as one object at an angle rather than two rectangles. -->
    <div
      data-testid="hero-recent-panel"
      data-surface="card"
      class="hero-panel mt-5 rounded-xl border border-border/60 bg-card p-3 shadow-xl [animation-delay:440ms] dark:border-border lg:shadow-2xl"
    >
      <p class="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/90">Recent sessions</p>
      <RecentSessionsList :groups="sessionGroups" max-height-class="max-h-44" />
    </div>
  </div>
</template>
