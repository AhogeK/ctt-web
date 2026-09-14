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
import { computed } from 'vue'
import { AlertCircle, RefreshCw, Trophy as TrophyIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStatsAchievements } from '@/composables/useStats'
import TrophyCard from '../components/TrophyCard.vue'
import { buildTrophies, byNextWin, splitByWindow, trophyTotals } from '../composables/trophy-model'

const { data, isPending, isError, refetch } = useStatsAchievements()

const split = computed(() => splitByWindow(buildTrophies(data.value ?? [])))

/** Lifetime trophies, closest to its next rung first. */
const lifetimeTrophies = computed(() => byNextWin(split.value.lifetime))

/** Resetting trophies, closest to its next rung first. */
const activeTrophies = computed(() => byNextWin(split.value.active))

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
           from the permanent record above rather than mixed into it. -->
      <section v-if="activeTrophies.length > 0" class="flex flex-col gap-3" data-testid="section-active">
        <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 class="text-[15px] font-semibold text-foreground">Current period</h2>
          <p class="text-[11px] text-muted-foreground">Resets when the period ends — progress starts over</p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <TrophyCard v-for="trophy in activeTrophies" :key="trophy.key" :trophy="trophy" />
        </div>
      </section>
    </template>
  </div>
</template>
