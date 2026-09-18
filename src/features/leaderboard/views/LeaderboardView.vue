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
 * Dimensions are not interchangeable: `STREAK` is only ranked over all time, and
 * `GROWTH` only over a bounded window. The period selector is therefore built from
 * `periodsFor(dimension)` rather than offering the full cross-product, which would let
 * the user request a pair the server rejects with HTTP 400 (`COMMON_003`).
 *
 * `LANGUAGE` is the one dimension partitioned by language: it needs a board name, and
 * every other dimension rejects being given one (both are `COMMON_003`). The dimension is
 * therefore offered only once the catalogue is non-empty, and selecting it selects a board —
 * see the watcher below.
 *
 * One response shape drives all of it. Only the score's unit varies (seconds, days, a
 * signed delta), and that is `formatScore`'s job.
 *
 * The caller's own rank travels **inside** the same response, so this page is one
 * query — not the previous arrangement of a second request to a `/me` endpoint.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { AlertCircle, ArrowLeft, ArrowRight, RefreshCw, Trophy as TrophyIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth'
import { formatScore } from '@/lib/utils'
import LanguageSelect from '../components/LanguageSelect.vue'
import {
  DIMENSION_LABELS,
  PERIOD_LABELS,
  periodsFor,
  requiresLanguage,
  useLeaderboard,
  useLeaderboardLanguages,
} from '../composables/useLeaderboard'
import {
  LEADERBOARD_PAGE_SIZE,
  defaultPeriodFor,
  type LeaderboardDimension,
  type LeaderboardPeriod,
} from '@/lib/schemas/leaderboard.schema'

const dimension = ref<LeaderboardDimension>('TOTAL')
const period = ref<LeaderboardPeriod>('ALL')
const offset = ref(0)

/**
 * The signed-in account, for identifying which row is the reader's own.
 *
 * The store rather than the response: the endpoint identifies a row by `userId`, and the store is
 * where the caller's own id lives — asking the server would mean a second request for something
 * the client already holds.
 */
const authStore = useAuthStore()

/**
 * The language board, for the dimension that is partitioned by one.
 *
 * Kept in `LANGUAGE`'s own frame of reference: it is *not* the language of the app or of
 * any other panel, and it stays selected when the reader leaves the dimension so returning
 * to it lands where they left off.
 */
const language = ref<string | null>(null)

const { boards: languageBoards, grouped: languageGroups } = useLeaderboardLanguages()

/**
 * The dimensions on offer.
 *
 * `LANGUAGE` appears only once the catalogue has a board: the selector would otherwise
 * offer a tab whose every selection is a 400 (`COMMON_003` — the dimension cannot be ranked
 * without a language, and there is none to give it). The catalogue is populated lazily as
 * people are scored, so on a fresh deployment the tab is legitimately absent rather than
 * broken. A failed catalogue request leaves it absent too — the rest of the page works, and
 * a supplementary selector is not worth an error state of its own.
 */
const dimensions = computed<LeaderboardDimension[]>(() =>
  (Object.keys(DIMENSION_LABELS) as LeaderboardDimension[]).filter(
    (candidate) => !requiresLanguage(candidate) || languageBoards.value.length > 0,
  ),
)

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

/**
 * Keep a board selected whenever the active dimension needs one.
 *
 * Runs for every dimension but only acts on the partitioned one. A board that left the
 * catalogue is replaced rather than kept: the catalogue is sticky, so this should not
 * happen, and if it does the alternative is a request the server rejects.
 */
watch(
  [dimension, languageGroups],
  () => {
    if (!requiresLanguage(dimension.value)) return
    // Ordered by the list the reader is about to see, not by the catalogue: defaulting to the
    // catalogue's first entry would preselect a board that the grouped menu shows third, which
    // reads as an arbitrary choice.
    // The order the menu presents, so the preselected board is the one the reader sees
    // first rather than whichever name happens to sort earliest.
    const offered = languageGroups.value.flatMap((group) => [
      ...group.withMembers.map((board) => board.name),
      ...group.withoutMembers.map((board) => board.name),
    ])
    if (language.value !== null && offered.includes(language.value)) return
    language.value = offered[0] ?? null
  },
  { immediate: true },
)

// A different board is a different ranking, so the page offset does not carry over.
watch(language, () => {
  offset.value = 0
})

const { data, isPending, isError, isPlaceholderData, refetch, effectivePeriod } = useLeaderboard(
  dimension,
  period,
  language,
  offset,
)

const entries = computed(() => data.value?.entries ?? [])
const currentUserRank = computed(() => data.value?.currentUserRank ?? null)

/**
 * The board's size, shown beside the caller's own rank.
 *
 * Rendered even when it is `1`: the denominator is how a reader tells a small board from a
 * large one, and a rank of #1 means something different at 1 of 1 than at 1 of 340. Hiding
 * it for small boards would remove exactly the case where it carries the most information.
 */
const totalParticipants = computed(() => data.value?.totalParticipants ?? 0)

/**
 * Whether there is another page — exact, from the board's own size.
 *
 * This used to be inferred (`a full page means maybe more`), because the response
 * carried no total: when the ranking's size was an exact multiple of the page size,
 * the last page was itself full, so one page too many was offered. `totalParticipants`
 * arrived in ctt-server v0.73.0 and removes the guess.
 */
const mayHaveNextPage = computed(() => offset.value + entries.value.length < (data.value?.totalParticipants ?? 0))
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

/**
 * The caller's own row, when it is on this page.
 *
 * Matched by `userId` rather than by `rank`: ties share a rank, so a rank would point at every
 * row that happens to hold it — and the reader wants their own row, not the group. The same
 * reason the row key is the id.
 */
const ownUserId = computed(() => authStore.userId)
const ownRowIsHere = computed(() => entries.value.some((entry) => entry.userId === ownUserId.value))

/**
 * The page offset that contains the caller's rank, or `null` when they are not on this board.
 *
 * Expressed as a single offset rather than a walk through the pages in between: the model here is
 * explicit Previous/Next paging, so the intervening pages would be fetched only to be discarded,
 * and the reader would end up on a page number they never asked for. One offset, then a scroll.
 */
const offsetForOwnRank = computed<number | null>(() => {
  if (currentUserRank.value === null) return null
  return Math.floor((currentUserRank.value - 1) / LEADERBOARD_PAGE_SIZE) * LEADERBOARD_PAGE_SIZE
})

const listElement = ref<HTMLElement | null>(null)

/**
 * The row to emphasise after a jump, cleared on a timer.
 *
 * A jump that lands silently is indistinguishable from one that did nothing — the reader asked
 * "where am I" and the answer has to be visible without hunting. Held as an id rather than a
 * boolean so the emphasis cannot stick to a different row if the page changes underneath it.
 */
const highlightedUserId = ref<string | null>(null)
const pendingJump = ref(false)

/** Scroll the caller's row to the middle of the list and emphasise it briefly. */
function scrollToOwnRow() {
  const userId = ownUserId.value
  if (userId === null) return
  const row = listElement.value?.querySelector(`[data-user-id="${CSS.escape(userId)}"]`)
  if (!(row instanceof HTMLElement)) return
  row.scrollIntoView({ block: 'center', behavior: 'smooth' })
  highlightedUserId.value = userId
  globalThis.setTimeout(() => {
    // Only clear if nothing newer has taken over: a second jump within the window must not be
    // cancelled by the first one's timer.
    if (highlightedUserId.value === userId) highlightedUserId.value = null
  }, 1600)
}

/**
 * Bring the caller's own row into view, moving to its page first when it is elsewhere.
 *
 * The button is only rendered while a rank exists, so the `null` branch is a type guard rather
 * than a state the reader can reach.
 */
function jumpToOwnRank() {
  const target = offsetForOwnRank.value
  if (target === null) return
  if (target === offset.value) {
    scrollToOwnRow()
    return
  }
  // The row cannot be scrolled to before it exists: wait for the page that holds it.
  pendingJump.value = true
  offset.value = target
}

watch(entries, () => {
  if (!pendingJump.value) return
  pendingJump.value = false
  // The rows are committed by the time this runs, so the query can see them.
  void nextTick(scrollToOwnRow)
})
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

      <!-- The caller's own rank. Null means this board has no activity for them, which is
           ordinary rather than a failure — so it is stated. Rendering nothing left the reader
           unable to tell "you are not on this board" from "this did not load". -->
      <div class="flex items-center gap-3" data-testid="own-rank">
        <TrophyIcon
          class="h-5 w-5 text-muted-foreground"
          :class="currentUserRank === null ? 'opacity-40' : ''"
          aria-hidden="true"
        />
        <div class="flex flex-col">
          <span
            class="text-[15px] font-semibold tabular-nums"
            :class="currentUserRank === null ? 'text-muted-foreground' : 'text-foreground'"
            data-testid="own-rank-value"
          >
            {{ currentUserRank === null ? 'Not ranked' : `#${currentUserRank} of ${totalParticipants}` }}
          </span>
          <span class="text-[11px] text-muted-foreground">your rank</span>
        </div>

        <!-- Only while a rank exists. On a board the reader has not appeared on there is nowhere
             to jump, and a disabled control would pose a question with no answer — the panel
             beside it already states "Not ranked". -->
        <Button
          v-if="currentUserRank !== null"
          variant="outline"
          size="sm"
          :disabled="isPlaceholderData"
          data-testid="jump-to-my-rank"
          @click="jumpToOwnRank"
        >
          <TrophyIcon class="h-4 w-4" aria-hidden="true" />
          {{ ownRowIsHere ? 'Back to me' : 'Find me' }}
        </Button>
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

    <!-- Which board, for the dimension that is partitioned by language. Guarded on a
         selected board as well as on the dimension: the watcher above fills it in, and a
         select with nothing to show would be a frame of empty furniture. -->
    <LanguageSelect
      v-if="requiresLanguage(dimension) && language !== null"
      v-model:language="language"
      :groups="languageGroups"
    />

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
        false: either this ranking genuinely has no data, or the reader is past the end
        of it. The second case is now rare rather than routine — "next" is offered from
        the board's exact size (`totalParticipants`) — but it remains reachable, because
        the board can shrink between requests (a score decays, an account is deleted)
        and leave the reader on an offset that no longer exists.
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
      <ol
        ref="listElement"
        class="flex flex-col gap-2 transition-opacity duration-150"
        :class="{ 'opacity-50': isPlaceholderData }"
        :aria-busy="isPlaceholderData"
        role="list"
      >
        <li
          v-for="entry in entries"
          :key="entry.userId"
          class="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          :class="{
            'border-primary bg-primary/12': entry.userId === ownUserId,
            'leaderboard-row-flash': entry.userId === highlightedUserId,
          }"
          :data-user-id="entry.userId"
          :aria-current="entry.userId === ownUserId ? 'true' : undefined"
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

      <!-- Paging. "Next" is offered while rows remain, using the board's own count. -->
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

<style scoped>
/*
 * The emphasis a jump lands on. Bounded and short: it answers "where am I" once and then gets out
 * of the way — a row that keeps glowing becomes the thing the reader is trying to read past.
 *
 * The ring is drawn with `--primary` rather than a literal, so it follows the theme instead of
 * pinning a colour that only works in one of the two modes. `box-shadow` rather than `border`:
 * a border would change the row's box and shift every row below it at the exact moment the reader
 * is trying to locate one.
 */
@keyframes leaderboard-row-flash {
  0%,
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
  25%,
  75% {
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 45%, transparent);
  }
}

.leaderboard-row-flash {
  animation: leaderboard-row-flash 1.6s ease-in-out;
}

/* The scroll still happens — it is how the row arrives. Only the pulse is dropped. */
@media (prefers-reduced-motion: reduce) {
  .leaderboard-row-flash {
    animation: none;
  }
}
</style>
