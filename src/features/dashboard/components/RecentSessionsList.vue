<script setup lang="ts">
/**
 * RecentSessionsList — the presentational half of "Recent sessions".
 *
 * Split out of `RecentSessionsPanel` the same way `SummaryStatGrid` was split out of `SummaryCards`:
 * one implementation, two consumers. The dashboard panel keeps the query and the grouping; a surface
 * with no query client (the marketing hero) renders these rows from example data — real markup, real
 * row model, no second copy to drift.
 *
 * The three design decisions that used to live in the panel's docblock, kept here because this is
 * where they are visible:
 *
 * 1. **Grouped by local day, not a flat list.** Sessions cluster, and project names run long. Moving
 *    "when" into a group heading buys back the row width those names need.
 * 2. **No duration total, anywhere.** Parallel sessions are legitimate, so a day's durations overlap
 *    in real time; a sum would report more time than was spent. The heading carries a count instead.
 * 3. **Not a bar list.** Bar length only means something on a shared scale, and session durations are
 *    independent of each other — a bar would imply a proportion that does not exist.
 */
import { computed, ref } from 'vue'
import { formatDateTime, formatDuration } from '@/lib/utils'
import ScrollFadeList from './ScrollFadeList.vue'
import { sessionsAriaLabel, type SessionDayGroup } from './session-groups'

const props = withDefaults(
  defineProps<{
    groups: SessionDayGroup[]
    /**
     * Height cap of the scroll region. The dashboard wants the tall default; a compact surface (the
     * hero's floating card) passes a shorter one. The row markup is identical either way.
     */
    maxHeightClass?: string
  }>(),
  { maxHeightClass: 'max-h-57' },
)

const sessionCount = computed(() => props.groups.reduce((sum, group) => sum + group.rows.length, 0))
const dayCount = computed(() => props.groups.length)
const ariaLabel = computed(() => sessionsAriaLabel(props.groups))

/**
 * True while the log has rows below the fold — drives the footer's scroll hint. It matters more here
 * than on the distribution list: a full log always exceeds the viewport, so without it the visible
 * groups look like the whole list.
 */
const moreBelow = ref(false)
</script>

<template>
  <div class="flex flex-col gap-2">
    <ScrollFadeList :a11y-label="ariaLabel" :class="maxHeightClass" @overflow="(s) => (moreBelow = s.moreBelow)">
      <template v-for="group in groups" :key="group.key">
        <!-- Day heading. The date is the group's identity, so it is not repeated on every row; the
             count replaces a duration total on purpose (see this component's docblock).
             Deliberately NOT sticky: the scroll region fades its top 18px, and a heading pinned at
             top:0 has its text inside that fade — the label it exists to show would dissolve. -->
        <li class="-mx-1 mb-1 px-1 pt-0.5">
          <span
            class="flex items-baseline justify-between gap-2 text-[11px] font-semibold tracking-wide text-foreground"
            :title="group.fullLabel"
          >
            <span>{{ group.label }}</span>
            <span class="font-normal text-muted-foreground">
              {{ group.rows.length }} {{ group.rows.length === 1 ? 'session' : 'sessions' }}
            </span>
          </span>
        </li>

        <li
          v-for="row in group.rows"
          :key="row.id"
          class="grid grid-cols-[2.75rem_minmax(0,1fr)_5.5rem_4.5rem] items-center gap-2.5 rounded-sm px-1 py-1 text-[11px] hover:bg-muted/40"
          data-testid="session-row"
        >
          <span class="tabular-nums text-muted-foreground" :title="formatDateTime(row.startedAt)">
            {{ row.time }}
          </span>

          <!-- Project name takes the flex lane: it is the only field of variable length (up to 40
               characters in the real data), truncated by CSS rather than by cutting the string, so the
               browser decides what fits and the full name stays available on hover. -->
          <span class="truncate font-medium text-foreground" :title="row.projectName" data-testid="session-project">
            {{ row.projectName }}
          </span>

          <span class="truncate text-right text-muted-foreground" :title="row.language" data-testid="session-language">
            {{ row.language }}
          </span>

          <span class="whitespace-nowrap text-right tabular-nums text-muted-foreground" data-testid="session-duration">
            {{ formatDuration(row.durationSeconds) }}
          </span>
        </li>
      </template>
    </ScrollFadeList>

    <p class="text-right text-[11px] tracking-wide text-muted-foreground" data-testid="session-footer">
      Latest {{ sessionCount }}
      {{ sessionCount === 1 ? 'session' : 'sessions' }}
      <template v-if="dayCount > 0"> across {{ dayCount }} {{ dayCount === 1 ? 'day' : 'days' }}</template>
      <span v-if="moreBelow" class="text-muted-foreground/70"> · scroll for more</span>
    </p>
  </div>
</template>
