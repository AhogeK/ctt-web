<script setup lang="ts">
/**
 * TrophyCard — one trophy: artwork, its ladder, and progress toward the next rung.
 *
 * Progress is shown as **distance to the next tier**, not to the current tier's
 * own target. The server reports one measured value per family, so a bar drawn
 * against the current tier's threshold would sit at 100% the moment it unlocked
 * and say nothing about the next goal.
 */
import { computed } from 'vue'
import { formatDateTime, formatDuration } from '@/lib/utils'
import TrophyMedal from './TrophyMedal.vue'
import type { Trophy } from '../composables/trophy-model'
import { tierProgress } from '../composables/trophy-model'

const props = defineProps<{
  /** The trophy to draw: its ladder, measured value and unit. */
  trophy: Trophy
}>()

/**
 * Grade for the artwork: how far up the ladder the reader is.
 *
 * Normalised across the trophy's own ladder so a 1-rung and a 3-rung trophy both
 * use the full range — otherwise every single-tier trophy would render at the
 * lowest grade even when earned.
 */
const grade = computed<0 | 1 | 2 | 3>(() => {
  if (props.trophy.earned === 0) return 0
  if (props.trophy.maxed) return 3
  // `completion` is the model's own earned/total ratio — consume it rather than
  // dividing again here, so the number the grade encodes cannot drift from it.
  return Math.min(2, Math.max(1, Math.ceil(props.trophy.completion * 3))) as 1 | 2 | 3
})

const progress = computed(() => tierProgress(props.trophy))

/**
 * Renders one measurement in its unit.
 *
 * Three cases, because the server's `unit` is not always a noun:
 * - `seconds` arrives as raw values (`460860`) and is unreadable, so it goes
 *   through the shared duration formatter.
 * - `percent` describes a 0–100 completion (`PERFECT_MONTH`), where "32 percent"
 *   reads as copy rather than a measurement — "%" is the symbol.
 * - anything else (`days`, `languages`) is already a countable noun, so it
 *   prints as-is. A unit this build has not seen still renders, rather than
 *   being dropped.
 */
function formatValue(value: number, unit: string): string {
  if (unit === 'seconds') return formatDuration(value)
  if (unit === 'percent') return `${value}%`
  return `${value} ${unit}`
}

const progressLabel = computed(() => {
  const current = formatValue(props.trophy.progress, props.trophy.unit)
  const next = props.trophy.nextTier
  return next === null ? current : `${current} / ${formatValue(next.target, props.trophy.unit)}`
})

/** The highest tier earned, named by the server (`7-Day Streak`); null when none. */
const tierLabel = computed(() => {
  const current = props.trophy.currentTier
  if (current === null) return null
  return current.displayName
})

/** Exact instant the current tier unlocked, for the row's hover title. */
const unlockedTitle = computed(() => {
  const at = props.trophy.currentTier?.unlockedAt
  return at === null || at === undefined ? undefined : formatDateTime(at)
})
</script>

<template>
  <article
    class="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-border"
    :class="{ 'opacity-70': grade === 0 }"
    data-testid="trophy-card"
    :data-trophy="trophy.key"
    :data-window="trophy.window"
  >
    <header class="flex items-start gap-3">
      <TrophyMedal :art="trophy.art" :grade="grade" :maxed="trophy.maxed" :size="40" />

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <h3 class="truncate text-[13px] font-semibold text-foreground" :title="trophy.label">
            {{ trophy.label }}
          </h3>
          <!-- The window noun. Five `TOTAL_SECONDS` ladders share one family name,
               so without it five cards read as duplicates of "Total time". A
               resetting trophy says which period it is measuring. -->
          <span
            v-if="trophy.windowLabel"
            class="shrink-0 rounded-sm bg-muted px-1 py-px text-[10px] font-medium text-muted-foreground"
            data-testid="trophy-window"
          >
            {{ trophy.windowLabel }}
          </span>
        </div>
        <p class="truncate text-[11px] text-muted-foreground" :title="trophy.blurb">{{ trophy.blurb }}</p>
      </div>

      <!-- Tier count is the trophy's own score: earned rungs over total rungs. -->
      <span
        class="shrink-0 text-[11px] font-semibold tabular-nums"
        :class="trophy.maxed ? 'text-foreground' : 'text-muted-foreground'"
        data-testid="trophy-tier-count"
      >
        {{ trophy.earned }}/{{ trophy.total }}
      </span>
    </header>

    <!-- Ladder: one pip per rung, filled up to the tiers earned. Reads the
         ladder's shape at a glance, which a single bar cannot. -->
    <div class="flex items-center gap-1" role="img" :aria-label="`${trophy.earned} of ${trophy.total} tiers earned`">
      <span
        v-for="(tier, i) in trophy.tiers"
        :key="tier.code"
        class="h-1 flex-1 rounded-full"
        :class="i < trophy.earned ? 'bg-primary' : 'bg-muted'"
        :data-earned="i < trophy.earned"
        :title="tier.displayName"
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <div class="flex items-baseline justify-between gap-2 text-[11px]">
        <span class="truncate text-muted-foreground" :title="tierLabel ?? undefined" data-testid="trophy-tier-label">
          {{ tierLabel ?? 'Locked' }}
        </span>
        <span class="shrink-0 tabular-nums text-muted-foreground" data-testid="trophy-progress">
          {{ progressLabel }}
        </span>
      </div>

      <!-- Progress bar, hidden once the ladder is complete: a full bar on a
           finished trophy is decoration, not information. -->
      <div v-if="!trophy.maxed" class="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          class="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
          :style="{ width: `${Math.round(progress * 100)}%` }"
          data-testid="trophy-progress-bar"
        />
      </div>
      <span v-else class="text-[11px] text-muted-foreground" :title="unlockedTitle" data-testid="trophy-complete"
        >Complete</span
      >
    </div>
  </article>
</template>
