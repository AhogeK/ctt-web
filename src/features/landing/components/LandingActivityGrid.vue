<script setup lang="ts">
/**
 * LandingActivityGrid — the last twelve weeks, painted one cell per day.
 *
 * Why this exists as its own component: the dashboard's own activity view is an ECharts canvas, and
 * an ECharts option cannot be extracted into DOM. Pulling the chart in would add its whole bundle
 * (~202 kB gzip) to a marketing page, and a canvas cannot be the guarantee the hero states. So this
 * is the one deliberate second implementation in the landing page: a CSS grid of divs, no chart
 * library, no canvas, no query — and the only place a "heatmap" is painted in DOM.
 *
 * It is presentational: the caller supplies the weeks, so the same component would render real data
 * unchanged if the product ever wants a query-free variant. Colour comes from `--primary` mixed in
 * oklab — the same derivation the dark shadow uses, not a second palette, and no new token.
 *
 * Accessibility: the grid is one `role="img"` with a sentence for its label rather than 84 focusable
 * cells, because a screen reader has no use for 84 anonymous numbers; the busiest day and the active
 * count carry the meaning.
 */
import { computed } from 'vue'
import { formatDuration } from '@/lib/utils'
import type { ActivityWeek } from '../demo-data'

const props = defineProps<{
  /** Week columns, Sunday first; `null` marks a slot outside the window. */
  weeks: ActivityWeek[]
}>()

/**
 * The dashboard's own ladder, verbatim from the heatmap panel:
 * `<15m · 15–60m · 1–2h · 2–5h · 5–8h · >8h`, plus an empty slot for a day with no coding.
 *
 * Discrete buckets rather than a continuous ramp is a deliberate decision the product already made:
 * with a continuous scale a 20-minute day and an 8-hour day are almost the same colour, so the chart
 * stops answering "how much did I code" — and borrowing the product's own ladder is what keeps the
 * marketing surface in the product's language instead of inventing a second one.
 */
const LEVEL_MINUTES = [15, 60, 120, 300, 480]

/** 0 = nothing coded, else 1..6 for the buckets above. */
function level(seconds: number): number {
  if (seconds === 0) return 0
  const minutes = seconds / 60
  let bucket = 1
  for (const [index, threshold] of LEVEL_MINUTES.entries()) if (minutes >= threshold) bucket = index + 2
  return bucket
}

const paint: Record<number, string> = {
  0: 'bg-muted/50 dark:bg-muted/30',
  1: 'bg-primary/15',
  2: 'bg-primary/30',
  3: 'bg-primary/50',
  4: 'bg-primary/70',
  5: 'bg-primary/85',
  6: 'bg-primary',
}

/**
 * Weekday labels beside the grid (GitHub shows three; seven is noise at this cell size).
 *
 * `row` is the 1-based position in the label column, which is one more than the grid's own row index:
 * the grid's row 0 is Sunday, so Monday is row 1 there and the second slot here. Writing 1/3/5 put
 * "Mon" on the Sunday row — measured, off by one.
 */
const WEEKDAY_LABELS: { row: number; label: string }[] = [
  { row: 2, label: 'Mon' },
  { row: 4, label: 'Wed' },
  { row: 6, label: 'Fri' },
]

const totals = computed(() => {
  const cells = props.weeks.flatMap((week) => week.cells).filter((cell) => cell !== null)
  const active = cells.filter((cell) => cell.seconds > 0)
  const busiest = active.reduce((max, cell) => Math.max(max, cell.seconds), 0)
  // Whole weeks of days, not columns: 84 days aligned to calendar weeks can span 13 columns, and
  // saying "the last 13 weeks" because of the padding would be wrong about the window.
  return {
    activeDays: active.length,
    days: cells.length,
    windowWeeks: Math.round(cells.length / 7),
    busiestSeconds: busiest,
  }
})

const summary = computed(
  () =>
    `Daily coding time for the last ${totals.value.windowWeeks} weeks: ${totals.value.activeDays} of ` +
    `${totals.value.days} days had coding, the busiest day was ${formatDuration(totals.value.busiestSeconds)}.`,
)
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="landing-activity">
    <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2" role="img" :aria-label="summary">
      <div class="flex min-w-0 items-start gap-1.5">
        <!-- Weekday labels: three, aligned to the rows the eye uses to read a contribution grid. -->
        <div class="flex flex-col gap-[3px] text-[10px] leading-none text-muted-foreground" aria-hidden="true">
          <!-- Same height and same gap as a cell, so the labels sit on the grid's rows instead of
               drifting: hard-coding a second size is how they ended up misaligned. -->
          <span v-for="row in 7" :key="row" class="flex h-2.5 items-center justify-end lg:h-[15px]">
            {{ WEEKDAY_LABELS.find((entry) => entry.row === row)?.label ?? '' }}
          </span>
        </div>

        <!-- A year of weeks does not fit a phone, so the grid scrolls inside its own box rather than
             widening the page (the page itself must never scroll sideways). -->
        <div class="activity-scroll min-w-0 overflow-x-auto">
          <div class="flex w-max gap-[3px]" aria-hidden="true">
            <div v-for="(week, weekIndex) in props.weeks" :key="weekIndex" class="flex flex-col gap-[3px]">
              <template v-for="(cell, dayIndex) in week.cells" :key="`${weekIndex}-${dayIndex}`">
                <span v-if="cell === null" class="size-2.5 rounded-[2px] lg:size-[15px]" />
                <span
                  v-else
                  class="size-2.5 rounded-[2px] transition-colors lg:size-[15px]"
                  :class="paint[level(cell.seconds)]"
                  :data-date="cell.date"
                  :data-seconds="cell.seconds"
                />
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- One line under the grid: the reading, then the legend that explains its colours. The legend
         used to float at the far right of the row, where it read as unrelated to the chart. -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <!-- Legend: without it a colour scale is a decoration. -->
      <div class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span>Less</span>
        <span v-for="l in [0, 1, 2, 3, 4, 5, 6]" :key="l" class="size-3 rounded-[2px]" :class="paint[l]" />
        <span>More</span>
      </div>
      <p class="text-sm text-muted-foreground">
        {{ totals.activeDays }} of {{ totals.days }} days had coding · busiest day
        {{ formatDuration(totals.busiestSeconds) }}
      </p>
    </div>
  </div>
</template>
