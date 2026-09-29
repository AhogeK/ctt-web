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
import { computed } from 'vue'
import { useStatsRecent } from '@/composables/useStats'
import { DEFAULT_RECENT_LIMIT } from '@/lib/api/stats'
import RecentSessionsList from './RecentSessionsList.vue'
import { groupSessions } from './session-groups'

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
</script>

<template>
  <RecentSessionsList :groups="groups" />
</template>
