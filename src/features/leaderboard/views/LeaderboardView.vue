<script setup lang="ts">
/**
 * LeaderboardView — rankings at `/leaderboard`.
 *
 * ## What the server actually serves
 *
 * One endpoint, `GET /api/v1/leaderboard`, parameterised by a **dimension** (what is
 * being ranked) and a **period** (over what window). The previous version of this
 * page asked three endpoints that do not exist and read fields the server never
 * sends, so it could only ever render its error state.
 *
 * Dimensions are not interchangeable: `STREAK`, `NIGHT_OWL` and `EARLY_BIRD` are
 * only ranked over all time, and `GROWTH` only week-over-week. The period selector
 * is therefore built from `periodsFor(dimension)` rather than offering the full
 * cross-product, which would let the user request a pair the server rejects with
 * HTTP 400 (`COMMON_003`).
 *
 * The caller's own rank travels **inside** the same response, so this page is one
 * query — not the previous arrangement of a second request to a `/me` endpoint.
 */
import { computed, ref, watch } from 'vue'
import { AlertCircle, ArrowLeft, ArrowRight, RefreshCw, Trophy as TrophyIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatScore } from '@/lib/utils'
import { DIMENSION_LABELS, PERIOD_LABELS, periodsFor, useLeaderboard } from '../composables/useLeaderboard'
import {
  LEADERBOARD_PAGE_SIZE,
  defaultPeriodFor,
  type LeaderboardDimension,
  type LeaderboardPeriod,
} from '@/lib/schemas/leaderboard.schema'

const dimensions = Object.keys(DIMENSION_LABELS) as LeaderboardDimension[]

const dimension = ref<LeaderboardDimension>('TOTAL')
const period = ref<LeaderboardPeriod>('ALL')
const offset = ref(0)

/**
 * Keep the period legal for the active dimension, and reset paging on any change.
 *
 * Both matter for correctness rather than polish: an illegal pair is a 400, and a
 * page offset carried across a dimension switch would request rows from a ranking
 * that does not have them.
 */
watch(dimension, () => {
  // `defaultPeriodFor` rather than indexing the legal list here: the reset and the
  // composable's fallback must agree on which period wins, so there is one definition.
  period.value = defaultPeriodFor(dimension.value)
  offset.value = 0
})
watch(period, () => {
  offset.value = 0
})

const { data, isPending, isError, refetch, effectivePeriod } = useLeaderboard(dimension, period, offset)

const entries = computed(() => data.value?.entries ?? [])
const currentUserRank = computed(() => data.value?.currentUserRank ?? null)

/**
 * Whether there is another page. The response carries no total, so a full page is
 * the only evidence available — a short page means the end.
 *
 * The cost of that inference: when the ranking's size is an exact multiple of the
 * page size, the last page is itself full, so one more page is offered than exists.
 * The resulting empty page is therefore a *supported* destination, not an edge case
 * to ignore — the empty state names it ("Nothing more to show") and carries a way
 * back, because the pager itself is not rendered there.
 */
const mayHaveNextPage = computed(() => entries.value.length === LEADERBOARD_PAGE_SIZE)
const isFirstPage = computed(() => offset.value === 0)

function nextPage() {
  if (mayHaveNextPage.value) offset.value += LEADERBOARD_PAGE_SIZE
}

function prevPage() {
  offset.value = Math.max(0, offset.value - LEADERBOARD_PAGE_SIZE)
}

/**
 * Top-three medals, everything else the plain numeral.
 *
 * `rank` comes from the server and is shown verbatim — ties share a rank, so a
 * position must never be derived from the row's index.
 */
function rankDecoration(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `${rank}`
}

const isEmpty = computed(() => !isPending.value && !isError.value && entries.value.length === 0)
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-2">
        <h1 class="text-2xl font-semibold">Leaderboard</h1>
        <p class="text-sm text-muted-foreground">
          {{ DIMENSION_LABELS[dimension] }} rankings across all tracked coders
        </p>
      </div>

      <!-- The caller's own rank, when they have one. Null is the ordinary "not yet
           ranked" state, so it renders nothing rather than an error. -->
      <div v-if="currentUserRank !== null" class="flex items-center gap-3" data-testid="own-rank">
        <TrophyIcon class="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <div class="flex flex-col">
          <span class="text-[15px] font-semibold tabular-nums text-foreground">#{{ currentUserRank }}</span>
          <span class="text-[11px] text-muted-foreground">your rank</span>
        </div>
      </div>
    </header>

    <!-- Pick-one-of-N as a labelled button group with `aria-pressed`, matching
         `TrendMonthSelect`, rather than a tablist: there is no tabpanel here, and a
         tablist owes the user arrow-key navigation this row does not implement — an
         affordance that is announced but does not exist is worse than none. -->
    <div class="flex flex-wrap gap-2" role="group" aria-label="Ranking dimension">
      <Button
        v-for="d in dimensions"
        :key="d"
        :variant="d === dimension ? 'default' : 'outline'"
        size="sm"
        :aria-pressed="d === dimension"
        :data-testid="`dimension-${d}`"
        @click="dimension = d"
      >
        {{ DIMENSION_LABELS[d] }}
      </Button>
    </div>

    <!-- Period selector, restricted to what this dimension can actually rank.
         A single legal period renders as a statement, not a one-item menu. -->
    <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Time period">
      <span class="text-[11px] text-muted-foreground" aria-hidden="true">Period</span>
      <template v-if="periodsFor(dimension).length > 1">
        <Button
          v-for="p in periodsFor(dimension)"
          :key="p"
          :variant="p === effectivePeriod ? 'secondary' : 'ghost'"
          size="sm"
          :aria-pressed="p === effectivePeriod"
          :data-testid="`period-${p}`"
          @click="period = p"
        >
          {{ PERIOD_LABELS[p] }}
        </Button>
      </template>
      <!-- The one legal period is stated, so it needs no pressed state. -->
      <Badge v-else variant="outline" data-testid="period-fixed">{{ PERIOD_LABELS[periodsFor(dimension)[0]!] }}</Badge>
    </div>

    <div
      v-if="isError"
      class="flex flex-col items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-8"
    >
      <AlertCircle class="h-12 w-12 text-destructive" />
      <div class="text-center">
        <p class="font-medium text-destructive">Failed to load leaderboard</p>
        <p class="mt-1 text-sm text-muted-foreground">The rankings could not be retrieved.</p>
      </div>
      <Button variant="outline" size="sm" @click="() => refetch()">
        <RefreshCw class="h-4 w-4" />
        Retry
      </Button>
    </div>

    <div v-else-if="isPending" class="flex flex-col gap-2">
      <div v-for="i in 5" :key="i" class="flex items-center gap-4 rounded-lg border p-4">
        <Skeleton class="h-8 w-8 rounded-full" />
        <div class="flex flex-1 flex-col gap-2">
          <Skeleton class="h-4 w-32" />
          <Skeleton class="h-3 w-20" />
        </div>
        <Skeleton class="h-6 w-16" />
      </div>
    </div>

    <div v-else-if="isEmpty" class="flex flex-col items-center gap-3 rounded-lg border p-12 text-center">
      <TrophyIcon class="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <p class="font-medium">{{ isFirstPage ? 'No one is ranked yet' : 'Nothing more to show' }}</p>
      <!--
        Two different situations, and saying "no one is ranked" for both would be
        false: either this ranking genuinely has no data, or the reader paged past the
        end of it. The second case is reachable because the response carries no total
        — a board whose size is an exact multiple of the page size offers one page too
        many (a full page is the only end signal available).
      -->
      <p class="max-w-sm text-sm text-muted-foreground">
        <template v-if="isFirstPage">
          {{ PERIOD_LABELS[effectivePeriod] }} has no {{ DIMENSION_LABELS[dimension].toLowerCase() }} activity. Track
          coding time to appear here.
        </template>
        <template v-else>You have reached the end of this ranking.</template>
      </p>

      <!-- The way back: without it, that extra click strands the reader on an empty
           list, because the pager itself lives in the non-empty branch below. -->
      <Button v-if="!isFirstPage" variant="outline" size="sm" data-testid="prev-page-empty" @click="prevPage">
        <ArrowLeft class="h-4 w-4" />
        Back to results
      </Button>
    </div>

    <template v-else>
      <!-- `role="list"` because Tailwind's preflight sets `list-style: none`, which
           removes list semantics in Safari/VoiceOver (the fix recorded in the
           dashboard-visualization domain and used by ScrollFadeList). -->
      <ol class="flex flex-col gap-2" role="list">
        <li
          v-for="entry in entries"
          :key="entry.userId"
          class="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          data-testid="leaderboard-entry"
        >
          <!-- Decorative: the badge beside it states the real rank on every row, so
               without this a rank would be announced twice (and for 1-3 as
               "medal" then "#1"). -->
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center text-lg"
            aria-hidden="true"
            data-testid="entry-rank"
          >
            {{ rankDecoration(entry.rank) }}
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <!-- Null when the account was deleted; a placeholder keeps the row
                 readable instead of printing an empty cell. -->
            <span class="truncate font-medium" :class="{ 'text-muted-foreground italic': entry.displayName === null }">
              {{ entry.displayName ?? 'Deleted account' }}
            </span>
            <span class="text-xs tabular-nums text-muted-foreground">{{ formatScore(entry.score, dimension) }}</span>
          </div>

          <Badge variant="outline" class="shrink-0 tabular-nums">#{{ entry.rank }}</Badge>
        </li>
      </ol>

      <!-- Paging. The server returns no total, so "next" is offered while the last
           response came back full. -->
      <div class="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" :disabled="isFirstPage" data-testid="prev-page" @click="prevPage">
          <ArrowLeft class="h-4 w-4" />
          Previous
        </Button>
        <span class="text-[11px] tabular-nums text-muted-foreground" data-testid="page-range">
          {{ offset + 1 }}–{{ offset + entries.length }}
          <span class="sr-only">ranked coders shown</span>
        </span>
        <Button variant="outline" size="sm" :disabled="!mayHaveNextPage" data-testid="next-page" @click="nextPage">
          Next
          <ArrowRight class="h-4 w-4" />
        </Button>
      </div>
    </template>
  </div>
</template>
