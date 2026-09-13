<script setup lang="ts">
/**
 * RecentSessionsPanel — "Recent sessions": a log of the latest coding sessions,
 * grouped by local calendar day.
 *
 * This panel is a **new surface**, not plugin parity: the plugin's
 * `RecentActivityDataProvider` renders a 30-day activity chart, so there was no
 * prior art to copy and the design is argued from the data instead.
 *
 * Three decisions come from what the real dataset actually looks like:
 *
 * 1. **Grouped by local day, not a flat list.** Sessions cluster (five sharing
 *    one start second in the sample) and project names run to 40 characters.
 *    Moving "when" into a group heading buys back the row width those names
 *    need, and it gives same-instant clusters visible structure instead of five
 *    identical timestamps repeated down the column.
 * 2. **No duration total, anywhere.** Parallel sessions are legitimate, so a
 *    day's durations overlap in real time; a day sum would report more time than
 *    was actually spent coding. The heading carries a *count* instead. (Same
 *    reasoning that keeps `Total` off the distribution panels.)
 * 3. **Not a bar list.** Bar length only means something on a shared scale, and
 *    session durations are independent of each other — a bar would imply a
 *    proportion that does not exist.
 *
 * The endpoint takes `limit` / `deviceId` / `ideName` only: it has no date
 * window, so this panel deliberately does NOT follow the filter bar's period.
 * Origin filters (device / IDE) do apply, since "recent on this device" is a
 * question that has an answer.
 *
 * Data: GET /stats/recent — sessions ordered by start time, newest first.
 * Loading / error / empty shell lives in the parent ChartSection.
 */
import { computed, ref } from 'vue'
import { useStatsRecent } from '@/composables/useStats'
import { DEFAULT_RECENT_LIMIT } from '@/lib/api/stats'
import { formatDateTime, formatDuration } from '@/lib/utils'
import ScrollFadeList from './ScrollFadeList.vue'
import { groupSessions, sessionsAriaLabel } from './session-groups'

const props = defineProps<{
  /** Origin-device filter (null → all devices) */
  deviceId: string | null
  /** Exact IDE-name filter (null → all IDEs); mutually exclusive with deviceId */
  ideName: string | null
}>()

/** How many sessions to request — the API layer's own default, not a second literal. */
const SESSION_LIMIT = DEFAULT_RECENT_LIMIT

const sessions = useStatsRecent(
  computed(() => ({
    limit: SESSION_LIMIT,
    deviceId: props.deviceId ?? undefined,
    ideName: props.ideName ?? undefined,
  })),
)

const groups = computed(() => groupSessions(sessions.data.value ?? []))
const sessionCount = computed(() => groups.value.reduce((sum, group) => sum + group.rows.length, 0))
const dayCount = computed(() => groups.value.length)

const ariaLabel = computed(() => sessionsAriaLabel(groups.value))

/**
 * True while the log has rows below the fold — drives the footer's scroll hint.
 *
 * The hint matters more here than on the distribution list: 20 sessions always
 * exceed the 228px viewport (measured: 595px of content), so without it the
 * three visible groups look like the whole list.
 */
const moreBelow = ref(false)
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Height cap rationale (practices.md requires the derivation beside it):
         the same 228px viewport as the distribution list, but this card's chrome
         is taller — it replaces one header row with up to three day headings, each
         18px. The grid stretches row siblings, so the card lands on the same
         321px ceiling as Time of day (measured at 2621px two-column). -->
    <ScrollFadeList :a11y-label="ariaLabel" class="max-h-57" @overflow="(s) => (moreBelow = s.moreBelow)">
      <template v-for="group in groups" :key="group.key">
        <!-- Day heading. The date is the group's identity, so it is not repeated
             on every row; the count replaces a duration total on purpose (see
             the component docblock).

             Deliberately NOT sticky: the scroll region fades its top 18px (the
             shell's "more above" affordance), and a heading pinned at top:0 has
             its text at 2–20px — measured — i.e. inside that fade, so the label
             it exists to show would be exactly the thing dissolved. The heading
             scrolls like any other row instead. -->
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

          <!-- Project name takes the flex lane: it is the only field of variable
               length (up to 40 characters in the real data), and it is truncated
               by CSS rather than by cutting the string, so the browser decides
               what fits and the full name stays available on hover. -->
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
