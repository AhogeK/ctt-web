<script setup lang="ts">
/**
 * AchievementsView — the trophy cabinet at `/achievements`.
 *
 * A dedicated page rather than a dashboard panel: trophy families with ladders do
 * not fit the 320px panel ceiling, and the dashboard already carries eight panels.
 *
 * The page renders **one card per (family, window)**, not one per badge. The API
 * returns 67 badges (ctt-server v0.71.0) across 14 ladders, and the measured value
 * is per (family, window) — all three STREAK badges report the same progress — so
 * 67 cards would repeat one number many times over. `trophy-model` owns that
 * shaping.
 *
 * The grid is split into a **lifetime** section and a **current period** one, by
 * `splitByWindow`. A lifetime trophy measures a record that can never be lost; a
 * resetting one measures the current day/week/month/year and starts over when that
 * period ends. In one undifferentiated grid the two read as the same kind of goal,
 * which is exactly the confusion the split removes.
 */
import { computed, watch } from 'vue'
import { useNow } from '@vueuse/core'
import { AlertCircle, CalendarClock, RefreshCw, Trophy as TrophyIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStatsAchievements } from '@/composables/useStats'
import TrophyCard from '../components/TrophyCard.vue'
import {
  buildTrophies,
  byNextWin,
  formatDaysLeft,
  groupByWindow,
  isClosing,
  splitByWindow,
  trophyTotals,
} from '../composables/trophy-model'

const { data, isPending, isError, refetch } = useStatsAchievements()

/**
 * A clock that ticks once a minute, so a page left open across midnight stops
 * claiming yesterday's remaining days. Minute granularity is enough: the countdown
 * is expressed in whole days, and only the local *date* changes its value.
 */
const now = useNow({ interval: 60_000 })

/**
 * The clock and the data must move together.
 *
 * Measured: `windowEnd` is inclusive and a passed window clamps to 0 days, which
 * renders as "Ends today". So a page left open past a window boundary would show a
 * live "Ends today" beside a date range the window has already left — two
 * contradictory statements in one header, and nothing self-corrects it:
 * `refetchOnWindowFocus` is false app-wide and this query sets no interval, so
 * `staleTime` alone never triggers a request.
 *
 * Watching the local *date* (not the minute) refetches exactly when the server's
 * answer can change — window boundaries are local dates. Re-fetching on a minute
 * tick would poll 1440× more often for the same result.
 */
watch(
  () => now.value.toDateString(),
  () => refetch(),
)

const split = computed(() => splitByWindow(buildTrophies(data.value ?? [])))

/** Lifetime trophies, closest to its next rung first. */
const lifetimeTrophies = computed(() => byNextWin(split.value.lifetime))

/**
 * Resetting trophies grouped by window. Each group carries the one deadline its
 * members share, so the range and countdown are stated once per window rather than
 * repeated on every card in it.
 */
const windowGroups = computed(() => groupByWindow(split.value.active, now.value))

const totals = computed(() => trophyTotals([...split.value.lifetime, ...split.value.active]))

/** Share of every tier earned, for the header ring. */
const overall = computed(() =>
  totals.value.total === 0 ? 0 : Math.round((totals.value.earned / totals.value.total) * 100),
)

const isEmpty = computed(() => !isPending.value && !isError.value && totals.value.total === 0)
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-2">
        <h1 class="text-2xl font-semibold">Achievements</h1>
        <p class="text-sm text-muted-foreground">
          Trophy families with tiered goals, earned from your tracked coding history
        </p>
      </div>

      <!-- Overall completion. Hidden until data lands, and hidden when there is
           nothing to count: "0 / 0 tiers · 0%" claims a result where none exists. -->
      <div
        v-if="!isPending && !isError && totals.total > 0"
        class="flex items-center gap-3"
        data-testid="achievement-summary"
      >
        <TrophyIcon class="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <div class="flex flex-col">
          <span class="text-[15px] font-semibold tabular-nums text-foreground">
            {{ totals.earned }} <span class="text-muted-foreground">/ {{ totals.total }}</span>
          </span>
          <span class="text-[11px] text-muted-foreground">tiers earned · {{ overall }}%</span>
        </div>
      </div>
    </header>

    <div
      v-if="isError"
      class="flex flex-col items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-8"
    >
      <AlertCircle class="h-12 w-12 text-destructive" />
      <div class="text-center">
        <p class="font-medium text-destructive">Failed to load achievements</p>
        <p class="mt-1 text-sm text-muted-foreground">Your trophies could not be retrieved.</p>
      </div>
      <Button variant="outline" size="sm" @click="() => refetch()">
        <RefreshCw class="h-4 w-4" />
        Retry
      </Button>
    </div>

    <div v-else-if="isPending" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Skeleton v-for="i in 6" :key="i" class="h-40 w-full rounded-lg" />
    </div>

    <div v-else-if="isEmpty" class="flex flex-col items-center gap-3 rounded-lg border p-10 text-center">
      <TrophyIcon class="h-10 w-10 text-muted-foreground/60" aria-hidden="true" />
      <p class="font-medium">No achievements yet</p>
      <p class="max-w-sm text-sm text-muted-foreground">
        Trophies unlock as you track coding time. Install the editor plugin and start coding to begin earning them.
      </p>
    </div>

    <template v-else>
      <!-- Lifetime: the all-time record. These never reset. -->
      <section v-if="lifetimeTrophies.length > 0" class="flex flex-col gap-3" data-testid="section-lifetime">
        <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 class="text-[15px] font-semibold text-foreground">Lifetime</h2>
          <p class="text-[11px] text-muted-foreground">Never resets — your all-time record</p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <TrophyCard v-for="trophy in lifetimeTrophies" :key="trophy.key" :trophy="trophy" />
        </div>
      </section>

      <!-- Current period: starts over when the period ends, so it is separated
           from the permanent record above rather than mixed into it. Each window
           is its own sub-section because the deadline — what makes the group a
           group — belongs to the window, not to any one trophy in it. -->
      <section v-if="windowGroups.length > 0" class="flex flex-col gap-5" data-testid="section-active">
        <div class="flex flex-col gap-1">
          <h2 class="text-[15px] font-semibold text-foreground">Current period</h2>
          <p class="text-[11px] text-muted-foreground">Resets when each period ends — progress starts over</p>
        </div>

        <div
          v-for="group in windowGroups"
          :key="group.window"
          class="flex flex-col gap-3"
          :data-window-group="group.window"
          role="group"
          :aria-label="group.label"
        >
          <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <CalendarClock class="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <!--
              A label, not a heading.
              The cards below title themselves with an h3 (TrophyCard) in BOTH
              sections, so making this a heading would either collide with them at
              h3 or force the shared card to h4 — which would then skip a level
              under the Lifetime section, where no group heading exists.
              `role="group"` + `aria-label` conveys the grouping (screen readers
              announce "This week, group") without disturbing h1 → h2 → h3.
            -->
            <span class="text-[13px] font-semibold text-foreground">{{ group.label }}</span>
            <!-- The concrete dates being measured. Stated on the group because
                 every trophy inside resets at the same instant. -->
            <span v-if="group.range" class="text-[11px] tabular-nums text-muted-foreground" data-testid="window-range">
              {{ group.range }}
            </span>
            <!-- The deadline. Over the closing stretch — today and tomorrow — a target
                 is still reachable but no longer comfortably so, so the countdown is
                 emphasised. Two constraints shape how:
                 1. No new colour. DESIGN.md has no "urgent" hue — its status colours
                    (green/emerald) mean success — and P3 records what a bespoke
                    urgency colour cost last time (a mode-dependent ramp that failed
                    contrast in light mode).
                 2. Weight does nothing here. The page specifies `font-family: Inter`
                    but never loads it (no `@font-face`, no font file), so every
                    `font-*` utility computes to the fallback's single 400 face —
                    measured: `font-semibold` on the h1/h2 also reports 400. An
                    emphasis that only raises weight would be invisible.
                 So the emphasis is the foreground token *plus* a hairline underline
                 (decoration, rendered by the text engine, mode-independent), which
                 survives greyscale and is not colour-dependent. -->
            <span
              v-if="formatDaysLeft(group.daysLeft)"
              class="text-[11px] tabular-nums"
              :class="
                isClosing(group.daysLeft)
                  ? 'text-foreground underline decoration-dotted underline-offset-2'
                  : 'text-muted-foreground'
              "
              data-testid="window-countdown"
            >
              {{ formatDaysLeft(group.daysLeft) }}
            </span>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <TrophyCard v-for="trophy in group.trophies" :key="trophy.key" :trophy="trophy" />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
